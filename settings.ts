import TagGeneratorPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';


const modelOptions = [
    { name: 'Gemini 2.5 Flash', value: 'gemini/gemini-2.5-flash' },
    { name: 'Gemini 2.5 Flash-Lite Preview', value: 'gemini/gemini-2.5-flash-lite-preview-06-17' },
    { name: 'Gemini 2.0 Flash', value: 'gemini/gemini-2.0-flash' },
    { name: 'Gemini 2.0 Flash-Lite', value: 'gemini/gemini-2.0-flash-lite' },
    { name: 'Gemini 1.5 Flash', value: 'gemini/gemini-1.5-flash' },
    { name: 'Gemini 1.5 Pro', value: 'gemini/gemini-1.5-pro' },
    { name: 'OpenAI GPT-4.1-nano', value: 'openai/gpt-4.1-nano' },
    { name: 'OpenAI GPT-4.1-mini', value: 'openai/gpt-4.1-mini' },
    { name: 'OpenAI GPT-4.1', value: 'openai/gpt-4.1' },
    { name: 'OpenAI GPT-4o', value: 'openai/gpt-4o' },
    { name: 'OpenAI GPT-4o mini', value: 'openai/gpt-4o-mini' },
    { name: 'OpenAi o4-mini', value: 'openai/o4-mini' },
    { name: 'OpenAi o3-mini', value: 'openai/o3-mini' },
    { name: 'OpenAi o3', value: 'openai/o3' },
    { name: 'OpenAI o1', value: 'openai/o1' },
    { name: 'Sonar Pro', value: 'pplx/sonar-pro' },
    { name: 'Sonar', value: 'pplx/sonar' },
];

export interface ApiKeys {
    openai: string;
    pplx: string;
    gemini: string;
}

export interface Endpoint {
    openai: string;
}

export class TagGeneratorSettingTab extends PluginSettingTab {
    plugin: TagGeneratorPlugin;

    constructor(app: App, plugin: TagGeneratorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        // ---- Plugin Settings -----------------------------------------------------
        // Tag Generator Settings
        new Setting(containerEl)
            .setHeading()
            .setName('Tag Generator Settings');

        new Setting(containerEl)
            .setName('Model')
            .setDesc('Select the model to use for tag generation')
            .addDropdown((dropdown) => {
                modelOptions.forEach(opt =>
                    dropdown.addOption(opt.value, opt.name)
                );
                dropdown
                    .setValue(this.plugin.settings.modelTagGeneration)
                    .onChange(async (value) => {
                        this.plugin.settings.modelTagGeneration = value;
                        await this.plugin.saveSettings();
                    });
            });

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
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0 && num <= 1) {
                            this.plugin.settings.ratioOfGeneralSpecific = num;
                            await this.plugin.saveSettings();
                        }
                    })
            );

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

        // Citation Settings
        new Setting(containerEl)
            .setHeading()
            .setName('Citation Settings');

        new Setting(containerEl)
            .setName('Model')
            .setDesc('Select the model to use for citation generation')
            .addDropdown((dropdown) => {
                modelOptions.forEach(opt =>
                    dropdown.addOption(opt.value, opt.name)
                );
                dropdown
                    .setValue(this.plugin.settings.modelCiteGeneration)
                    .onChange(async (value) => {
                        this.plugin.settings.modelCiteGeneration = value;
                        await this.plugin.saveSettings();
                    });
            });

        // ---- API Settings -----------------------------------------------------
        new Setting(containerEl)
            .setHeading()
            .setName('API Settings');

        // OpenAI Settings
        new Setting(containerEl)
            .setName('OpenAI API Token')
            .setDesc('Enter your OpenAI API Token here')
            .addText((text) =>
                text
                    .setPlaceholder('sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                    .setValue(this.plugin.settings.token.openai)
                    .onChange(async (value) => {
                        this.plugin.settings.token["openai"] = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('OpenAI API Endpoint')
            .setDesc('Enter your OpenAI API Endpoint here (optional)')
            .addText((text) =>
                text
                    .setPlaceholder('https://api.openai.com/v1')
                    .setValue(this.plugin.settings.endpoint["openai"])
                    .onChange(async (value) => {
                        this.plugin.settings.endpoint["openai"] = value;
                        await this.plugin.saveSettings();
                    })
            );

        // PPLX Settings
        new Setting(containerEl)
            .setName('Perplexity API Key')
            .setDesc('Enter your Perplexity API Key here')
            .addText((text) =>
                text
                    .setPlaceholder('pplx_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                    .setValue(this.plugin.settings.token.pplx)
                    .onChange(async (value) => {
                        this.plugin.settings.token.pplx = value;
                        await this.plugin.saveSettings();
                    })
            );

        // Gemini Settings
        new Setting(containerEl)
            .setName('Gemini API Token')
            .setDesc('Enter your Gemini API Token here')
            .addText((text) =>
                text
                    .setPlaceholder('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                    .setValue(this.plugin.settings.token.gemini)
                    .onChange(async (value) => {
                        this.plugin.settings.token.gemini = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}