/* eslint-disable @typescript-eslint/no-unused-vars */
import { MarkdownView, Plugin } from 'obsidian';
import { ShitIndenting } from "./readingMode";
import { IndentSettingTab, HeadingIndentSettings, DEFAULT_SETTINGS } from './settings';
import { indentStateField } from "./editingMode";

export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;
  shitIndenting: ShitIndenting;
  activeLeafChangeListener: any;
  layoutChange: any;

	// Configure resources needed by the plugin.
	async onload() {

		await this.loadSettings(); // await here and use this.settings after
		this.addSettingTab(new IndentSettingTab(this.app, this));

    if (this.settings.enableReading) this.shitRunner();
    if (this.settings.enableEditing) this.registerEditorExtension(indentStateField);
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
      if (!activeView || 'markdown' !== activeView.getViewType()){
        return;
      }
      const view = activeView as MarkdownView;
      const mode = view.getMode();
      // console.log("🦎(e)layout-change");
      if (mode == "preview"){
        this.shitIndenting.applyIndent(this,0,false,"layout-change");
        this.shitIndenting.setObserverToActiveLeaf(this);
      }
    });

    // When the window resizes :D maybe
    this.paneResize = this.app.workspace.on('resize', (leaf) => {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView || 'markdown' !== activeView.getViewType()){
	return;
      const view = activeView as MarkdownView;
      const mode = view.getMode();
      if (mode == "preview"){
        this.shitIndenting.applyIndent(this,500,false,"layout-change");
        this.shitIndenting.setObserverToActiveLeaf(this);
      }
    }
					    
    // when the currently active leaf (tab or pane) in the workspace changes
    // opening a new file, switching between files, or switching between edit and preview mode
    this.activeLeafChangeListener = this.app.workspace.on('active-leaf-change', (leaf) => {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView || 'markdown' !== activeView.getViewType()){
        return;
      }
      // console.log("🦎(e)active-leaf-change");
      const view = activeView as MarkdownView;
      const mode = view.getMode(); // source, preview
      if (mode == "preview"){
        // process the sections that are already rendered
        this.shitIndenting.applyIndent(this,0,false,"active-leaf-change-1"); 
        // when leaf is opened in <new-tab> from <qs> and it's content fits into <viewport>
        this.shitIndenting.applyIndent(this,200,false,"active-leaf-change-2"); 
        this.shitIndenting.setObserverToActiveLeaf(this);
      }
    });
  }

  shitCleaner() {
    this.shitIndenting && this.shitIndenting.previewObserver && this.shitIndenting.previewObserver.disconnect();
    // todo: is this working?
    this.app.workspace.offref(this.activeLeafChangeListener);
    this.app.workspace.offref(this.layoutChange);
    this.app.workspace.offref(this.paneResize);
  }
}
