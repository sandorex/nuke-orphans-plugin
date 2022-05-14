import { App, Modal, Notice, TFile } from "obsidian";

export class TrashFilesModal extends Modal {
	files: TFile[];
	constructor(app: App, files: TFile[]) {
		super(app);
		this.files = files;
	}

	onOpen() {
		let { contentEl, titleEl } = this;
		titleEl.setText("Move " + this.files.length + " files to obsidian trash?");

		const div = contentEl.createDiv({
			cls: "trash-modal-file-links",
		})

		this.files.forEach(file => {
			div.createEl("p", {
				cls: "trash-modal-link",
				text: file.path
			}).addEventListener("click", async (e) => {
				this.close();
				await this.app.workspace.activeLeaf.openFile(file);
			});
		});

		contentEl.createEl("button", {
			text: "Cancel"
		}).addEventListener("click", () => this.close());

		contentEl.createEl("button", {
			text: "Copy to clipboard",
		}).addEventListener("click", () => this.close());

		contentEl.createEl("button", {
			cls: ["mod-cta", "trash-modal-button"],
			text: "Trash"
		}).addEventListener("click", async () => {
			for (const file of this.files) {
				await this.app.vault.trash(file, false);
			}

			new Notice("Trashed " + this.files.length + " files");

			this.close();
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
