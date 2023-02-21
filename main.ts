import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface HeadingIndentSettings {
	h1: string,
	h2: string,
	h3: string,
	h4: string,
	h5: string,
	h6: string,
}

interface Dictionary<Type> {
	[key: string]: Type;
 }

const MARGINS: HeadingIndentSettings = {
	h1: '50',
	h2: '100',
	h3: '150',
	h4: '0',
	h5: '0',
	h6: '0',
}

export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;

	// Configure resources needed by the plugin.
	async onload() {
		await this.loadSettings();
		
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new IndentSettingTab(this.app, this));
		
		// fire
		this.registerMarkdownPostProcessor((element, context) => {
			this.makeHeadingIndent();
		});
	}

	// Release any resources configured by the plugin.
	onunload() {

	}

	async makeHeadingIndent() {
		
		// console.log(this.settings);

		const divs = document.querySelectorAll<HTMLElement>('.markdown-reading-view .markdown-preview-section > div'),
			  arrDivs = Array.from(divs),
			  excludedClassNames = ['mod-header', 'mod-footer', 'markdown-preview-pusher'];
		
		const arrClasses: Dictionary<string> = {
					0: 'no_heading',
					1: 'h1_child_el',
					2: 'h2_child_el',
					3: 'h3_child_el',
					4: 'h4_child_el',
					5: 'h5_child_el',
					6: 'h6_child_el'
				};

		const arrMargins: Dictionary<number> = {
					0: 0, // no heading
					1: parseInt(this.settings.h1),
					2: parseInt(this.settings.h2),
					3: parseInt(this.settings.h3),
					4: parseInt(this.settings.h4),
					5: parseInt(this.settings.h5),
					6: parseInt(this.settings.h6)
				};

		let h: number = 0,
			headingTree = [];

		suck: for (const div of arrDivs) {

			// skip excluded content
			if (excludedClassNames.some(className => div.classList.contains(className))) {
				continue suck;
			}

			// clear all classes before assign
			for (const [num, classN] of Object.entries(arrClasses)) {
				div.classList.remove(classN);
			}

			// clear div margin before assign
			div.style.marginLeft = "0";

			// console.log("div);

			let heading = div.querySelectorAll('h1, h2, h3, h4, h5, h6'),
				current_div_is_heading = heading.length > 0;

			if (current_div_is_heading) {
				
				// 1. set heading level in order to indent its childs
				let hTag = heading[0].tagName.toLowerCase();
				h = parseInt(hTag.replace(/^\D+/g, '')); // h5 -> 5, h1 -> 1, etc.
				
				headingTree.push(h);

				// 2. set indent of the current heading div the same as content under its parent-heading 
				// inverse loop: start at the end of the array and go backwards from there.
				for (let index = headingTree.length - 1; index >= 0; index--) {

					let prev_h:number = headingTree[index];
					
					// first occurrence == heading parent of actual div in headingTree
					if (prev_h < h){
						// set text class of parent tree for current heading-div
						// div.classList.add(arrClasses[prev_h]);
						div.style.marginLeft = arrMargins[prev_h]+"px";
						continue suck;
					}
				}
			}
		
			// if current div is "under" heading, determine indent class and append on it
			// div.classList.add(arrClasses[h]);
			div.style.marginLeft = arrMargins[h]+"px"; 
		}
		
	}

	async loadSettings() {
		this.settings = Object.assign({}, MARGINS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.makeHeadingIndent();
	}

}



class IndentSettingTab extends PluginSettingTab {
	plugin: HeadingIndent;

	constructor(app: App, plugin: HeadingIndent) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Set identations for each heading (in pixels)'});

		new Setting(containerEl)
			.setName('H1 Identation')
			// .setDesc('')
			// .setTooltip(tooltip: "assad")
			.addText(number => number
				.setPlaceholder('')
				.setValue(this.plugin.settings.h1)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.h1 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('H2 Identation')
			// .setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h2)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.h2 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('H3 Identation')
			// .setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h3)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.h3 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('H4 Identation')
			// .setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h4)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.h4 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('H5 Identation')
			// .setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h5)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.h5 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('H6 Identation')
			// .setDesc('')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h6)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.h6 = value;
					await this.plugin.saveSettings();
				}));
	}
}
