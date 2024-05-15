import { MarkdownView, Plugin } from 'obsidian';
import { applyIndent, setObserverToActiveLeaf } from "./preview_indenting";
import { IndentSettingTab, HeadingIndentSettings, DEFAULT_SETTINGS } from './settings';

export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;
  // todo: pass this shit to the other file
	flagExecute?: number; // flag to control that the indenting is applied the minimum number of times
	previewObserver?: MutationObserver; // save observer in app.variable in order to control and prevent stacking of observers

	// Configure resources needed by the plugin.
	async onload() {

		// When obsidian is started
		this.app.workspace.onLayoutReady(() => {
			// console.log("🦎(e)layout-ready");
      // seems not to be neccessary, but i'll keep this shit for now
			applyIndent(this,100,false);
			applyIndent(this,300,false);
			applyIndent(this,1000,false);
			setObserverToActiveLeaf(this);
		});

		// When toggle between edit and preview view
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView || 'markdown' !== activeView.getViewType()){
					return;
				}
				const view = activeView as MarkdownView;
        const mode = view.getMode();
        // console.log("🦎(e)layout-change");
        if (mode == "preview"){
          applyIndent(this,0,false);
          setObserverToActiveLeaf(this);
        }
			}
		));
		
    // when the currently active leaf (tab or pane) in the workspace changes
    // opening a new file, switching between files, or switching between edit and preview mode
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView || 'markdown' !== activeView.getViewType()){
					return;
				}
				// console.log("🦎(e)active-leaf-change");
				const view = activeView as MarkdownView;
				const mode = view.getMode(); // source, preview
        if (mode == "preview"){
          // process the sections that are already rendered
          applyIndent(this,0,false); 

          // when leaf is opened in <new-tab> from <qs> and it's content fits into <viewport>
          applyIndent(this,100,false); 

          setObserverToActiveLeaf(this);
        }
			})
		);

		await this.loadSettings();

		// add a settings tab
		this.addSettingTab(new IndentSettingTab(this.app, this));
	}

	// Release any resources configured by the plugin.
	onunload() {
		this.previewObserver && this.previewObserver.disconnect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		applyIndent(this,0,false);
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
