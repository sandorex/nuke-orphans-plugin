import { App, Modal, Notice, TFile } from "obsidian";
import * as path from 'path';

export class TrashFilesModal extends Modal {
	readonly files: TFile[];
	readonly trashFolderPath: string;
	readonly useSystemTrash: boolean;

	constructor(app: App, files: TFile[], trashFolderPath: string, useSystemTrash: boolean) {
		super(app);
		this.files = files;
		this.trashFolderPath = trashFolderPath;
		this.useSystemTrash = useSystemTrash;
	}

	onOpen() {
		let { contentEl, titleEl } = this;
		titleEl.setText("Move " + this.files.length + " files to trash?");

		const div = contentEl.createDiv({
			cls: "trash-modal-file-links",
		})

		this.files.forEach(file => {
			div.createEl("p", {
				cls: "trash-modal-link",
				text: file.path
			}).addEventListener("click", async () => {
				this.close();
				await this.app.workspace.activeLeaf.openFile(file);
			});

			// TODO: add checkbox next to path to cherry pick files
		});

		contentEl.createEl("button", {
			cls: ["trash-modal-button"],
			text: "Cancel"
		}).addEventListener("click", () => this.close());

		contentEl.createEl("button", {
			cls: ["trash-modal-button"],
			text: "Copy list to clipboard",
		}).addEventListener("click", async () => {
			await navigator.clipboard.writeText(this.files.map(file => file.path).join("\n"));
			new Notice("Copied list to clipboard");
		});

		contentEl.createEl("button", {
			cls: ["mod-cta", "trash-modal-button"],
			text: "Trash"
		}).addEventListener("click", async () => {
			if (this.trashFolderPath.length > 0) {
				if (!await this.app.vault.adapter.exists(this.trashFolderPath))
					await this.app.vault.createFolder(this.trashFolderPath);

				this.files.forEach(async (file) =>
					await this.app.fileManager.renameFile(file, path.join(this.trashFolderPath, file.name))
				);
			} else
				this.files.forEach(async (file) =>
					await this.app.vault.trash(file, this.useSystemTrash));

			new Notice("Trashed " + this.files.length + " files");

			this.close();
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
