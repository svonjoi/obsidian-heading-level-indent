/* eslint-disable @typescript-eslint/no-unused-vars */
// ? styles.css
import { MarkdownView, Plugin } from 'obsidian';
import { ShitIndenting } from "./shit_indenting";
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

    console.log("enable shit?", this.settings.enableReading);

    if (this.settings.enableReading) {
      this.shitRunner();
    }

    this.registerEditorExtension(indentStateField);
    // this.registerEditorExtension(indentLinesStateField);
    // this.registerEditorExtension(indentedLineWrap);
	}

  // todo: reference for postprocessor for reading view
  // https://github.com/andyzito/obsidian-nice-kbds/blob/19eb45a607d15fb4ca5560947497da4ab77d22bc/main.ts#L183
  
  /**
   * Release any resources configured by the plugin
   * Automatically clean up registered event listeners
   */ 
	onunload() {
		this.shitCleaner();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
    
    // console.log(this.settings.enableReading);
    if (this.settings.enableReading){
      this.shitRunner();
    }else{
      this.shitCleaner();
    }
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
      console.log("🦎(e)layout-ready");
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
      console.log("🦎(e)layout-change");
      if (mode == "preview"){
        this.shitIndenting.applyIndent(this,0,false,"layout-change");
        this.shitIndenting.setObserverToActiveLeaf(this);
      }
    });
    
    // when the currently active leaf (tab or pane) in the workspace changes
    // opening a new file, switching between files, or switching between edit and preview mode
    this.activeLeafChangeListener = this.app.workspace.on('active-leaf-change', (leaf) => {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView || 'markdown' !== activeView.getViewType()){
        return;
      }
      console.log("🦎(e)active-leaf-change");
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
  }
}

/*
this.registerEvent(this.app.workspace.on("editor-change", (editor: Editor, MarkdownView: MarkdownView) => {
	// let currentLine = editor.getCursor().line;
	// console.log(editor.getLine(currentLine));
}));
*/

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// registerMarkdownPostProcessor callback is for creation of new html elements, but i have to 
// modify already rendered DOM elements. I.e. the div contains a paragraph. 
// The callback `registerMarkdownPostProcessor` is called n times, depending on the number of elements
// (paragraph, code-block, heading, etc) are modified before toggling to reading view. i.e., if i modify 
// one header and 2 paragraps, this callback will be fired 3 times when reading view will be activated, 
// each time passing the corresponding modified element. This precisely is the problem - i just need 
// something like document.ready, that will be fire only once, when ALL modified elements are already 
// rendered, so i can work on the whole rendered DOM and not on each modified element separately.
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
this.registerMarkdownPostProcessor((el, ctx) => {

	const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
	const mode = markdownView.getMode();
	markdownView.previewMode.renderer.sections
	console.log(markdownView.previewMode.renderer.sections);

	applyIndent(this,100,true);
}, 0)
*/
