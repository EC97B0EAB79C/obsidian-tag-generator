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

        // LLM Settings
        new Setting(containerEl)
            .setHeading()
            .setName('LLM Settings')

        new Setting(containerEl)
            .setName('API Token')
            .setDesc('Enter your API Token here')
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
            .setName('API Endpoint')
            .setDesc('Enter your API Endpoint here (optional)')
            .addText((text) =>
                text
                    .setPlaceholder('https://api.openai.com/v1')
                    .setValue(this.plugin.settings.endpoint)
                    .onChange(async (value) => {
                        this.plugin.settings.endpoint = value;
                        await this.plugin.saveSettings();
                    })
            );

        // Tag Generation Settings
        new Setting(containerEl)
            .setHeading()
            .setName('Tag Generation Settings')

        new Setting(containerEl)
            .setName('Number of Tags')
            .setDesc('Number of tags to generate')
            .addText((text) =>
                text
                    .setPlaceholder('10')
                    .setValue(this.plugin.settings.nOfTags.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.nOfTags = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        new Setting(containerEl)
            .setName('Ratio of General to Specific Tags')
            .setDesc('(0.4 means 40% general tags and 60% specific tags)')
            .addText((text) =>
                text
                    .setPlaceholder('0.4')
                    .setValue(this.plugin.settings.ratioOfGeneralSpecific.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0 && num <= 1) {
                            this.plugin.settings.ratioOfGeneralSpecific = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );

        // Setting for Selected Text Generation
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