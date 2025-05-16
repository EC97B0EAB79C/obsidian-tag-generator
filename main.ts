import { Notice, Plugin, Editor, MarkdownView } from 'obsidian';
import OpenAI from "openai";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";

export default class MyPlugin extends Plugin {

    async onload() {
        this.addCommand({
            id: 'generate-tag',
            name: 'Generate Tag',
            // hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 't' }],
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                // new Notice(`${view.file?.path}`);
                new Notice('Generating tag...');

                const client = new OpenAI({ baseURL: endpoint, apiKey: token, dangerouslyAllowBrowser: true });

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
}
