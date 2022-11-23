import { App, PluginSettingTab, Setting } from "obsidian";
import NukeOrphansPlugin from "./main";

export interface NukeOrphansSettings {
	attachmentsPaths: string[],
	trashFolderOverride: string,
	ignorePatterns: string[],
}

export const DEFAULT_SETTINGS: NukeOrphansSettings = {
	attachmentsPaths: [], // get from config by default
	trashFolderOverride: "",
	ignorePatterns: [],
}

const CSS_CLASS_CHECK_PASS = "nuke-orphans-pass"
const CSS_CLASS_CHECK_FAIL = "nuke-orphans-fail"

export class NukeOrphansSettingsTab extends PluginSettingTab {
	plugin: NukeOrphansPlugin;

	constructor(app: App, plugin: NukeOrphansPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h3", {
			attr: {
				"style": "text-align: center;",
			},
			text: "Nuke Orphans Plugin Settings"
		});

		new Setting(containerEl)
			.setName("Override Attachment Folder")
			.setDesc("Where attachments are stored")
			.addTextArea(text =>
				text.setPlaceholder(this.app.vault.config.attachmentFolderPath)
					.setValue(this.plugin.settings.attachmentsPaths.join('\n'))
					.onChange(async (value) => {
						// TODO: test if path is valid '/x/y/z' or './x'

						this.plugin.settings.attachmentsPaths = value.split('\n').map(x => x.trim()).filter(x => x.length > 0);
						await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
			.setName("Override Trash Folder")
			.setDesc("Trash folder path, will be created if it does not exist")
			.addText(text =>
				text.setPlaceholder(this.plugin.shouldUseSystemTrash() ? "system trash" : ".trash/")
					.setValue(this.plugin.settings.trashFolderOverride)
					.onChange(async (value) => {
						this.plugin.settings.trashFolderOverride = value;
						await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
			.setName("Ignore Patterns")
			.setDesc("Add regex patterns to ignore when searching for orphans")
			.addTextArea(text =>
				text.setValue(this.plugin.settings.ignorePatterns.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.ignorePatterns = value.split("\n").map(x => x.trim()).filter(x => x.length > 0);
						await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
			.setName("Test Settings")
			.setDesc("If the path is ignored it will be red, otherwise green")
			.addText(text => {
				function resetColor() {
					text.inputEl.classList.remove(CSS_CLASS_CHECK_PASS, CSS_CLASS_CHECK_FAIL);
				}

				// check filter on change of text
				text.onChange(value => {
					resetColor();

					if (value.length == 0)
						return;

					if (this.plugin.getIgnoreFilter().test(value))
						text.inputEl.classList.add(CSS_CLASS_CHECK_FAIL);
					else
						text.inputEl.classList.add(CSS_CLASS_CHECK_PASS);
				});

				// reset color when focus is lost
				text.inputEl.addEventListener("focusout", () => resetColor());

				// trigger color update on refocus
				text.inputEl.addEventListener("focusin", () => text.onChanged());
			});
	}
}
