import { EditorView } from "@codemirror/view";
import { MarkdownView, Plugin, TFile } from "obsidian";
import {
	indentEmbedsPlugin,
	indentStateField,
	resizeNotificationPlugin,
	updateNeededNotificationEffect
} from "./editingMode";
import { RenderedModeIndenter } from "./renderedMode";
import { DEFAULT_SETTINGS, HeadingIndentSettings, IndentSettingTab } from "./settings";
import { initFrontmatterListener, getFrontmatterListener } from "./FrontmatterListener";

export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;
	activeLeafChangeListener: any;
	layoutChange: any;

	constructor(app: any, manifest: any) {
		super(app, manifest);
		initFrontmatterListener(this.app);
		getFrontmatterListener().start();
		getFrontmatterListener().addListener(
			(
				_newValue: string | null,
				_oldValue: string | null,
				_newFile: TFile | null,
				_oldFile: TFile | null
			) => {
				// console.log(`HeadingIndent received change notification: ${_oldValue} -> ${_newValue}`);

				// Handle reading view (preview mode)
				if (getFrontmatterListener().isIndentEnabled()) {
					RenderedModeIndenter.applyToCurrentView(this.settings);
				} else {
					RenderedModeIndenter.clearCurrentView();
				}

				// Handle editing view (CodeMirror)
				this.app.workspace.iterateAllLeaves((leaf) => {
					var _a;
					const view = (_a = (leaf.view as MarkdownView).editor) == null ? void 0 : (_a as any).cm;
					if (view) {
						view.dispatch({
							effects: updateNeededNotificationEffect.of()
						});
					}
				});
			}
		);
	}

	// Configure resources needed by the plugin.
	async onload() {
		await this.loadSettings(); // await here and use this.settings after
		this.addSettingTab(new IndentSettingTab(this.app, this));

		if (this.settings.enableEditing) {
			this.registerEditorExtension(indentStateField);
			this.registerEditorExtension(indentEmbedsPlugin);
			this.registerEditorExtension(resizeNotificationPlugin);
		}
		this.registerMarkdownPostProcessor((element, _context) => {
			RenderedModeIndenter.applyIndent(element, this.settings);
		}, 10);

		// Set up observer for viewport changes when workspace is ready
		this.app.workspace.onLayoutReady(() => {
			RenderedModeIndenter.setupGlobalObserver(this.app, () => this.settings);
		});
	}

	/**
	 * Release any resources configured by the plugin; Automatically clean up registered event listeners
	 */
	onunload() {
		RenderedModeIndenter.cleanup();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = (leaf.view as any).editor?.cm as EditorView;
			if (view) {
				view.dispatch({
					effects: updateNeededNotificationEffect.of()
				});
			}
		});
	}
}
