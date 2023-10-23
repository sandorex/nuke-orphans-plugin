import { Notice, Plugin, TFile, CanvasData } from "obsidian";
import { DEFAULT_SETTINGS, NukeOrphansSettings, NukeOrphansSettingsTab } from "./settings";
import { TrashFilesModal } from "./trash_modal";

/**
 * class that holds regexes, used for prebuilding regexes when filtering
 */
class RegexFilter {
	private readonly regexes: Set<RegExp>;

	constructor(ignoredPaths: string[]) {
		this.regexes = new Set<RegExp>(ignoredPaths.map(x => RegExp(x)));
	}

	/**
	 * tests if any regex in filter matches in input
	 */
	public test(input: string): boolean {
		return Array.from(this.regexes).some(x => x.test(input));
	}
}

export default class NukeOrphansPlugin extends Plugin {
	settings: NukeOrphansSettings;

	// gets the filter that is filled with ignore path patterns
	getIgnoreFilter(): RegexFilter {
		// copy the paths!
		let patterns = [...this.settings.ignorePatterns];

		// TODO: dirty fix to always ignore trash folder
		if (this.settings.trashFolderOverride.length > 0)
			patterns.push("^" + this.settings.trashFolderOverride);

		return new RegexFilter(patterns);
	}

	shouldUseSystemTrash(): boolean {
		// filtering the config value and defaulting to local trash if its undefined
		switch (this.app.vault.config.trashOption) {
			case "system":
				return true;

			default:
				return false;
		}
	}

	getAttachmentsPaths(): string[] {
		if (this.settings.attachmentsPaths.length === 0)
			return [this.app.vault.config.attachmentFolderPath];

		return this.settings.attachmentsPaths;
	}

	isAttachment(file: TFile): boolean {
		return this.getAttachmentsPaths().some(element => {
			let cur = file;
			while (cur.parent) {
				if (element.startsWith("./") && cur.parent.name == element.substring(2))
					return true;
	
				if (cur.parent.path == element)
					return true;

				cur = cur.parent;
			}
		});
	}

	// returns all files linked from canvases
	async getCanvasLinks(): Promise<Set<string>> {
		let links = new Set<string>();

		// go over all canvas files
		await Promise.all(this.app.vault.getFiles().filter(f => f.extension === 'canvas').map(async (f) => {
			const content = await this.app.vault.read(f);

			// parse as a canvas (its just json)
			try {
				const canvas: CanvasData = JSON.parse(content);

				// get all linked files
				canvas.nodes.filter(node => node.type === 'file').forEach(node => links.add(node.file));
			} catch (e) {
				console.error("Error parsing canvas file " + f.path + "\n", e);
			}

			return Promise.resolve();
		}));

		return links;
	}

	// returns list of files that are not linked by any file
	async getOrphans(): Promise<TFile[]> {
		const links = new Set<string>(Object.values(this.app.metadataCache.resolvedLinks).flatMap(x => Object.keys(x)));
		const canvasLinks = await this.getCanvasLinks();
		const filter = this.getIgnoreFilter();

		return this.app.vault.getFiles().filter(file => {
				return ![links.has(file.path), canvasLinks.has(file.path), filter.test(file.path)].some(x => x === true);
			}
		);
	}

	// asks the user to trash files
	trash(files: TFile[]) {
		if (files.length > 0)
			new TrashFilesModal(this.app, files, this.settings.trashFolderOverride, this.shouldUseSystemTrash()).open();
		else
			new Notice("No orphaned files have been found");
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "nuke-orphaned-attachments",
			name: "Trash orphaned attachments",
			callback: async () =>
				this.trash((await this.getOrphans()).filter(file => this.isAttachment(file))),
		});

		this.addCommand({
			id: "nuke-orphaned-notes",
			name: "Trash orphaned notes",
			callback: async () =>
				this.trash((await this.getOrphans()).filter(file => file.extension === "md")),
		});

		this.addCommand({
			id: "nuke-orphaned",
			name: "Trash orphaned files",
			callback: async () =>
				this.trash(await this.getOrphans()),
		});

		this.addSettingTab(new NukeOrphansSettingsTab(this.app, this));
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
