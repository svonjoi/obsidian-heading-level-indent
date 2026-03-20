import { App, TFile } from "obsidian";

/**
 * Listener for frontmatter field `heading-indent`
 * Detects value changes on the active file and notifies subscribers.
 */
export class FrontmatterListener {
	private app: App;

	private currentIndentState: string | null = null;
	private currentFile: TFile | null = null;

	private listeners: Array<
		(
			newValue: string | null,
			oldValue: string | null,
			newFile: TFile | null,
			oldFile: TFile | null
		) => void
	> = [];

	public fileChanged = false;
	public valueChanged = false;
	private eventRefs: any[] = [];

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Update current value and detect whether `heading-indent` has changed
	 */
	update(): string | null {
		const prevIndentState = this.currentIndentState;
		const prevFile = this.currentFile;

		const currentFile = this.app.workspace.getActiveFile();
		this.currentFile = currentFile;

		if (currentFile) {
			const metadata = this.app.metadataCache.getFileCache(currentFile);
			const frontmatter = metadata?.frontmatter;

			this.currentIndentState =
				frontmatter?.["heading-indent"] !== undefined
					? String(frontmatter["heading-indent"])
					: "1"; // Default to "1" (enabled) when property is missing
		} else {
			this.currentIndentState = null;
		}

		// Check whether file or value has changed
		this.fileChanged = prevFile !== currentFile;
		this.valueChanged = this.currentIndentState !== prevIndentState;

		// Notify listeners only when value changes
		// if (this.fileChanged || this.valueChanged) {
		if (this.valueChanged) {
			this.notifyListeners(this.currentIndentState, prevIndentState, currentFile, prevFile);
		}

		return this.currentIndentState;
	}

	/**
	 * Add a listener callback
	 */
	addListener(
		callback: (
			newValue: string | null,
			oldValue: string | null,
			newFile: TFile | null,
			oldFile: TFile | null
		) => void
	): void {
		this.listeners.push(callback);
	}

	/**
	 * Remove a listener callback
	 */
	removeListener(
		callback: (
			newValue: string | null,
			oldValue: string | null,
			newFile: TFile | null,
			oldFile: TFile | null
		) => void
	): void {
		const index = this.listeners.indexOf(callback);
		if (index > -1) {
			this.listeners.splice(index, 1);
		}
	}

	/**
	 * Notify all registered listeners
	 */
	private notifyListeners(
		newValue: string | null,
		oldValue: string | null,
		newFile: TFile | null,
		oldFile: TFile | null
	): void {
		this.listeners.forEach((listener) => {
			try {
				listener(newValue, oldValue, newFile, oldFile);
			} catch (error) {
				console.error("Listener execution error:", error);
			}
		});
	}

	/**
	 * Determines if heading indentation should be applied to the current file.
	 *
	 * Checks frontmatter field 'heading-indent':
	 *   - false/0: disabled
	 *   - Any other value or missing: enabled (default)
	 *
	 * @returns true if indentation should be applied
	 */
	public isIndentEnabled(): boolean {
		if (this.currentIndentState === null) {
			return false; // Default: disabled when property is missing
		}

		const val = String(this.currentIndentState).toLowerCase();

		// Only these specific values disable indentation
		return !(val === "false" || val === "0");
	}

	/**
	 * Start listening to workspace and metadata changes
	 */
	start(): void {
		// Listen for active file changes
		const leafChangeRef = this.app.workspace.on("active-leaf-change", () => {
			this.update();
		});
		this.eventRefs.push(leafChangeRef);

		// Listen for metadata changes
		const metadataChangeRef = this.app.metadataCache.on("changed", (file: TFile) => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile && activeFile.path === file.path) {
				this.update();
			}
		});
		this.eventRefs.push(metadataChangeRef);

		// Initial update
		this.update();
	}

	/**
	 * Stop listening and clean up event handlers
	 */
	stop(): void {
		this.eventRefs.forEach((ref) => this.app.workspace.offref(ref));
		this.eventRefs = [];
	}
}

let _listener: FrontmatterListener | null = null;

export function initFrontmatterListener(app: App) {
	// Only initialize once to prevent duplicate event listeners
	if (!_listener) {
		_listener = new FrontmatterListener(app);
	}
}

export function getFrontmatterListener(): FrontmatterListener {
	if (!_listener) {
		throw new Error("FrontmatterListener not initialized");
	}
	return _listener;
}

export function cleanupFrontmatterListener() {
	if (_listener) {
		_listener.stop();
		_listener = null;
	}
}
