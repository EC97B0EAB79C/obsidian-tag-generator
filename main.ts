import { Notice, Plugin, Editor, MarkdownView } from 'obsidian';

export default class MyPlugin extends Plugin {

    async onload() {
        this.addCommand({
            id: 'generate-tag',
            name: 'Generate Tag',
            // hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 't' }],
            editorCallback: (editor: Editor, view: MarkdownView) => {
                new Notice('Generating Tag...');
            }
        });
    }
}
