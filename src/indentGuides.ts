import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { Plugin } from "obsidian";
import { HeadingIndentSettings } from "./settings";

const GUIDE_HOST_CLASS = "hli-guide-host";
const GUIDE_LAYER_CLASS = "hli-guide-layer";
const GUIDE_SEGMENT_CLASS = "hli-guide-segment";
interface GuideLayer {
	host: HTMLElement;
	layer: HTMLElement;
	previousPosition: string;
}

export interface HeadingGuideSection {
	level: number;
	start: number;
	end: number;
}

export const indentGuideTheme = EditorView.baseTheme({
	".hli-editor-guide-line": {
		position: "relative"
	},
	".hli-editor-guide-line::before": {
		backgroundImage: "var(--hli-guide-backgrounds)",
		backgroundPosition: "var(--hli-guide-positions)",
		backgroundRepeat: "no-repeat",
		backgroundSize: "var(--hli-guide-sizes)",
		bottom: "0",
		content: '""',
		left: "var(--hli-guide-left)",
		pointerEvents: "none",
		position: "absolute",
		top: "0",
		width: "var(--hli-guide-span)"
	}
});

export class IndentationGuides {
	private static layers = new Map<HTMLElement, GuideLayer>();

	static register(plugin: Plugin, getSettings: () => HeadingIndentSettings): void {
		let frame: number | undefined;
		const observer = new MutationObserver((mutations) => {
			const onlyGuideLayers = mutations.every(
				(mutation) =>
					mutation.target.instanceOf(Element) &&
					mutation.target.closest(`.${GUIDE_LAYER_CLASS}`)
			);
			if (!onlyGuideLayers) scheduleRender();
		});
		const observe = () => {
			observer.observe(document.body, {
				attributes: true,
				attributeFilter: ["class", "style"],
				childList: true,
				subtree: true
			});
		};
		const render = () => {
			observer.disconnect();
			try {
				for (const view of Array.from(
					document.querySelectorAll<HTMLElement>(
						".markdown-preview-view.markdown-rendered"
					)
				)) {
					if (!view.closest(".markdown-source-view")) {
						this.render(view, getSettings());
					}
				}
			} finally {
				observe();
			}
		};
		const scheduleRender = () => {
			if (frame !== undefined) return;
			frame = window.requestAnimationFrame(() => {
				frame = undefined;
				render();
			});
		};

		plugin.registerDomEvent(window, "resize", scheduleRender);
		plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleRender));
		plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", scheduleRender));
		plugin.register(() => {
			if (frame !== undefined) window.cancelAnimationFrame(frame);
			observer.disconnect();
			this.clear();
		});
		observe();
		plugin.app.workspace.onLayoutReady(() => {
			scheduleRender();
			const timer = window.setTimeout(scheduleRender, 1500);
			plugin.register(() => window.clearTimeout(timer));
		});
	}

	static render(root: HTMLElement, settings: HeadingIndentSettings): void {
		if (!settings.showIndentationGuides || root.closest(".print")) {
			this.clear(root);
			return;
		}

		const host =
			root.querySelector<HTMLElement>(":scope > .markdown-preview-sizer") ??
			root.querySelector<HTMLElement>(".markdown-preview-sizer") ??
			root;
		const guideLayer = this.layerFor(root, host);
		guideLayer.layer.replaceChildren();
		guideLayer.layer.style.width = `${Math.max(host.clientWidth, host.scrollWidth)}px`;
		guideLayer.layer.style.height = `${Math.max(host.clientHeight, host.scrollHeight)}px`;

		const blocks = Array.from(
			root.querySelectorAll<HTMLElement>('div[class*="heading_h"], div[class*="data_h"]')
		);
		for (let guideLevel = 1; guideLevel <= 6; guideLevel++) {
			this.drawLevel(guideLayer, settings, blocks, guideLevel);
		}
	}

	static clear(root?: HTMLElement): void {
		for (const [view, guideLayer] of this.layers) {
			if (root && view !== root && !root.contains(view)) continue;
			guideLayer.layer.remove();
			guideLayer.host.classList.remove(GUIDE_HOST_CLASS);
			guideLayer.host.style.position = guideLayer.previousPosition;
			this.layers.delete(view);
		}
	}

	static clearWidgetLayers(root: HTMLElement): void {
		for (const layer of Array.from(
			root.querySelectorAll<HTMLElement>(".hli-widget-guide-layer")
		)) {
			layer.remove();
		}
	}

	static editorSections(
		state: EditorState,
		headings: { level: number; headingLineNumber: number; headingPos: number }[]
	): HeadingGuideSection[] {
		return headings.map((heading, index) => {
			let end = state.doc.length;
			for (let next = index + 1; next < headings.length; next++) {
				if (headings[next].level <= heading.level) {
					end = headings[next].headingPos;
					break;
				}
			}
			return {
				level: heading.level,
				start: state.doc.line(heading.headingLineNumber).to,
				end
			};
		});
	}

	static editorLineAttributes(
		style: string,
		activeLevels: number[],
		lineIndent: number,
		settings: HeadingIndentSettings
	): { class?: string; style: string } {
		if (!settings.showIndentationGuides || activeLevels.length === 0 || lineIndent <= 0) {
			return { style };
		}

		const guidePositions = activeLevels.map((level) =>
			this.indentForLevel(settings, level - 1)
		);
		const backgrounds = guidePositions.map(
			() =>
				"linear-gradient(var(--heading-level-indent-guide-color, var(--background-modifier-border)), var(--heading-level-indent-guide-color, var(--background-modifier-border)))"
		);
		return {
			class: "hli-editor-guide-line",
			style:
				style +
				`--hli-guide-left:-${lineIndent}px;` +
				`--hli-guide-span:${lineIndent}px;` +
				`--hli-guide-backgrounds:${backgrounds.join(",")};` +
				`--hli-guide-positions:${guidePositions.map((position) => `${position}px 0`).join(",")};` +
				`--hli-guide-sizes:${guidePositions.map(() => "1px 100%").join(",")};`
		};
	}

	static createWidgetLayer(
		view: EditorView,
		settings: HeadingIndentSettings
	): HTMLElement | null {
		if (!settings.showIndentationGuides) return null;
		const layer = view.scrollDOM.createDiv({
			cls: "hli-widget-guide-layer",
			attr: { "aria-hidden": "true", contenteditable: "false" }
		});
		layer.style.height = `${view.scrollDOM.scrollHeight}px`;
		layer.style.left = "0";
		layer.style.pointerEvents = "none";
		layer.style.position = "absolute";
		layer.style.top = "0";
		layer.style.width = `${view.scrollDOM.scrollWidth}px`;
		layer.style.zIndex = "3";
		return layer;
	}

	static renderWidgetGuides(
		view: EditorView,
		layer: HTMLElement | null,
		element: HTMLElement,
		position: number,
		sections: HeadingGuideSection[],
		settings: HeadingIndentSettings
	): void {
		if (!layer) return;
		const activeSections = sections.filter(
			(section) => section.start < position && position < section.end
		);
		if (activeSections.length === 0) return;

		const computedStyle = element.ownerDocument.defaultView?.getComputedStyle(element);
		const marginTop = Number.parseFloat(computedStyle?.marginTop ?? "0") || 0;
		const marginBottom = Number.parseFloat(computedStyle?.marginBottom ?? "0") || 0;
		const elementRect = element.getBoundingClientRect();
		const scrollRect = view.scrollDOM.getBoundingClientRect();
		const contentRect = view.contentDOM.getBoundingClientRect();
		const baseLeft = contentRect.left - scrollRect.left + view.scrollDOM.scrollLeft;
		const top = elementRect.top - scrollRect.top + view.scrollDOM.scrollTop - marginTop;
		const height = elementRect.height + marginTop + marginBottom;

		for (const section of activeSections) {
			const segment = layer.createDiv({ cls: "hli-widget-guide-segment" });
			segment.style.background =
				"var(--heading-level-indent-guide-color, var(--background-modifier-border))";
			segment.style.height = `${Math.ceil(height)}px`;
			segment.style.left = `${Math.round(
				baseLeft + this.indentForLevel(settings, section.level - 1)
			)}px`;
			segment.style.position = "absolute";
			segment.style.top = `${Math.round(top)}px`;
			segment.style.width = "var(--heading-level-indent-guide-width, 1px)";
		}
	}

	private static layerFor(root: HTMLElement, host: HTMLElement): GuideLayer {
		const existing = this.layers.get(root);
		if (existing?.host === host && existing.layer.isConnected) return existing;
		if (existing) this.clear(root);

		const previousPosition = host.style.position;
		const view = host.ownerDocument.defaultView;
		if (!view || view.getComputedStyle(host).position === "static") {
			host.style.position = "relative";
		}
		host.classList.add(GUIDE_HOST_CLASS);

		const layer = host.createDiv({
			cls: GUIDE_LAYER_CLASS,
			attr: { "aria-hidden": "true", contenteditable: "false" }
		});
		layer.style.left = "0";
		layer.style.overflow = "visible";
		layer.style.pointerEvents = "none";
		layer.style.position = "absolute";
		layer.style.top = "0";
		layer.style.zIndex = "3";

		const guideLayer = { host, layer, previousPosition };
		this.layers.set(root, guideLayer);
		return guideLayer;
	}

	private static drawLevel(
		guideLayer: GuideLayer,
		settings: HeadingIndentSettings,
		blocks: HTMLElement[],
		guideLevel: number
	): void {
		let start: number | null = null;
		let left = 0;
		let previous: HTMLElement | null = null;

		for (const block of blocks) {
			const state = this.blockState(block);
			if (!state) continue;
			const rect = block.getBoundingClientRect();
			const active =
				state.type === "data" ? state.level >= guideLevel : state.level > guideLevel;

			if (active && start === null) {
				const previousState = previous ? this.blockState(previous) : null;
				start =
					previous &&
					previousState?.type === "heading" &&
					previousState.level === guideLevel
						? previous.getBoundingClientRect().bottom
						: rect.top;
				left =
					rect.left + this.indentForLevel(settings, guideLevel - 1);
			} else if (!active && start !== null) {
				this.draw(guideLayer, left, start, rect.top - start);
				start = null;
			}
			previous = block;
		}

		if (start !== null && previous) {
			this.draw(
				guideLayer,
				left,
				start,
				previous.getBoundingClientRect().bottom - start
			);
		}
	}

	private static blockState(
		block: HTMLElement
	): { type: "heading" | "data"; level: number } | null {
		const match = Array.from(block.classList)
			.map((className) => /^(heading|data)_h([1-6])$/.exec(className))
			.find((candidate) => candidate !== null);
		return match
			? { type: match[1] as "heading" | "data", level: Number(match[2]) }
			: null;
	}

	private static indentForLevel(settings: HeadingIndentSettings, level: number): number {
		if (level === 0) return 0;
		const key = `h${level}` as keyof HeadingIndentSettings;
		return Number.parseInt(String(settings[key])) || 0;
	}

	private static draw(
		guideLayer: GuideLayer,
		viewportX: number,
		viewportTop: number,
		height: number
	): void {
		if (height <= 0) return;
		const hostRect = guideLayer.host.getBoundingClientRect();
		const segment = guideLayer.layer.createDiv({ cls: GUIDE_SEGMENT_CLASS });
		segment.style.background =
			"var(--heading-level-indent-guide-color, var(--background-modifier-border))";
		segment.style.height = `${Math.ceil(height)}px`;
		segment.style.left = `${Math.round(
			viewportX - hostRect.left + guideLayer.host.scrollLeft
		)}px`;
		segment.style.pointerEvents = "none";
		segment.style.position = "absolute";
		segment.style.top = `${Math.round(
			viewportTop - hostRect.top + guideLayer.host.scrollTop
		)}px`;
		segment.style.width = "var(--heading-level-indent-guide-width, 1px)";
	}
}
