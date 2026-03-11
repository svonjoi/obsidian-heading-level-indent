import { App, TFile } from "obsidian";

/**
 * Listener for frontmatter field `vheadinglevelindent`
 * Detects value changes on the active file and notifies subscribers.
 */
export class VHeadingLevelIndentListener {
  private app: App;

  public currentVHeadingLevelIndent: string | null = null;
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

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Update current value and detect whether `vheadinglevelindent` has changed
   */
  update(): string | null {
    const prevVHeadingLevelIndent = this.currentVHeadingLevelIndent;
    const prevFile = this.currentFile;

    const currentFile = this.app.workspace.getActiveFile();
    this.currentFile = currentFile;

    if (currentFile) {
      const metadata = this.app.metadataCache.getFileCache(currentFile);
      const frontmatter = metadata?.frontmatter;

      this.currentVHeadingLevelIndent =
        frontmatter?.vheadinglevelindent !== undefined
          ? String(frontmatter.vheadinglevelindent)
          : null;
    } else {
      this.currentVHeadingLevelIndent = null;
    }

    // Check whether file or value has changed
    this.fileChanged = prevFile !== currentFile;
    this.valueChanged = this.currentVHeadingLevelIndent !== prevVHeadingLevelIndent;

    // Notify listeners only when value changes
    // if (this.fileChanged || this.valueChanged) {
    if (this.valueChanged) {
      this.notifyListeners(
        this.currentVHeadingLevelIndent,
        prevVHeadingLevelIndent,
        currentFile,
        prevFile
      );
    }

    return this.currentVHeadingLevelIndent;
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
   * Start listening to workspace and metadata changes
   */
  start(): void {
    // Listen for active file changes
    this.app.workspace.on("active-leaf-change", () => {
      this.update();
    });

    // Listen for metadata changes
    this.app.metadataCache.on("changed", (file: TFile) => {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile && activeFile.path === file.path) {
        this.update();
      }
    });

    // Initial update
    this.update();
  }
}

let _listener: VHeadingLevelIndentListener | null = null;

export function initVHeadingLevelIndentListener(app: App) {
  _listener = new VHeadingLevelIndentListener(app);
}

export function getVHeadingLevelIndentListener(): VHeadingLevelIndentListener {
  if (!_listener) {
    throw new Error("VHeadingLevelIndentListener not initialized");
  }
  return _listener;
}