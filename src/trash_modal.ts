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

		this.files.forEach(file => {
			contentEl.createEl("p", {
				cls: "trash-modal-file-link",
				text: file.path
			}).addEventListener("click", async (e) => {
				this.close();
				await this.app.workspace.activeLeaf.openFile(file);
			});
		});

		// move the filenames away from the buttons for readability
		contentEl.createEl("br");

		contentEl.createEl("p", {
			cls: "trash-modal-file-link",
			text: "Copy list to clipboard"
		}).addEventListener("click", async (e) => {
			await navigator.clipboard.writeText(this.files.map(file => file.path).join("\n"));
			new Notice("Copied list to clipboard");
		});

		contentEl.createEl("button", {
			text: "Cancel"
		}).addEventListener("click", () => this.close());

		contentEl.createEl("button", {
			cls: ["mod-cta", "trash-modal-button"],
			text: "Confirm"
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
