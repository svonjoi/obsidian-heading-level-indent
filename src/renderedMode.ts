import type { App } from "obsidian";
import { getFrontmatterListener } from "./FrontmatterListener";
import { HeadingIndentSettings } from "./settings";

/**
 * Handles indentation for rendered views (reading view and PDF export).
 * Uses registerMarkdownPostProcessor for initial rendering and MutationObserver for viewport changes.
 */
export class RenderedModeIndenter {
	private static processingInProgress = false;
	private static processingInProgressForObserver = false;
	private static observers: Map<Element, MutationObserver> = new Map();
	private static currentSettings: HeadingIndentSettings | null = null;

	/**
	 * Apply indentation to markdown elements in reading view or PDF export.
	 * Works by processing the DOM after Obsidian renders the markdown.
	 */
	static applyIndent(element: HTMLElement, settings: HeadingIndentSettings): void {
		// Check if indentation is enabled for current file
		try {
			if (!getFrontmatterListener().isIndentEnabled()) return;
		} catch (e) {
			// Frontmatter listener not initialized yet, assume enabled by default
			console.warn("FrontmatterListener not initialized, applying indent by default");
		}

		// Store settings for use by observer
		this.currentSettings = settings;

		// Prevent concurrent processing to avoid performance issues
		if (this.processingInProgress) return;

		// Find the root markdown-preview-view container
		const rootContainer = element.closest(".markdown-preview-view") as HTMLElement;
		if (!rootContainer) return;

		// Set up MutationObserver to handle viewport changes (for large documents with virtualization)
		this.setupObserver(rootContainer, settings);

		// Use requestAnimationFrame to batch multiple calls
		this.processingInProgress = true;
		requestAnimationFrame(() => {
			const processor = new IndentProcessor(settings, rootContainer);
			processor.process();
			this.processingInProgress = false;
		});
	}

	/**
	 * Set up MutationObserver to watch for DOM changes when scrolling in virtualized documents.
	 * Obsidian only renders viewport content in large documents, adding/removing nodes as you scroll.
	 */
	private static setupObserver(rootContainer: HTMLElement, settings: HeadingIndentSettings): void {
		// Find the preview section container that gets mutated during scrolling
		const previewSection = rootContainer.querySelector(".markdown-preview-section");
		if (!previewSection) return;

		// Set up observer for this section
		this.setupObserverForSection(previewSection, rootContainer, settings);
	}

	/**
	 * Set up a global observer that watches for new preview sections across all markdown views.
	 * This ensures observers are attached when switching files or opening new views.
	 */
	static setupGlobalObserver(app: App, getSettings: () => HeadingIndentSettings): void {
		// Use a MutationObserver on the workspace to detect new markdown-preview-section elements
		const workspaceContainer = document.querySelector(".workspace");
		if (!workspaceContainer) return;

		const globalObserver = new MutationObserver(() => {
			// Find all preview sections that don't have an observer yet
			const previewSections = document.querySelectorAll(".markdown-preview-section");
			previewSections.forEach((section) => {
				if (!this.observers.has(section)) {
					const rootContainer = section.closest(".markdown-preview-view") as HTMLElement;
					if (rootContainer) {
						this.setupObserverForSection(section, rootContainer, getSettings());
					}
				}
			});
		});

		// Observe the workspace for new preview sections
		globalObserver.observe(workspaceContainer, { childList: true, subtree: true });
		this.observers.set(workspaceContainer, globalObserver);

		// Also set up observers for any existing preview sections
		const existingSections = document.querySelectorAll(".markdown-preview-section");
		existingSections.forEach((section) => {
			const rootContainer = section.closest(".markdown-preview-view") as HTMLElement;
			if (rootContainer) {
				this.setupObserverForSection(section, rootContainer, getSettings());
			}
		});
	}

	/**
	 * Set up observer for a specific preview section
	 */
	private static setupObserverForSection(
		previewSection: Element,
		rootContainer: HTMLElement,
		settings: HeadingIndentSettings
	): void {
		if (this.observers.has(previewSection)) return;

		const observer = new MutationObserver((mutations) => {
			// Check if childList was mutated (nodes added/removed during scrolling)
			const hasChildListChanges = mutations.some((m) => m.type === "childList");
			if (!hasChildListChanges) return;

			if (!this.processingInProgressForObserver) {
				this.processingInProgressForObserver = true;
				requestAnimationFrame(() => {
					const processor = new IndentProcessor(settings, rootContainer);

					// Check if indent is enabled or disabled
					if (getFrontmatterListener().isIndentEnabled()) {
						// Apply indentation to newly rendered elements
						processor.process();
					} else {
						// Clear indentation from newly rendered elements
						processor.clear();
					}

					this.processingInProgressForObserver = false;
				});
			}
		});

		// Observe childList changes (when virtualized content is added/removed)
		observer.observe(previewSection, { childList: true });
		this.observers.set(previewSection, observer);
	}

	/**
	 * Remove indentation from all preview views of the current file
	 */
	static clearCurrentView(): void {
		// Find ALL preview views (not just the active one)
		const allPreviewViews = activeDocument.querySelectorAll(".markdown-preview-view");

		allPreviewViews.forEach((previewView) => {
			const processor = new IndentProcessor(null as any, previewView as HTMLElement);
			processor.clear();
		});
	}

	/**
	 * Apply indentation to all preview views of the current file
	 */
	static applyToCurrentView(settings: HeadingIndentSettings): void {
		// Find ALL preview views (not just the active one)
		const allPreviewViews = activeDocument.querySelectorAll(".markdown-preview-view");

		allPreviewViews.forEach((previewView) => {
			const processor = new IndentProcessor(settings, previewView as HTMLElement);
			processor.process();
		});
	}

	/**
	 * Disconnect all MutationObservers and clear all indentation (call when plugin unloads)
	 */
	static cleanup(): void {
		// Disconnect all observers first
		this.observers.forEach((observer) => observer.disconnect());
		this.observers.clear();
		this.currentSettings = null;

		// Clear indentation from ALL markdown preview views in the entire workspace
		const allPreviewViews = document.querySelectorAll(".markdown-preview-view");
		allPreviewViews.forEach((previewView) => {
			const processor = new IndentProcessor(null as any, previewView as HTMLElement);
			processor.clear();
		});
	}
}

/**
 * Processes and applies indentation to markdown elements in rendered views.
 * This worker class handles the actual DOM manipulation for both reading view and PDF export.
 */
class IndentProcessor {
	private currentHeadingLevel = 0;
	private lastHeadingElement: HTMLElement | null = null;

	constructor(
		private settings: HeadingIndentSettings,
		private rootElement: HTMLElement
	) {}

	loopThroughElements(elements: Element[]): void {
		this.currentHeadingLevel = 0;
		this.lastHeadingElement = null;
		for (const element of elements) {
			if (this.shouldSkipElement(element)) {
				continue;
			}

			const tagName = element.tagName.toLowerCase();
			
			if (this.isHeading(tagName)) {
				this.processHeading(element as HTMLElement, tagName);
			} else if (this.currentHeadingLevel > 0) {
				this.processContent(element as HTMLElement);
			} 
		}
	}

	loopThroughElementsWithSmartIndent(elements: Element[]): void {
		this.currentHeadingLevel = 0;
		this.lastHeadingElement = null;
		let largestHeading = Number.MAX_VALUE;

		for(const element of elements) {
			if(this.shouldSkipElement(element)) continue;

			const tagName = element.tagName.toLowerCase();
			if(this.isHeading(tagName)) 
				largestHeading = Math.min(largestHeading,  Number.parseInt(tagName.charAt(1)))
			
		}

		for (const element of elements) {
			if (this.shouldSkipElement(element)) {
				continue;
			}

			const tagName = element.tagName.toLowerCase();
			
			if (this.isHeading(tagName)) {
				this.processHeading(element as HTMLElement, tagName, (Number.parseInt(tagName.charAt(1)) - largestHeading + 1));
			} else if (this.currentHeadingLevel > 0) {
				this.processContent(element as HTMLElement);
			} 
		}

	}

	process(): void {
		const selectors = this.getContentSelectors();

		const embeddedElements = Array.from(
				this.rootElement.querySelectorAll('div > p > span.internal-embed.markdown-embed')
			).map(container => Array.from(container.querySelectorAll(selectors.join(","))));
		const embeddedSet = new Set(embeddedElements.reduce((a, b) => a.concat(b), []));

		const calloutElements = Array.from(
			this.rootElement.querySelectorAll('div.callout > div.callout-content')
		).map(container => 
			Array.from(container.querySelectorAll(selectors.join(",")))
				.filter(e => e.closest("div.callout-content") === container)
		)
		const calloutSet = new Set(calloutElements.reduce((a, b) => a.concat(b), []));

		const elements = Array.from(
			this.rootElement.querySelectorAll(selectors.join(","))
		).filter(e => 
			!embeddedSet.has(e) && 
			!calloutSet.has(e) && 
			!e.parentElement?.closest("div.callout") //no nested callouts => breaks nested callout indent
		);
		
		this.loopThroughElements(elements);
		embeddedElements.forEach(embed   => this.settings.treatHighestHeadingAsRootInCallout ? this.loopThroughElementsWithSmartIndent(embed) : this.loopThroughElements(embed));
		calloutElements .forEach(callout => this.settings.treatHighestHeadingAsRootInCallout ? this.loopThroughElementsWithSmartIndent(callout) : this.loopThroughElements(callout));
			
	}

	/**
	 * Remove all indentation styles and classes
	 */
	clear(): void {
		// Find all divs with el- classes (these are the containers we add padding to)
		const elDivs = this.rootElement.querySelectorAll('div[class*="el-"]');

		for (const div of Array.from(elDivs)) {
			const htmlDiv = div as HTMLElement;

			// Remove padding
			htmlDiv.style.paddingLeft = "";

			// Remove indent classes
			const classesToRemove: string[] = [];
			htmlDiv.classList.forEach((className) => {
				if (className.startsWith("heading_") || className.startsWith("data_")) {
					classesToRemove.push(className);
				}
			});
			classesToRemove.forEach((className) => htmlDiv.classList.remove(className));
		}
	}

	private getContentSelectors(): string[] {
		return [
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"p",
			"ul",
			"ol",
			"blockquote",
			"table",
			"pre",
			"div.callout"
		];
	}

	private shouldSkipElement(element: Element): boolean {
		// Skip inline title in PDF export (inline-title is the standard Obsidian class)
		const isPdfExport = this.rootElement.closest(".print") !== null;
		if (isPdfExport && element.classList.contains("__title__")) {
			return true;
		}

		if(element.classList.contains("callout-content") || element.parentElement?.classList.contains("callout-title-inner")) return true;

		return false;
	}

	private isHeading(tagName: string): boolean {
		return /^h[1-6]$/.test(tagName);
	}

	private processHeading(element: HTMLElement, tagName: string, level?: number): void {
		level = level ?? parseInt(tagName.charAt(1));		
		this.currentHeadingLevel = level;
		this.lastHeadingElement = element;

		const parentDiv = element.parentElement;
		if (parentDiv?.tagName === "DIV") {
			const indent = this.getIndentForLevel(level - 1);

			if(parentDiv.classList.contains("callout-content")) {
				// margin instead of padding because this works directly on the H elements as theres no wrapper div
				// Some theme with heading underline will break if we use padding
				element.style.setProperty("margin-left", `${indent}px`, "important"); 
				element.classList.add(`heading_h${level}`);
			} else {
				parentDiv.style.paddingLeft = `${indent}px`;
				parentDiv.classList.add(`heading_h${level}`);
			}
		}
	}

	private processContent(element: HTMLElement): void {

		const parentDiv = element.parentElement;
		const indent = this.getIndentForLevel(this.currentHeadingLevel);

		if(parentDiv?.classList.contains("callout-content")) {
				element.style.setProperty("margin-left", `${indent}px`, "important"); 
			element.classList.add(`data_h${this.currentHeadingLevel}`);
		} else if (parentDiv?.tagName === "DIV" && parentDiv !== this.lastHeadingElement?.parentElement) {
			parentDiv.style.paddingLeft = `${indent}px`;
			parentDiv.classList.add(`data_h${this.currentHeadingLevel}`);
		}
	}

	private getIndentForLevel(level: number): number {
		if (level === 0) return 0;
		const key = `h${level}` as keyof HeadingIndentSettings;
		return parseInt(String(this.settings[key])) || 0;
	}
}
