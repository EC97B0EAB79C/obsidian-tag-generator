import TagGeneratorPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';


const getModelOptions = [
    { name: 'OpenAI GPT-4.1-nano', value: 'openai/gpt-4.1-nano' },
    { name: 'OpenAI GPT-4.1-mini', value: 'openai/gpt-4.1-mini' },
    { name: 'OpenAI GPT-4.1', value: 'openai/gpt-4.1' },
    { name: 'OpenAI GPT-4o', value: 'openai/gpt-4o' },
    { name: 'OpenAI GPT-4o mini', value: 'openai/gpt-4o-mini' },
];

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
            .setName('Model')
            .setDesc('Select the model to use for tag generation')
            .addDropdown((dropdown) => {
                getModelOptions.forEach(opt =>
                    dropdown.addOption(opt.value, opt.name)
                );
                dropdown
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value;
                        await this.plugin.saveSettings();
                    });
            });

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