/* eslint-disable @typescript-eslint/no-unused-vars */
import { EditorView } from "@codemirror/view";
import { MarkdownView, Plugin } from "obsidian";
import {
	indentEmbedsPlugin,
	indentStateField,
	resizeNotificationPlugin,
	updateNeededNotificationEffect
} from "./editingMode";
import { ShitIndenting } from "./readingMode";
import { DEFAULT_SETTINGS, HeadingIndentSettings, IndentSettingTab } from "./settings";
import {
	initVHeadingLevelIndentListener, 
	getVHeadingLevelIndentListener
} from "./VHeadingLevelIndentListener";

export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;
	shitIndenting: ShitIndenting;
	activeLeafChangeListener: any;
	layoutChange: any;
	
	constructor(app: any, manifest: any) {
		super(app, manifest);
		initVHeadingLevelIndentListener(this.app);
		getVHeadingLevelIndentListener().start();
		getVHeadingLevelIndentListener().addListener((newValue, oldValue) => {
			console.log(`HeadingIndent received change notification: ${oldValue} -> ${newValue}`);

			if(getVHeadingLevelIndentListener().currentVHeadingLevelIndent !== "0"){
				this.shitRunner();
				if(this.shitIndenting)
					this.shitIndenting.applyToCurrentView(this);
			}
			else{
				this.shitCleaner();
				if(this.shitIndenting)
				if(oldValue==null && newValue=="0")
					setTimeout(() => {this.shitIndenting.clearCurrentView();},250);
				else
					this.shitIndenting.clearCurrentView()
			}

			this.app.workspace.iterateAllLeaves((leaf) => {
				var _a;
				const view = (_a = (leaf.view as MarkdownView).editor) == null ? void 0 : (_a as any).cm;
				if (view) {
					view.dispatch({
						effects: updateNeededNotificationEffect.of()
					});
				}
			});
		});
	}

	// Configure resources needed by the plugin.
	async onload() {
		await this.loadSettings(); // await here and use this.settings after
		this.addSettingTab(new IndentSettingTab(this.app, this));

		if (this.settings.enableReading) this.shitRunner();
		if (this.settings.enableEditing) {
			this.registerEditorExtension(indentStateField);
			this.registerEditorExtension(indentEmbedsPlugin);
			this.registerEditorExtension(resizeNotificationPlugin);
		}
		this.registerMarkdownPostProcessor((element, context) => {
			this.applyIndentToMarkdown(element);
		}, 10);
	}

	/**
	 * Release any resources configured by the plugin; Automatically clean up registered event listeners
	 */
	onunload() {
		this.shitCleaner();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.settings.enableReading ? this.shitRunner() : this.shitCleaner();
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = (leaf.view as any).editor?.cm as EditorView;
			if (view) {
				view.dispatch({
					effects: updateNeededNotificationEffect.of()
				});
			}
		});
	}

	/**
	 * Run shit that is trying to follow the viewport, applying indentings
	 * each time the HTML in preview mode is recomputed
	 *
	 * Problems
	 * - if heading content is very big and is scrolled far out from viewport, indent stop working
	 * - small delay becouse indenting is applied over already computed html
	 *
	 */
	shitRunner() {
		this.shitIndenting = new ShitIndenting(this);

		// When obsidian is started
		this.app.workspace.onLayoutReady(() => {
			// console.log("🦎(e)layout-ready");
			// seems not to be neccessary, but i'll keep this shit for now
			// this.shitIndenting.applyIndent(this,100,false,"layout-ready");
			// this.shitIndenting.applyIndent(this,300,false,"layout-ready");
			// this.shitIndenting.applyIndent(this,1000,false,"layout-ready");
			// this.shitIndenting.setObserverToActiveLeaf(this);
		});

		// When toggle between edit and preview view
		this.layoutChange = this.app.workspace.on("layout-change", () => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView || "markdown" !== activeView.getViewType()) {
				return;
			}
			const view = activeView as MarkdownView;
			const mode = view.getMode();
			// console.log("🦎(e)layout-change");
			if (mode == "preview") {
				this.shitIndenting.applyIndent(this, 0, false, "layout-change");
				this.shitIndenting.setObserverToActiveLeaf(this);
			}
		});

		// when the currently active leaf (tab or pane) in the workspace changes
		// opening a new file, switching between files, or switching between edit and preview mode
		this.activeLeafChangeListener = this.app.workspace.on("active-leaf-change", (leaf) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView || "markdown" !== activeView.getViewType()) {
				return;
			}
			// console.log("🦎(e)active-leaf-change");
			const view = activeView as MarkdownView;
			const mode = view.getMode(); // source, preview
			if (mode == "preview") {
				// process the sections that are already rendered
				this.shitIndenting.applyIndent(this, 0, false, "active-leaf-change-1");
				// when leaf is opened in <new-tab> from <qs> and it's content fits into <viewport>
				this.shitIndenting.applyIndent(this, 200, false, "active-leaf-change-2");
				this.shitIndenting.setObserverToActiveLeaf(this);
			}
		});
	}

	shitCleaner() {
		this.shitIndenting &&
			this.shitIndenting.previewObserver &&
			this.shitIndenting.previewObserver.disconnect();
		// todo: is this working?
		this.app.workspace.offref(this.activeLeafChangeListener);
		this.app.workspace.offref(this.layoutChange);
	}
	
	// New method: Apply indentation to Markdown elements
	applyIndentToMarkdown(element: HTMLElement) {
		if (getVHeadingLevelIndentListener().currentVHeadingLevelIndent === "0")
			return;

		// Run only once on the root container to avoid duplicate processing
		if (!element.classList.contains('markdown-preview-view')) {
			return;
		}

		const settings = this.settings;
		const selectors = [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'p',
			'ul',
			'ol',
			'blockquote',
			'table',
			'pre',
			'div.callout'
		];
		const divs = element.querySelectorAll(selectors.map(tag => `div > ${tag}`).join(', '));

		let currentHeadingLevel = 0;
		let lastHeadingElement = null;

		const divsArray = Array.from(divs);
		// Iterate through all elements
		for (const element2 of divsArray) {
			// Skip inline title, which is also h1
			if (element.closest('.print') !== null && element2.classList.contains('__title__')) {
			  console.log('PDF export: Skip inline title, dont number its heading');
			  continue;
			}
			
			const tagName = element2.tagName.toLowerCase();

			// If it's a heading
			if (tagName.match(/^h[1-6]$/)) {
				const level = parseInt(tagName.charAt(1));
				currentHeadingLevel = level;
				lastHeadingElement = element2 as HTMLElement;

				// Set the heading's indentation (using the previous heading level's indentation value)
				const parentDiv = element2.parentElement;
				if (parentDiv && parentDiv.tagName === 'DIV') {
					const indent = (settings as any)[`h${level - 1}`] || 0;
					parentDiv.style.paddingLeft = `${indent}px`;
					parentDiv.classList.add(`heading_h${level}`);
				}
			}
			// If it's a content element
			else if (currentHeadingLevel > 0) {
				// Find the div containing this content
				const parentDiv = element2.parentElement;
				if (parentDiv && parentDiv.tagName === 'DIV' && parentDiv !== lastHeadingElement?.parentElement) {
					const indent = (settings as any)[`h${currentHeadingLevel}`] || 0;
					parentDiv.style.paddingLeft = `${indent}px`;
					parentDiv.classList.add(`data_h${currentHeadingLevel}`);
				}
			}
		}
	}
}
