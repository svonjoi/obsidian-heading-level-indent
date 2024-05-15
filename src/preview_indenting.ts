import HeadingIndent from './main';
// import { App, Editor, MarkdownView, Setting } from 'obsidian';
// import { DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

interface Dictionary<Type> {
	[key: string]: Type;
}

const containerSelector = ".workspace-leaf.mod-active .markdown-reading-view .markdown-preview-section";

const arrClassesHeadings: Dictionary<string> = {
	1: "heading_h1",
	2: "heading_h2",
	3: "heading_h3",
	4: "heading_h4",
	5: "heading_h5",
	6: "heading_h6",
};

const arrClassesData: Dictionary<string> = {
	0: "data_no-heading",
	1: "data_h1",
  2: "data_h2",
	3: "data_h3",
	4: "data_h4",
	5: "data_h5",
	6: "data_h6",
};

/**
 * sets up a MutationObserver on the active leaf in Obsidian. The observer watches for changes in the
 * child elements of the target node (which is a section of the Markdown preview). When changes are
 * detected, it calls the applyIndent function
 *
 * The observer callback will trigger each time sections (preview) / lines (source) are added/removed
 *
 * [preview]
 * 	  When preview is toggled and there are changes in sections to be rendered
 *
 * [preview,source]
 * 	  When switch note, the sections will be rendered
 *
 * 	  If the active leaf is large (preview is codemirror and it
 *    supports huge files) the callback triggers while we scroll, cuz the editor only
 *    renders the editor's viewport (that renders only what's is visible)
 *    https://marcus.se.net/obsidian-plugin-docs/editor/extensions/viewport
 *
 * 	  Triggers when heading is folded or unfolded (heading content is not exist in the DOM if its folded)
 *
 */
export function setObserverToActiveLeaf(plugin: HeadingIndent){

	if (plugin.previewObserver !== undefined){
		// prevent stacking: disconnect existing observer first before creating a new one
		plugin.previewObserver.disconnect();
	}

	// `activeDocument` instead of `document` to make it work in obsidian-popups
	const targetNode = activeDocument.querySelector(containerSelector);

	// if new tab is opened (ctrl+t) the leaf is empty and targetNode is null
	if (targetNode == null){
		console.log("target node is NULL");
		return;
	}

	// Options for the observer (which mutations to observe)
	const config = { childList: true };

	// Callback function to execute when mutations are observed
	const callback: MutationCallback = (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (mutation.type === 'childList') {
        // when viewport is changed (scrolling, resizing, folding/unfolding headings)
				applyIndent(plugin,0,true,"mutation");
			}
		}
	};

	// Create an observer instance linked to the callback function
	plugin.previewObserver = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	plugin.previewObserver.observe(targetNode, config);
}

/**
 * sets a timeout to call the applyIndentation function. It uses a flag 
 *
 * @param timeout 	in order to process when the "sections" are already rendered
 * @param flag 		  see this.flagExecute interface
 */
export function applyIndent(plugin: HeadingIndent, timeout: number, flag: boolean, text: string | undefined = ""){

  console.log(`🌀 applyIndent (${text}) -> timeout:${timeout} flag:${flag}`);

	timeout = timeout || 0;

	if (timeout == 0 && flag === false){
		applyIndentation(plugin);
		return;
	}

	if (flag){
		if (plugin.flagExecute == undefined || plugin.flagExecute == 1){
			plugin.flagExecute = 2;

			setTimeout(async function(){
				applyIndentation(plugin);
			}, timeout)

			setTimeout(() => {
				plugin.flagExecute = 1;
			}, timeout+50)
		}
	}else{
		setTimeout(async function(){
			applyIndentation(plugin);
		}, timeout)
	}
}

/**
 * applies indentation to the headings in the Markdown preview. It selects all the div
 * elements in the preview, removes any previous modifications, and then applies new
 * styles based on the heading level. The indentation levels are configurable through
 * the plugin settings
 *
 */
function applyIndentation(plugin: HeadingIndent) {
	const settings = plugin.settings;

	const divsNodeList = activeDocument.querySelectorAll<HTMLElement>(containerSelector + " > div");
	if (!divsNodeList) { return }

	const arrDivs = Array.from(divsNodeList);

	// do not process divs with followings classes
	const excludedClassNames = ['mod-header', 'mod-footer', 'markdown-preview-pusher'];

	cleanSectionModifications(arrDivs);

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
			div.classList.add(arrClassesHeadings[hNumber]);

		}else{
			div.style.marginLeft = arrMargins[hNumber]+"px";
			div.classList.add(arrClassesData[hNumber]);
		}
	}
}

/**
 * resets the margin and removes any classes that were added by the plugin
 *
 */
function cleanSectionModifications(arrDivs: HTMLElement[]) {
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