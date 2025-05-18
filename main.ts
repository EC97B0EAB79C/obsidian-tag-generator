import { Notice, Plugin, Editor, MarkdownView } from 'obsidian';
import { TagGeneratorSettingTab } from './settings';
import OpenAI from "openai";

// const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";

interface TagGeneratorPluginSettings {
    token: string;
}

const DEFAULT_SETTINGS: Partial<TagGeneratorPluginSettings> = {
    token: '',
};

export default class TagGeneratorPlugin extends Plugin {
    settings: TagGeneratorPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new TagGeneratorSettingTab(this.app, this));

        this.addCommand({
            id: 'generate-tag',
            name: 'Generate Tag',
            // hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 't' }],
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                // new Notice(`${view.file?.path}`);
                new Notice('Generating tag...');

                const client = new OpenAI({ baseURL: endpoint, apiKey: this.settings.token, dangerouslyAllowBrowser: true });

                const response = await client.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: "This is a API test" }
                    ] as Array<{ role: "system" | "user" | "assistant"; content: string }>,
                    temperature: 1.0,
                    top_p: 1.0,
                    model: model
                });

                new Notice(`Response: ${response.choices[0].message.content}`);
            }
        });

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
