import { Notice, Plugin, Editor, MarkdownView, getAllTags, MetadataCache } from 'obsidian';
import { TagGeneratorSettingTab } from './settings';
import OpenAI from "openai";

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
    // General settings
    token: string;

    // Setting for entire note

    // Setting for selected text
    selTagLocationTop: boolean;

}

const DEFAULT_SETTINGS: Partial<TagGeneratorPluginSettings> = {
    token: '',

    selTagLocationTop: true,
};

export default class TagGeneratorPlugin extends Plugin {
    settings: TagGeneratorPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new TagGeneratorSettingTab(this.app, this));

        // Add a command to generate tags from the entire note
        this.addCommand({
            id: 'generate-tag-note',
            name: 'Generate tag for entire note',
            hotkeys: [{ modifiers: ['Alt'], key: 'n' }],
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                new Notice('Generating tag...');
                const tags = await this.generateTagFromText(editor.getValue());
                if (!tags || tags.length === 0) {
                    new Notice('Problem with the tag generation');
                    return;
                }

                this.addTagsToFrontmatter(tags);
                new Notice(`Tag generated`);
            }
        });

        // Add a command to generate tags from the selected text
        this.addCommand({
            id: 'generate-tag-selected',
            name: 'Generate tag for selected text',
            hotkeys: [{ modifiers: ['Alt'], key: 's' }],
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const selectedText = editor.getSelection();
                if (!selectedText) {
                    new Notice('No text selected');
                    return;
                }

                new Notice('Generating tag...');
                const tags = await this.generateTagFromText(selectedText);
                if (!tags || tags.length === 0) {
                    new Notice('Problem with the tag generation');
                    return;
                }

                this.addTagsToSelection(editor, tags);
                new Notice(`Tag generated`);
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async generateTagFromText(text: string): Promise<string[]> {
        try {
            console.log("Generating tag from text:", text);

            const client = new OpenAI({
                baseURL: endpoint,
                apiKey: this.settings.token,
                dangerouslyAllowBrowser: true
            });
            console.log("Client created:", client);

            const response = await client.chat.completions.create({
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: text }
                ],
                temperature: 1.0,
                top_p: 1.0,
                model: model,
                response_format: { type: "json_object" },
            });
            console.log("Response received:", response);

            const jsonResponse = response.choices[0].message.content;
            const json = JSON.parse(jsonResponse);

            return json.keywords;
        } catch (error) {
            console.error("Error generating tag:", error);
            return [];
        }
    }

    async addTagsToFrontmatter(tags: string[]) {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            new Notice('No active file');
            return;
        }

        this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            frontmatter["tags"] = (frontmatter["tags"] || []).concat(tags);
        });
    }

    async addTagsToSelection(editor: Editor, tags: string[]) {
        const selectedText = editor.getSelection();
        const tagString = tags.map(t => `#${t}`).join(' ');
        let replaceText = "";
        if (this.settings.selTagLocationTop) {
            replaceText = tagString + "\n\n" + selectedText;
        } else {
            replaceText = selectedText + "\n\n" + tagString;
        }
        editor.replaceSelection(replaceText);
    }
}
