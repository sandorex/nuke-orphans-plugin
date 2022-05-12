import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";
import NukeOrphansPlugin from "./main";

export interface NukeOrphansSettings {
	attachmentsPath: string;
}

export const DEFAULT_SETTINGS: NukeOrphansSettings = {
	attachmentsPath: "/",
}

export class NukeOrhpansSettingsTab extends PluginSettingTab {
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
			}, text: "Nuke Orphans Plugin Settings"
		});

		var textEl: TextComponent = null;
		new Setting(containerEl)
			.setName("Attachment Folder")
			.setDesc("Where attachments are stored")
			.addText(text => {
				text.setPlaceholder(DEFAULT_SETTINGS.attachmentsPath)
					.setValue(this.plugin.settings.attachmentsPath)
					.onChange(async (value) => {
						// TODO: test if path is valid '/x/y/z' or './x'

						if (value.length == 0)
							this.plugin.settings.attachmentsPath = DEFAULT_SETTINGS.attachmentsPath;
						else
							this.plugin.settings.attachmentsPath = value;

						await this.plugin.saveSettings();
					})

				textEl = text;

				return text;
			})
			.addButton(btn => {
				btn.setButtonText("From config")
					.setCta()
					.onClick(async () => {
						// WARNING: this uses non public API and so may break in the future
						// @ts-ignore
						if (typeof this.app.vault.config.attachmentFolderPath !== "undefined") {
							console.log("Reading attachmentFolderPath from obsidian config")

							// @ts-ignore
							this.plugin.settings.attachmentsPath = this.app.vault.config.attachmentFolderPath;
							await this.plugin.saveSettings();

							textEl.setValue(this.plugin.settings.attachmentsPath)
						} else {
							console.error("Could not read attachmentFolderPath from obsidian config")
						}
					})
			});
	}
}
