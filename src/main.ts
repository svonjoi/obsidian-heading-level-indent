import { MarkdownView, Plugin } from 'obsidian';
import { wrapperIndentPreview, indentPreview, setObserverToActiveLeaf } from "./preview_indenting";
import { IndentSettingTab, HeadingIndentSettings, DEFAULT_SETTINGS } from './settings';

// import { App, Editor, PluginSettingTab, MarkdownPostProcessorContext, Setting, MarkdownPreviewRenderer } from 'obsidian';

// declare module "obsidian" {
// 	interface App {
// 		// trick con el <flag> para que la funcion se procese las minimas veces posibles
// 		flagExecute?: number,
// 		// save observer in app.variable in order to control and prevent stacking of observers
// 		previewObserver?: any
// 	}
// }


export default class HeadingIndent extends Plugin {
	settings: HeadingIndentSettings;
	flagExecute?: number; // trick con el <flag> para que la funcion se procese las minimas veces posibles
	previewObserver?: any; // save observer in app.variable in order to control and prevent stacking of observers

	// Configure resources needed by the plugin.
	async onload() {
		await this.loadSettings();
		
		console.log("plugin Heading Indent Settings loaded");

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new IndentSettingTab(this.app, this));

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
			// const mode = markdownView.getMode();
			// markdownView.previewMode.renderer.sections
			// console.log(markdownView.previewMode.renderer.sections);

			// wrapperIndentPreview(this,100,true);
		// }, 0)


		// When obsidian in started
		this.app.workspace.onLayoutReady(() => {
			// console.log("⭐onLayoutReady");

			// run without blocking (without flag)
			wrapperIndentPreview(this,100,false);
			wrapperIndentPreview(this,300,false);
			wrapperIndentPreview(this,1000,false);

            setObserverToActiveLeaf(this);
			
        });

		// When tab is switched
		this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
			// console.log("⭐⭐event:active-leaf-change");

			const mode = app.workspace.getActiveViewOfType(MarkdownView).getMode();

			/**
			 * run directly (without timeout & flag) in order to apply indent faster
			 * process the sections that are already rendered; the rest of the sections
			 * (which not rendered yet) we will process with observer callback
			 */
			indentPreview(this);

			/**
			 * when leaf is opened <in new tab> from <quick-switcher> and its content fits into
			 * the <viewport>, its not triggering observer callback, I guess its cuz the divs are 
			 * rendered at once
			 * 
			 * Run without flag cuz I think will be better for other cases - itwont be blocking 
			 * subsequent calls from observer callback 
			 */
			wrapperIndentPreview(this,100,false);

			setObserverToActiveLeaf(this);
		}));


		// When toggle between source/preview mode
		this.registerEvent(this.app.workspace.on("layout-change", () => {
			
			setObserverToActiveLeaf(this);
		}));




		// this.registerEvent(this.app.workspace.on("editor-change", (editor: Editor, MarkdownView: MarkdownView) => {
		// 	// console.log("⭐⭐event:editor-change");

		// 	// let currentLine = editor.getCursor().line;
		// 	// console.log(editor.getLine(currentLine));

		// 	console.log(editor);
		// 	davayIndentSource(this);

		// 	// wrapperIndentPreview(this,100,true);
		// }));



		//todo: source
		// .workspace-leaf.mod-active .markdown-source-view .cm-contentContainer > div:nth-child(2)
		// this.registerEditorExtension(activeVisualLine);
		// ref dynamic highlight plug k crea span inside cm-line
	}

	// Release any resources configured by the plugin.
	onunload() {
		// if (this.previewObserver !== undefined) this.previewObserver.disconnect();
		this.previewObserver && this.previewObserver.disconnect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		indentPreview(this);
	}

}




// indentSource() {
	
// 	console.log("🌲🌲🌲🌲🌲🌲🌲🌲 davayIndent {SOURCE}");

// 	// lines
// 	const divsNodeList = document.querySelectorAll<HTMLElement>(selector["source"] + " > div.cm-line");
// 	if (!divsNodeList){return}
	
// 	const arrDivs = Array.from(divsNodeList);
	
// 	// cleanSectionModifications(arrDivs);

// 	const arrMargins: Dictionary<number> = {
// 		0: 0, // no heading
// 		1: parseInt(settings.h1) || 0,
// 		2: parseInt(settings.h2) || 0,
// 		3: parseInt(settings.h3) || 0,
// 		4: parseInt(settings.h4) || 0,
// 		5: parseInt(settings.h5) || 0,
// 		6: parseInt(settings.h6) || 0,
// 		// 1: 0,
// 		// 2: 0,
// 		// 3: 0,
// 		// 4: 51,
// 		// 5: 100,
// 		// 6: 150,
// 	};

	
// 	let hNumber: number = 0;

// 	suck: for (const div of arrDivs) {

// 		let currentDivIsHeading = div.classList.contains("HyperMD-header");
		
// 		if (currentDivIsHeading) {
			
// 			let spanNodeList = div.querySelectorAll('span.cm-header');

// 			if (spanNodeList[0].classList.contains("cm-header-1")) {hNumber=1}
// 			if (spanNodeList[0].classList.contains("cm-header-2")) {hNumber=2}
// 			if (spanNodeList[0].classList.contains("cm-header-3")) {hNumber=3}
// 			if (spanNodeList[0].classList.contains("cm-header-4")) {hNumber=4}
// 			if (spanNodeList[0].classList.contains("cm-header-5")) {hNumber=5}
// 			if (spanNodeList[0].classList.contains("cm-header-6")) {hNumber=6}


// 			// div.style.marginLeft = arrMargins[hNumber-1]+"px";
			
// 			// div.classList.add(arrClassesHeadings[hNumber]);

// 			div.classList.add(arrClassesHeadings[hNumber]);


// 			//todo:
// 			// var line = cm.addLineClass(i, "wrap", "CodeMirror-activeline");
// 			// lines.push(line);

// 		}else{

// 			// div.style.marginLeft = arrMargins[hNumber]+"px";
// 			div.classList.add(arrClassesData[hNumber]);
// 		}
// 	}
// }