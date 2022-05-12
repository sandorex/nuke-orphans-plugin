import { App, Modal, TFile } from "obsidian";

export class TrashFilesModal extends Modal {
	files: TFile[];
	constructor(app: App, files: TFile[]) {
		super(app);
		this.files = files;
	}

	onOpen() {
		let { contentEl, titleEl } = this;
		titleEl.setText("Move " + this.files.length + " files to obsidian trash?");

		this.files.forEach(file => contentEl.createEl("p", {
			attr: {
				"style": "line-height: 10px;",
			},
			text: file.path
		}));

		contentEl.createEl("button", { text: "Cancel" })
			.addEventListener("click", () => this.close());

		contentEl.createEl("button", {
			cls: ["mod-cta", "modal-confirm-button"],
			attr: {
				"style": "float: right;",
			},
			text: "Confirm"
		}).addEventListener("click", async () => {
			for (const file of this.files) {
				await this.app.vault.trash(file, false);
			}

			this.close();
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
