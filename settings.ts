import TagGeneratorPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export class TagGeneratorSettingTab extends PluginSettingTab {
    plugin: TagGeneratorPlugin;

    constructor(app: App, plugin: TagGeneratorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setHeading()
            .setName('General Settings')

        new Setting(containerEl)
            .setName('Github Token')
            .setDesc('Enter your Github token here')
            .addText((text) =>
                text
                    .setPlaceholder('ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                    .setValue(this.plugin.settings.token)
                    .onChange(async (value) => {
                        this.plugin.settings.token = value;
                        await this.plugin.saveSettings();
                    })
            );


        new Setting(containerEl)
            .setHeading()
            .setName('Selected Text Settings')

        new Setting(containerEl)
            .setName('Tag Location')
            .setDesc('Select where to add the tag')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.selTagLocationTop)
                    .onChange(async (value) => {
                        console.log('Setting selTagLocationTop to ' + value);
                        this.plugin.settings.selTagLocationTop = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}