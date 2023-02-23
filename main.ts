import { App, Editor, MarkdownView, Plugin, PluginSettingTab, MarkdownPostProcessorContext, Setting, MarkdownPreviewRenderer } from 'obsidian';

declare module "obsidian" {
	interface App {
		// trick con el <flag> para que la funcion se procese las minimas veces posibles
		flagExecute?: number,
		// save observer in app.variable in order to control and prevent stacking of observers
		leafObserver?: any
	}
}

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
	h1: '30',
	h2: '50',
	h3: '70',
	h4: '90',
	h5: '110',
	h6: '130',
}

// interface App2 extends App {
// 	flagExecute?: number;
// }
// const app2 = app as App2;
// if (app2.flagExecute === undefined) {
// 	app2.flagExecute = 1;
// }

// todo: test with 6 headings
// todo: settings instead styles.css


export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;

	// Configure resources needed by the plugin.
	async onload() {
		await this.loadSettings();
		
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new IndentSettingTab(this.app, this));
		
		// const selectElement = document.querySelector('.ice-cream');

		// this.registerDomEvent(document, 'keyup', (evt: KeyboardEvent) => {
		// 	if(evt.key === 'Control' || evt.key === 'Alt' || evt.key === 'Shift' || evt.key === 'Meta') {
		// 		return;
		// 	}
		// 	console.log("event 1");
			
		// });

		// this.registerDomEvent(document, 'mouseup', (evt: MouseEvent) => {
		// 	console.log("event 2");
		// });

		// attatchEventListeners(ctx: any, obsidian: ObsidianAPI, el: HTMLButtonElement) {
		// 	this.plugin.registerDomEvent(el, "click", async () => {
		// 		//stuff...
		// 	});
		// }


		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		// registerMarkdownPostProcessor callback is for creation of new html elements, but i have to 
		// manipulate the rendered dom of existing elements. for example the div that contains a paragraph. 
		// The callback `registerMarkdownPostProcessor` is called n times, depending on the number of elements
		// (paragraph, code-block, heading, etc) are modified before toggling to reading view. i.e., if i modify 
		// one header and 2 paragraps, this callback will be fired 3 times when reading view will be activated, 
		// each time passing the corresponding modified element. This precisely is the problem - i just need 
		// something like document.ready, that will be fire only once, when ALL modified elements are already 
		// rendered, so i can work on the whole rendered DOM and not on each modified element separately.
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		// this.registerMarkdownPostProcessor((el, ctx) => {

			// const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			// markdownView.previewMode.renderer.sections
			// console.log(markdownView.previewMode.renderer.sections);
			// const mode = markdownView.getMode();

			// wrapperZahuyaritIndent(this);
		// }, 0)

		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		// When obsidian in started
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		this.app.workspace.onLayoutReady(() => {
			console.log("⭐onLayoutReady");

			// wrapperZahuyaritIndent(this,100);
			// wrapperZahuyaritIndent(this,300);
			wrapperZahuyaritIndent(this,1000);

            setObserverToActiveLeaf(this);
        });

		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		// When tab is switched
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
			console.log("⭐⭐event:active-leaf-change");

			/**
			 * run directly (without timeout & flag) in order to apply indent faster
			 * process the sections that are already rendered; the rest of the sections
			 * (which not rendered yet) we will process with observer callback
			 */
			zahuyaritIndent(this);

			/**
			 * when leaf is opened <in new tab> from <quick-switcher> and its content fits into
			 * the <viewport>, its not triggering observer callback, I guess its cuz the divs are 
			 * rendered at once
			 * 
			 * ? I think will be better run this func without flag, so in other cases it
			 * ? wont be blocking subsequent calls from observer callback 
			 */
			wrapperZahuyaritIndent(this,100);

			setObserverToActiveLeaf(this);
		}));

	}

	// Release any resources configured by the plugin.
	onunload() {
		if (app.leafObserver !== undefined) app.leafObserver.disconnect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, MARGINS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		zahuyaritIndent(this);
	}

}


/**
 * The observer callback will fire each time childList (divs) are added or removed
 * 
 * 1. When reading-mode is toggled || when we switch to another note, the divs will
 *    render and the callback will be triggered
 * 
 * 2. If the active leaf is large (preview is codemirror and it supports huge files) 
 * 	  the callback triggers while we scroll, cuz the editor only renders the editor's
 *    viewport (that renders only what's is visible)
 *    https://marcus.se.net/obsidian-plugin-docs/editor/extensions/viewport
 * 
 * 3. Trigger when heading fold/unfold in preview
 * 	  Why? Para ejecutar la funcion principal cada vez q hacemos fold/unfold, ya que si
 * 	  abrimos nota y algun heading esta oculto, la funcion al ejecutarse previamente 
 * 	  no hizo nada con esos divs porque cuando estan ocultos, desaparecen del DOM
 */
export async function setObserverToActiveLeaf(plugin: HeadingIndent){

	if (app.leafObserver !== undefined){
		// prevent stacking: disconnect existing observer first before creating a new one
		app.leafObserver.disconnect();
	}

	// todo: not working if note is opened from quick-switcher (AS NEW TAB) - the observer seems to append to another leaf
	// Select the node that will be observed for mutations
	const targetNode = document.querySelector('.workspace-leaf.mod-active .markdown-preview-section'); // querySelectorAll
	
	// if new tab is opened (ctrl+t) the leaf is empty and targetNode is null
	if (targetNode === null){
		// console.log("target node is NULL");
		return;
	}

	// Options for the observer (which mutations to observe)
	const config = { childList: true };

	// Callback function to execute when mutations are observed
	const callback = (mutationList: any, observer: any) => {
		
		for (const mutation of mutationList) {

			if (mutation.type === 'childList') {
				console.log('A child node has been added or removed.');
				wrapperZahuyaritIndent(plugin,100);
			}
		}
	};

	// Create an observer instance linked to the callback function
	app.leafObserver = new MutationObserver(callback);
	// Start observing the target node for configured mutations
	app.leafObserver.observe(targetNode, config);
}

/**
 * trick con el <flag> 
 * <timeout> in order to process when the "sections" are already rendered
 */
export async function wrapperZahuyaritIndent(plugin: HeadingIndent, timeout: number){
	// (app as any).flagExecute

	timeout = timeout || 100;

	if (app.flagExecute == undefined) app.flagExecute = 1;
	
	if (app.flagExecute == 1){

		// console.log("za-e-b-a-shit");
		app.flagExecute = 2;

		setTimeout(async function(){
			zahuyaritIndent(plugin);
		  }, timeout)
		  
		setTimeout(() => {
			app.flagExecute = 1;
		}, timeout+50)
	}

}

export async function zahuyaritIndent(plugin: HeadingIndent) {
	const settings = plugin.settings;
	
	console.log("🌲🌲🌲🌲🌲🌲🌲🌲 zahuyaritIndent");

	const divsNodeList = document.querySelectorAll<HTMLElement>('.workspace-leaf.mod-active .markdown-reading-view .markdown-preview-section > div');
	if (!divsNodeList){return}
	
	const arrDivs = Array.from(divsNodeList);
	const excludedClassNames = ['mod-header', 'mod-footer', 'markdown-preview-pusher'];
	
	// console.log("ZAVALI");
	// console.log(typeof(arrDivs[0]));
	// console.log(arrDivs[0]);

	// Remove all classes that we will assign in this func
	remove_all_classes(arrDivs);


	const arrMargins: Dictionary<number> = {
		0: 0, // no heading
		1: parseInt(settings.h1) || 0,
		2: parseInt(settings.h2) || 0,
		3: parseInt(settings.h3) || 0,
		4: parseInt(settings.h4) || 0,
		5: parseInt(settings.h5) || 0,
		6: parseInt(settings.h6) || 0,
	};


	// let h: number = 0;

	const arrStruct = [];

	//? ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//? Assign classes to divs && build arrStruct
	//? ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	suck: for (const div of arrDivs) {

		// skip excluded content
		if (excludedClassNames.some(className => div.classList.contains(className))) {
			continue suck;
		}

		// div.classList.remove("HEADER");
		// div.classList.remove("DATA");

		// clear div margin before assign
		// div.style.marginLeft = "0";

		// console.log("div);

		let heading = div.querySelectorAll('h1, h2, h3, h4, h5, h6'),
			current_div_is_heading = heading.length > 0;


		if (current_div_is_heading) {
			
			// set heading level in order to indent its childs
			let hTag = heading[0].tagName.toLowerCase(),
				h = parseInt(hTag.replace(/^\D+/g, '')); // h5 -> 5, h1 -> 1, etc.
			
			let hNumber = parseInt(hTag.replace(/^\D+/g, '')); // h5 -> 5, h1 -> 1, etc.

			var objAux: Dictionary<any> = {
				"type": "heading",
				"headingTag": hTag,
				"headingNumber": hNumber,
				"headingText": heading[0].textContent
			};

			div.classList.add("heading_"+hTag);

			// set previous heading margin for current heading div
			// div.style.marginLeft = arrMargins[h-1]+"px";
			// continue suck;

		}else{

			var objAux: Dictionary<any> = {
				"type": "data",
			};
			
			// determine heading of current data div (search for latest heading div)
			jerkoff: for (let index = arrStruct.length - 1; index >= 0; index--) {

				if (arrStruct[index]["type"] == "heading"){

					objAux["heading"] = arrStruct[index];

					div.classList.add("data_"+arrStruct[index]['headingTag']);
					break jerkoff;
				}
				
			}

			if (!('heading' in objAux)){
				objAux["heading"] = "none";
			}

			// if current div is "under" heading, set corresponding margin
			// div.style.marginLeft = arrMargins[h]+"px";
		}

		arrStruct.push(objAux);
	}
	

	// console.log(arrStruct);

	//? ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//? loop structure and set margins
	//? ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	coca: for (const div of arrStruct) {

		
		if (div.type == "data"){
			// console.log(div);
		}

		//todo: buscar cada elemento por clase y aplicar estilos en raw con settings (quitar estilos de styles.css)

	}
}

function remove_all_classes(arrDivs: any) {

	// (!) remove all classes that we will assign in this func
	for (const div of arrDivs) {
		div.classList.forEach((item: string)=>{
			if(item.startsWith('data_') || item.startsWith('heading_')) {
				div.classList.remove(item) ;
			}
		})
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