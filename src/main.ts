import { Notice, Plugin, TFile } from "obsidian";
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

	getAttachmentsPath(): string {
		if (this.settings.attachmentsPath.length === 0)
			return this.app.vault.config.attachmentFolderPath;

		return this.settings.attachmentsPath;
	}

	isAttachment(file: TFile): boolean {
		if (this.settings.attachmentsPath.startsWith("./"))
			return file.parent.name == this.getAttachmentsPath().substring(2);

		return file.parent.path == this.getAttachmentsPath();
	}

	// returns list of files that are not linked by any file
	getOrphans(): TFile[] {
		const links = new Set<string>(Object.values(this.app.metadataCache.resolvedLinks).flatMap(x => Object.keys(x)));
		const filter = this.getIgnoreFilter();

		return this.app.vault.getFiles().filter(file =>
			!links.has(file.path) && !filter.test(file.path));
	}

	// asks the user to trash files
	trash(files: TFile[]) {
		if (files.length > 0)
			new TrashFilesModal(this.app, files, this.settings.trashFolderOverride).open();
		else
			new Notice("No orphaned files have been found");
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "nuke-orphaned-attachments",
			name: "Trash orphaned attachments",
			callback: () =>
				this.trash(this.getOrphans().filter(file => this.isAttachment(file))),
		});

		this.addCommand({
			id: "nuke-orphaned-notes",
			name: "Trash orphaned notes",
			callback: () =>
				this.trash(this.getOrphans().filter(file => file.extension === "md")),
		});

		this.addCommand({
			id: "nuke-orphaned",
			name: "Trash orphaned files",
			callback: () =>
				this.trash(this.getOrphans()),
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
