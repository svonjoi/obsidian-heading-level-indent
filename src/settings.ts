import { App, PluginSettingTab, Setting } from 'obsidian';
import HeadingIndent from './main';

export interface HeadingIndentSettings {
	h1: string,
	h2: string,
	h3: string,
	h4: string,
	h5: string,
	h6: string,
	enable_shit_indenting: boolean,
}

export const DEFAULT_SETTINGS: HeadingIndentSettings = {
	h1: '30',
	h2: '50',
	h3: '70',
	h4: '90',
	h5: '110',
	h6: '130',
	enable_shit_indenting: true,
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
	
  private displayGeneralSetting(containerEl: HTMLElement) {
    // containerEl.createEl('h3', {text: t("VIEW_TRIGGER_SETTINGS")});
	
		new Setting(containerEl)
			.setName('Enable shit indenting?')
			// .setDesc('')
			// .setTooltip(tooltip: "assad")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enable_shit_indenting)
        .onChange(async (value) => {
          this.plugin.settings.enable_shit_indenting = value;
          // this.plugin.refreshViewTrigger();
          await this.plugin.saveSettings();
        }));
			}
}