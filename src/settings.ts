import { App, PluginSettingTab, Setting } from "obsidian";
import NukeOrphansPlugin from "./main";

export interface NukeOrphansSettings {
	attachmentsPath: string,
}

export const DEFAULT_SETTINGS: NukeOrphansSettings = {
	attachmentsPath: "", // get from config by default
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
			},
			text: "Nuke Orphans Plugin Settings"
		});

		new Setting(containerEl)
			.setName("Attachment Folder")
			.setDesc("Where attachments are stored (if empty reads value in obsidian config)")
			.addText(text =>
				text.setPlaceholder(this.app.vault.config.attachmentFolderPath)
					.setValue(this.plugin.settings.attachmentsPath)
					.onChange(async (value) => {
						// TODO: test if path is valid '/x/y/z' or './x'

						this.plugin.settings.attachmentsPath = value;
						await this.plugin.saveSettings();
					}));
	}
}
