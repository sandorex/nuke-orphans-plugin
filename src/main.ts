import { Notice, Plugin, TFile, TFolder, CanvasData } from "obsidian";
import { DEFAULT_SETTINGS, NukeOrphansSettings, NukeOrphansSettingsTab } from "./settings";
import { TrashFilesModal } from "./trash_modal";

/**
 * class that holds filters, both regex and string based
 */
class CustomFilter {
	// regex expressions that are filtered out
	private readonly regexes: Set<RegExp>;

	// literal values that are filtered out
	private readonly strings: Set<string>;

	constructor(regexes: string[], strings: string[]) {
		this.regexes = new Set<RegExp>(regexes.map(x => RegExp(x)));
		this.strings = new Set<string>(strings)
	}

	public test(input: string): boolean {
		return Array.from(this.regexes).some(x => x.test(input)) ||
			Array.from(this.strings).some(x => x === input);
	}
}

export default class NukeOrphansPlugin extends Plugin {
	settings: NukeOrphansSettings;

	// gets the filter that is filled with ignore path patterns
	getIgnoreFilter(): CustomFilter {
		let strings = [];

		// ignore the trash folder if set
		if (this.settings.trashFolderOverride.length > 0)
			strings.push(this.settings.trashFolderOverride)

		return new CustomFilter(this.settings.ignorePatterns, strings);
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
			console.log(file.path)
			// subfolder attachment folder
			if (element.startsWith("./")) {
				// use the hacky algorithm by default but allow switching
				//
				// normal users should not care about this but would allow me
				// to debug easier without changing too much code if some edge
				// case were to develop over time
				if (this.settings.alternativeAttachmentAlg) {
					// check each parent to see if it is an attachment
					let path: TFolder = file.parent;
					while (path.name !== undefined && path.name.length > 0) {
						if (path.name == element.substring(2))
							return true;

						path = path.parent;
					}
				} else {
					// hacky but should work fine, checking if attachments/ is
					// present in full path like '/something/else/attachments/xx.txt'
					return file.path.startsWith(element.substring(2)) ||
						file.path.contains(element.substring(1) + "/")
				}
			} else {
				if (file.parent.path == element)
					return true;

				if (file.path.startsWith(element))
					return true;
			}

			return false;
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

		// filtering all files, expensive but its not often done
		return this.app.vault.getFiles().filter(file => {
			// using some just in case any command returns undefined or smth
			return ![
				// does any note link to it
				links.has(file.path),

				// does any canvas link to it
				canvasLinks.has(file.path),

				// is it ignored in the regex filter
				filter.test(file.path)
			].some(x => x === true);
		});
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
			callback: async () => {
				new Notice("Gathering orphaned attachments..");
				this.trash((await this.getOrphans()).filter(file => this.isAttachment(file)));
			},
		});

		this.addCommand({
			id: "nuke-orphaned-notes",
			name: "Trash orphaned notes",
			callback: async () => {
				new Notice("Gathering orphaned notes..");
				this.trash((await this.getOrphans()).filter(file => file.extension === "md"));
			},
		});

		this.addCommand({
			id: "nuke-orphaned",
			name: "Trash orphaned files",
			callback: async () => {
				new Notice("Gathering orphaned files..");
				this.trash(await this.getOrphans())
			},
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
