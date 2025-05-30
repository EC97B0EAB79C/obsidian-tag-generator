import { Notice, Plugin, Editor, MarkdownView, getAllTags, MetadataCache } from 'obsidian';
import { TagGeneratorSettingTab } from './settings';
import { LLMGeneration } from './llm';

const prompt = (nOfTagsCategory: number, nOfTagsGeneral: number, nOfTagsSpecific: number) => `This GPT helps users generate a set of relevant keywords or tags based on the content of any note or text they provide.
It offers concise, descriptive, and relevant tags that help organize and retrieve similar notes or resources later.
The GPT will aim to provide up to ${nOfTagsCategory + nOfTagsGeneral + nOfTagsSpecific} keywords, with ${nOfTagsCategory} keyword acting as a category, ${nOfTagsGeneral} general tags applicable to a broad context, and ${nOfTagsSpecific} being more specific to the content of the note.
It avoids suggesting overly generic or redundant keywords unless necessary.
It will list the tags using underscores instead of spaces, ordered from the most general to the most specific.
Every tag will be lowercase.
Return the list in json format with key "keywords" for keyword list.`;


interface TagGeneratorPluginSettings {
    // General settings
    token: string;
    model: string;
    endpoint: string;

    // Tag generation settings
    nOfTags: number;
    ratioOfGeneralSpecific: number;

    // Setting for entire note

    // Setting for selected text
    selTagLocationTop: boolean;

    // PPLX Settings
    pplxToken: string;
    pplxModel: string;
}

const DEFAULT_SETTINGS: Partial<TagGeneratorPluginSettings> = {
    // General settings
    token: '',
    model: "openai/gpt-4.1-mini",
    endpoint: '',

    // Tag generation settings
    nOfTags: 10,
    ratioOfGeneralSpecific: 0.4,

    // Setting for entire note

    // Setting for selected text
    selTagLocationTop: true,

    // PPLX Settings
    pplxToken: '',
    pplxModel: "sonar"
};

export default class TagGeneratorPlugin extends Plugin {
    settings: TagGeneratorPluginSettings;
    llm = new LLMGeneration();

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
                const tags = await this.generateTagFromText(
                    editor.getValue(),
                    view.getDisplayText()
                );
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
                const tags = await this.generateTagFromText(
                    selectedText,
                    view.getDisplayText(),
                    await this.getCurrentHeadingText(view)
                );
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

    async generateTagFromText(text: string, displayText: string, headingText?: string): Promise<string[]> {
        const nOfTagsGeneral = Math.ceil((this.settings.nOfTags - 1) * this.settings.ratioOfGeneralSpecific);
        const nOfTagsSpecific = (this.settings.nOfTags - 1) - nOfTagsGeneral;
        const systemPrompt = prompt(1, nOfTagsGeneral, nOfTagsSpecific);
        console.log("System prompt:", systemPrompt);

        const userPrompt = `Generate tags for the following text from: note "${displayText}"${headingText ? ` > section "${headingText}"` : ''}`;
        console.log("User prompt:", userPrompt);

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            { role: "user", content: text }
        ]

        const tags = await this.llm.completion(
            this.settings.model,
            this.settings.token,
            messages,
            this.settings.endpoint
        );

        return tags;
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

    async getCurrentHeadingText(view: MarkdownView): Promise<string> {
        const cursorLine = view.editor.getCursor("from").line - 1;
        const cache = this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile());

        let currentHeading = '';
        for (const h of cache.headings) {
            if (h.position.start.line <= cursorLine) {
                currentHeading = h.heading;
            } else {
                break;
            }
        }

        return currentHeading;
    }
}
