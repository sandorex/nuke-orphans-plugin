# Nuke Orphans Obsidian Plugin
Simple plugin that trashes orphaned attachments using a command

> WARNING While this plugin **should** always move files to trash so you can restore them if need be, i am not responsible for any potenital loss of data for using this plugin

## How Does It Work
The plugin uses obsidian resolved links and checks if files in the attachment folder have any links linking to them
If there are none they are deleted when command `nuke-orphans` is ran

![](screenshot.png)

## Installation
### Community Repository
*I will make a PR as soon as this is ready for use*

### Manual
Copy following files into `.obsidian/plugin/nuke-orphans/`
- `main.js`
- `manifest.json`
