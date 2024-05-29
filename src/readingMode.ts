import HeadingIndent from './main';
// import { App, Editor, MarkdownView, Setting } from 'obsidian';
// import { DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

// todo: reference for postprocessor for reading view
// https://github.com/andyzito/obsidian-nice-kbds/blob/19eb45a607d15fb4ca5560947497da4ab77d22bc/main.ts#L183

interface Dictionary<Type> {
	[key: string]: Type;
}

export class ShitIndenting {
	flagExecute?: number; // flag to control that the indenting is applied the minimum number of times
	previewObserver?: MutationObserver; // save observer in app.variable in order to control and prevent stacking of observers

  private containerSelector = ".workspace-leaf.mod-active .markdown-reading-view .markdown-preview-section";

  private arrClassesHeadings: Dictionary<string> = {
    1: "heading_h1",
    2: "heading_h2",
    3: "heading_h3",
    4: "heading_h4",
    5: "heading_h5",
    6: "heading_h6",
  };

  private arrClassesData: Dictionary<string> = {
    0: "data_no-heading",
    1: "data_h1",
    2: "data_h2",
    3: "data_h3",
    4: "data_h4",
    5: "data_h5",
    6: "data_h6",
  };

  constructor(private plugin: HeadingIndent) {}

  /**
   * sets up a MutationObserver on the active leaf in Obsidian. The observer watches for changes in the
   * child elements of the target node (which is a section of the Markdown preview). When changes are
   * detected, it calls the applyIndent function
   *
   *   - When preview is toggled and there are changes in sections to be rendered
   *   - When switch note, the sections will be rendered
   *   - When heading is folded or unfolded (html is not exist in the DOM if its folded)
   *
   * If the active leaf is large (preview is codemirror and it
   * supports huge files) the callback triggers while we scroll, cuz the editor only
   * renders the editor's viewport (that renders only what's is visible)
   * https://marcus.se.net/obsidian-plugin-docs/editor/extensions/viewport
   *
   */
  setObserverToActiveLeaf(plugin: HeadingIndent){

    if (this.previewObserver !== undefined){
      // prevent stacking: disconnect existing observer first before creating a new one
      // console.log("prevent stacking: disconnect existing observer first before creating a new one");
      this.previewObserver.disconnect();
    }

    // `activeDocument` instead of `document` to make it work in obsidian-popups
    const targetNode = activeDocument.querySelector(this.containerSelector);

    // if new tab is opened (ctrl+t) the leaf is empty and targetNode is null
    if (targetNode == null){
      // console.log("target node is NULL");
      return;
    }

    // Options for the observer (which mutations to observe)
    const config = { childList: true };

    // Callback function to execute when mutations are observed
    const callback: MutationCallback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
          // when viewport is changed (scrolling, resizing, folding/unfolding headings)
          this.applyIndent(plugin,0,true,"mutation");
        }
      }
    };

    // Create an observer instance linked to the callback function
    this.previewObserver = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    this.previewObserver.observe(targetNode, config);
  }

  /**
   * sets a timeout to call the applyIndentation function. It uses a flag 
   *
   * @param timeout 	in order to process when the "sections" are already rendered
   * @param flag 		  see this.flagExecute interface
   */
  applyIndent(plugin: HeadingIndent, timeout: number, flag: boolean, text: string | undefined = ""){

    // console.log(`🌀 applyIndent (${text}) -> timeout:${timeout} flag:${flag}`);

    timeout = timeout || 0;

    if (timeout == 0 && flag === false){
      this.applyIndentation(plugin);
      return;
    }

    if (flag){
      if (this.flagExecute == undefined || this.flagExecute == 1){
        this.flagExecute = 2;

        setTimeout(() => {
          this.applyIndentation(plugin);
        }, timeout)
        
        setTimeout(() => {
          this.flagExecute = 1;
        }, timeout+50)
      }
    }else{
      setTimeout(() => {
        this.applyIndentation(plugin);
      }, timeout)
    }
  }

  /**
   * applies indentation to the headings in the Markdown preview. It selects all the div
   * elements in the preview, removes any previous modifications, and then applies new
   * styles based on the heading level. The indentation levels are configurable through
   * the plugin settings
   */
  private applyIndentation(plugin: HeadingIndent) {
    const settings = plugin.settings;

    const divsNodeList = activeDocument.querySelectorAll<HTMLElement>(this.containerSelector + " > div");
    if (!divsNodeList) { return }

    const arrDivs = Array.from(divsNodeList);

    // do not process divs with followings classes
    const excludedClassNames = ['mod-header', 'mod-footer', 'markdown-preview-pusher'];

    this.cleanSectionModifications(arrDivs);

    const arrMargins: Dictionary<number> = {
      0: 0, // no heading
      1: parseInt(settings.h1) || 0,
      2: parseInt(settings.h2) || 0,
      3: parseInt(settings.h3) || 0,
      4: parseInt(settings.h4) || 0,
      5: parseInt(settings.h5) || 0,
      6: parseInt(settings.h6) || 0,
    };

    let hNumber = 0;

    suck: for (const div of arrDivs) {

      // skip excluded divs
      if (excludedClassNames.some(className => div.classList.contains(className))) {
        continue suck;
      }

      const headingNodeList = div.querySelectorAll('h1, h2, h3, h4, h5, h6'),
        currentDivIsHeading = headingNodeList.length > 0;

      if (currentDivIsHeading) {
        const hTag: string = headingNodeList[0].tagName.toLowerCase();
        hNumber = parseInt(hTag.replace(/^\D+/g, '')); // h5 -> 5, h1 -> 1, etc.
        div.style.marginLeft = arrMargins[hNumber-1]+"px";
        div.classList.add(this.arrClassesHeadings[hNumber]);

      }else{
        div.style.marginLeft = arrMargins[hNumber]+"px";
        div.classList.add(this.arrClassesData[hNumber]);
      }
    }
  }

  /**
   * resets the margin and removes any classes that were added by the plugin
   *
   */
  private cleanSectionModifications(arrDivs: HTMLElement[]) {
    for (const div of arrDivs) {
      // div.classList.remove("undefined");
      div.style.marginLeft = null;

      div.classList.forEach((item: string)=>{
        if(item.startsWith('data_') || item.startsWith('heading_')) {
            div.classList.remove(item);
        }
      })
    }
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
