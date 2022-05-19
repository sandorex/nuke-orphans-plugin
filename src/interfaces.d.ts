import "obsidian";

declare module "obsidian" {
	interface Vault {
		config: {
			attachmentFolderPath: string,
			trashOption: boolean,
		}
	}
}
