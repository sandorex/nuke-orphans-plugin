import { Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, NukeOrhpansSettingsTab, NukeOrphansSettings } from "./settings";
import { TrashFilesModal } from "./trash_modal";

export default class NukeOrphansPlugin extends Plugin {
	settings: NukeOrphansSettings;

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

		return this.app.vault.getFiles().filter(file => !links.has(file.path));
	}

	// asks the user to trash files
	trash(files: TFile[]) {
		if (files.length > 0)
			new TrashFilesModal(this.app, files).open();
		else
			new Notice("No orphaned files have been found");
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "nuke-orphaned-attachments",
			name: "Trash orphaned attachments",
			callback: () => {
				this.trash(this.getOrphans().filter(file => this.isAttachment(file)))
			},
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

		this.addSettingTab(new NukeOrhpansSettingsTab(this.app, this));
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
