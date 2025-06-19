import { Notice, Plugin, Editor, MarkdownView, MarkdownFileInfo, getAllTags, MetadataCache } from 'obsidian';
import { TagGeneratorSettingTab, ApiKeys, Endpoint } from './settings';
import { TagGeneration } from './tag_generation';
import { CiteGeneration } from './cite_generation';

interface TagGeneratorPluginSettings {
    // ---- Plugin Settings -----------------------------------------------------
    // Tag generation settings
    modelTagGeneration: string;
    nOfTags: number;
    ratioOfGeneralSpecific: number;
    selTagLocationTop: boolean;

    // Citation settings
    modelCiteGeneration: string;

    // ---- API Settings -----------------------------------------------------
    token: ApiKeys;
    endpoint: Endpoint;
}

const DEFAULT_SETTINGS: Partial<TagGeneratorPluginSettings> = {
    // ---- Plugin Settings -----------------------------------------------------
    // Tag generation settings
    modelTagGeneration: "openai/gpt-4.1-mini",
    nOfTags: 10,
    ratioOfGeneralSpecific: 0.4,
    selTagLocationTop: true,

    // Citation settings
    modelCiteGeneration: "sonar",

    // ---- API Settings -----------------------------------------------------
    token: { openai: '', pplx: '', gemini: '' },
    endpoint: { openai: '' }
};

export default class TagGeneratorPlugin extends Plugin {
    settings!: TagGeneratorPluginSettings;

    // ---- Main Plugin Methods --------------------------------------------------------------
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new TagGeneratorSettingTab(this.app, this));
        const tagGeneration = new TagGeneration(this);
        const citeGeneration = new CiteGeneration(this);

        // ---- Tag Generation Commands -----------------------------------------------------
        this.addCommand({
            id: 'generate-tag-note',
            name: 'Generate tag for entire note',
            hotkeys: [{ modifiers: ['Alt'], key: 'n' }],
            editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
                new Notice('Generating tag...');
                const view = ctx instanceof MarkdownView ? ctx : this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view) {
                    new Notice('No active markdown view');
                    return;
                }

                const tags = await tagGeneration.generateTagFromText(
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

        this.addCommand({
            id: 'generate-tag-selected',
            name: 'Generate tag for selected text',
            hotkeys: [{ modifiers: ['Alt'], key: 's' }],
            editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
                new Notice('Generating tag...');
                const view = ctx instanceof MarkdownView ? ctx : this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view) {
                    new Notice('No active markdown view');
                    return;
                }

                const selectedText = editor.getSelection();
                if (!selectedText) {
                    new Notice('No text selected');
                    return;
                }

                new Notice('Generating tag...');
                const tags = await tagGeneration.generateTagFromText(
                    selectedText,
                    view.getDisplayText(),
                    (await this.getCurrentHeadingText(view)).heading
                );
                if (!tags || tags.length === 0) {
                    new Notice('Problem with the tag generation');
                    return;
                }

                this.addTagsToSelection(editor, tags);
                new Notice(`Tag generated`);
            }
        });

        // ---- Citation Search Commands -----------------------------------------------------
        this.addCommand({
            id: 'search-citations',
            name: 'Search citation for entire note',
            editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
                new Notice('Searching citations...');
                const view = ctx instanceof MarkdownView ? ctx : this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view) {
                    new Notice('No active markdown view');
                    return;
                }

                let value = editor.getValue();
                const cursor = editor.getCursor();
                const result = await citeGeneration.generateCiteFromText(
                    value,
                    view.getDisplayText()
                );

                if (result.length == 0) {
                    new Notice("Problem with the citations search");
                    return;
                }

                const citation_list = this.generateCitationList(result);
                value += citation_list;
                editor.setValue(value);
                editor.setCursor(cursor);
                new Notice("Citation Added")
            }
        });

        this.addCommand({
            id: 'search-citations-selected',
            name: 'Search citation for selected text',
            editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
                new Notice('Searching citations...');
                const view = ctx instanceof MarkdownView ? ctx : this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view) {
                    new Notice('No active markdown view');
                    return;
                }

                const selectedText = editor.getSelection();
                if (!selectedText) {
                    new Notice('No text selected');
                    return;
                }
                const heading = await this.getCurrentHeadingText(view);

                const result = await citeGeneration.generateCiteFromText(
                    selectedText,
                    view.getDisplayText(),
                    heading.heading,
                );

                if (result.length == 0) {
                    new Notice("Problem with the citations search");
                    return;
                }

                const citation_list = this.generateCitationList(result, heading.level + 1);
                editor.replaceSelection(selectedText + citation_list);
                new Notice("Citation Added")
            }
        });

        // this.addCommand({
        //     id: 'test-command',
        //     name: 'Test Command',
        //     editorCallback: async (editor: Editor, view: MarkdownView) => {
        //         new Notice('Test Command Activated...');

        //         editor.setValue('test');
        //     }
        // })
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        if (typeof this.settings.token === 'string') {
            this.settings.token = { openai: '', pplx: '', gemini: '' };
        }
        if (typeof this.settings.endpoint === 'string') {
            this.settings.endpoint = { openai: '' };
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }


    // ---- Helper Methods -----------------------------------------------------
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

    generateCitationList(citations: { title: string, url: string }[], level: number = 2): string {
        let list = citations.map(citation => `- [${citation['title']}](${citation['url']})`).join('\n')
        list = `\n\n${"#".repeat(level)} Citations\n` + list + "\n";
        return list
    }

    async getCurrentHeadingText(view: MarkdownView): Promise<{ heading: string, level: number }> {
        const cursorLine = view.editor.getCursor("from").line - 1;
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file');
            return { heading: '', level: 0 };
        }
        const cache = this.app.metadataCache.getFileCache(activeFile);

        let currentHeading = '';
        let headingLevel = 0;
        const headings = cache?.headings || [];
        for (const h of headings) {
            if (h.position.start.line <= cursorLine) {
                currentHeading = h.heading;
                headingLevel = h.level;
            } else {
                break;
            }
        }

        return { heading: currentHeading, level: headingLevel };
    }
}
