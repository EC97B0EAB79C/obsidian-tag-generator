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
            .setName('Number of Category Tags')
            .setDesc('Number of tags to generate for the category')
            .addText((text) =>
                text
                    .setPlaceholder('1')
                    .setValue(this.plugin.settings.nOfTagsCategory.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.nOfTagsCategory = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        new Setting(containerEl)
            .setName('Number of General Tags')
            .setDesc('Number of tags to generate for the general category')
            .addText((text) =>
                text
                    .setPlaceholder('3')
                    .setValue(this.plugin.settings.nOfTagsGeneral.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.nOfTagsGeneral = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        new Setting(containerEl)
            .setName('Number of Specific Tags')
            .setDesc('Number of tags to generate for the specific category')
            .addText((text) =>
                text
                    .setPlaceholder('6')
                    .setValue(this.plugin.settings.nOfTagsSpecific.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.nOfTagsSpecific = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );


        new Setting(containerEl)
            .setHeading()
            .setName('Selected Text Settings')

        new Setting(containerEl)
            .setName('Tag Location')
            .setDesc('Add tags above the selected text')
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