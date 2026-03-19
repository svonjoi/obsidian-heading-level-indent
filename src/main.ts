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
import { initFrontmatterListener, getFrontmatterListener, cleanupFrontmatterListener } from "./FrontmatterListener";

export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;
	private frontmatterChangeHandler: (
		_newValue: string | null,
		_oldValue: string | null,
		_newFile: TFile | null,
		_oldFile: TFile | null
	) => void;

	// Configure resources needed by the plugin.
	async onload() {
		await this.loadSettings(); // await here and use this.settings after
		this.addSettingTab(new IndentSettingTab(this.app, this));

		// Initialize frontmatter listener FIRST (before registering extensions that use it)
		initFrontmatterListener(this.app);
		getFrontmatterListener().start();

		// Register editor extensions for editing mode
		this.registerEditorExtension(indentStateField);
		this.registerEditorExtension(indentEmbedsPlugin);
		this.registerEditorExtension(resizeNotificationPlugin);

		// Register post-processor for reading view and PDF export
		this.registerMarkdownPostProcessor((element, _context) => {
			RenderedModeIndenter.applyIndent(element, this.settings);
		}, 10);

		// Define and register the frontmatter change handler
		this.frontmatterChangeHandler = (
			_newValue: string | null,
			_oldValue: string | null,
			_newFile: TFile | null,
			_oldFile: TFile | null
		) => {
			// Handle reading view and pdf export
			if (getFrontmatterListener().isIndentEnabled()) {
				RenderedModeIndenter.applyToCurrentView(this.settings);
			} else {
				RenderedModeIndenter.clearCurrentView();
			}

			// Handle editing view (CodeMirror)
			this.app.workspace.iterateAllLeaves((leaf) => {
				const view = (leaf.view as any).editor?.cm as EditorView;
				if (view) {
					view.dispatch({
						effects: updateNeededNotificationEffect.of()
					});
				}
			});
		};

		getFrontmatterListener().addListener(this.frontmatterChangeHandler);

		// Set up observer for viewport changes when workspace is ready
		this.app.workspace.onLayoutReady(() => {
			RenderedModeIndenter.setupGlobalObserver(this.app, () => this.settings);
		});
	}

	/**
	 * Release any resources configured by the plugin; Automatically clean up registered event listeners
	 */
	onunload() {
		// Remove frontmatter listener to prevent memory leaks
		if (this.frontmatterChangeHandler) {
			getFrontmatterListener().removeListener(this.frontmatterChangeHandler);
		}

		// Clean up frontmatter listener singleton
		cleanupFrontmatterListener();

		// Clean up rendered mode resources
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
