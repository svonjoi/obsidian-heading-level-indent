import { App, PluginSettingTab, Setting } from 'obsidian';
import HeadingIndent from './main';

export interface HeadingIndentSettings {
	h1: string,
	h2: string,
	h3: string,
	h4: string,
	h5: string,
	h6: string,
	enableReading: boolean,
	enableEditing: boolean,
}

export const DEFAULT_SETTINGS: HeadingIndentSettings = {
	h1: '30',
	h2: '50',
	h3: '70',
	h4: '90',
	h5: '110',
	h6: '130',
	enableReading: true,
	enableEditing: true,
}

export class IndentSettingTab extends PluginSettingTab {
	plugin: HeadingIndent;

	constructor(app: App, plugin: HeadingIndent) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		this.displayGeneralSetting(containerEl);

		containerEl.createEl('h3', {text: 'Set indentation for the content of each heading in pixels'});

		containerEl.createEl('div',{
			text: `Indentation applied for the heading lines itself will be the same as the
						content of inmediately previous heading. For example, if the indentation 
						for the content of H3 is set to 70 pixels, H2 heading line itself
						will be indented the same`,
			attr: {style: 'margin-bottom: 10px; color: gray;'}
		});

		new Setting(containerEl)
			.setName('Content under H1')
			.addText(number => number
				.setPlaceholder('')
				.setValue(this.plugin.settings.h1)
				.onChange(async (value) => {
					this.plugin.settings.h1 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Content under H2')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h2)
				.onChange(async (value) => {
					this.plugin.settings.h2 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Content under H3')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h3)
				.onChange(async (value) => {
					this.plugin.settings.h3 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Content under H4')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h4)
				.onChange(async (value) => {
					this.plugin.settings.h4 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Content under H5')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h5)
				.onChange(async (value) => {
					this.plugin.settings.h5 = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Content under H6')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.h6)
				.onChange(async (value) => {
					this.plugin.settings.h6 = value;
					await this.plugin.saveSettings();
				}));
	}
	
  private displayGeneralSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName('Enable in editing mode? (reload required)')
			.addToggle(toggle => toggle
			.setValue(this.plugin.settings.enableEditing)
			.onChange(async (value) => {
				this.plugin.settings.enableEditing = value;
				await this.plugin.saveSettings();
			}));
		new Setting(containerEl)
			.setName('Enable in reading view?')
			.addToggle(toggle => toggle
			.setValue(this.plugin.settings.enableReading)
			.onChange(async (value) => {
				this.plugin.settings.enableReading = value;
				// this.plugin.refreshViewTrigger();
				await this.plugin.saveSettings();
			}));
	}
}