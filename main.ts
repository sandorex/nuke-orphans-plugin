import { App, Modal, Plugin, TFile } from 'obsidian';

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
			cls: "trash-file-modal-text",
			text: file.path
		}));

		contentEl.createEl("button", { text: "Cancel" })
			.addEventListener("click", () => this.close());

		contentEl.createEl("button", {
			cls: ["mod-cta", "modal-confirm-button"],
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

export default class NukeOrphansPlugin extends Plugin {
	nuke() {
		// TODO: still messy but it just gets all linked files ignoring linkers
		// set containing linked files, each file has only one entry
		var links = new Set<String>(Object.entries(this.app.metadataCache.resolvedLinks).flatMap(x => Object.entries(x[1]).map(y => y[0])));

		var filesToDelete = this.app.vault.getFiles().filter(file => {
			// TODO: find a way to get attachments folder and just use settings for now..
			return file.parent.name == "@Attachments"
				// TODO: do the resolved links use abs path? if not this may fail
				&& !links.has(file.path)
		});

		if (filesToDelete.length > 0)
			new TrashFilesModal(this.app, filesToDelete).open();
	}

	async onload() {
		console.log("Loaded plugin " + this.manifest.name + " " + this.manifest.version);

		this.addCommand({
			id: 'nuke-orphans',
			name: 'Move orphaned attachments into trash',
			callback: () => this.nuke(),
		});
	}

	onunload() {
		console.log("Unoaded plugin " + this.manifest.name + " " + this.manifest.version);
	}
}
