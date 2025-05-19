import { Notice, Plugin, Editor, MarkdownView } from 'obsidian';
import { TagGeneratorSettingTab } from './settings';
import OpenAI from "openai";

// const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";
const prompt = `This GPT helps users generate a set of relevant keywords or tags based on the content of any note or text they provide.
It offers concise, descriptive, and relevant tags that help organize and retrieve similar notes or resources later.
The GPT will aim to provide up to 10 keywords, with 1 keyword acting as a category, 3 general tags applicable to a broad context, and 6 being more specific to the content of the note.
It avoids suggesting overly generic or redundant keywords unless necessary.
It will list the tags using underscores instead of spaces, ordered from the most general to the most specific.
Every tag will be lowercase.
Return the list in json format with key "keywords" for keyword list.`;

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
                console.log(view.getViewData());

                const client = new OpenAI({
                    baseURL: endpoint,
                    apiKey: this.settings.token,
                    dangerouslyAllowBrowser: true
                });

                const response = await client.chat.completions.create({
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: view.getViewData() }
                    ] as Array<{ role: "system" | "user" | "assistant"; content: string }>,
                    temperature: 1.0,
                    top_p: 1.0,
                    model: model,
                    response_format: { type: "json_object" },
                });
                const jsonResponse = response.choices[0].message.content;
                const json = JSON.parse(jsonResponse);
                console.log(json.keywords);

                // new Notice(`Response: ${response.choices[0].message.content}`);
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
