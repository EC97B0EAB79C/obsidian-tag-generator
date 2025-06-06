import TagGeneratorPlugin from './main';
import { LLMGeneration } from './llm';

const prompt = (nOfTagsCategory: number, nOfTagsGeneral: number, nOfTagsSpecific: number) => `This GPT helps users generate a set of relevant keywords or tags based on the content of any note or text they provide.
It offers concise, descriptive, and relevant tags that help organize and retrieve similar notes or resources later.
The GPT will aim to provide up to ${nOfTagsCategory + nOfTagsGeneral + nOfTagsSpecific} keywords, with ${nOfTagsCategory} keyword acting as a category, ${nOfTagsGeneral} general tags applicable to a broad context, and ${nOfTagsSpecific} being more specific to the content of the note.
It avoids suggesting overly generic or redundant keywords unless necessary.
It will list the tags using underscores instead of spaces, ordered from the most general to the most specific.
Every tag will be lowercase.
Return the list in json format with key "keywords" for keyword list.`;

export class TagGeneration {
    plugin: TagGeneratorPlugin;
    llm: LLMGeneration;

    constructor(plugin: TagGeneratorPlugin) {
        this.plugin = plugin;
        this.llm = new LLMGeneration();
    }

    async generateTagFromText(text: string, displayText: string, headingText?: string): Promise<string[]> {
        const nOfTagsGeneral = Math.ceil((this.plugin.settings.nOfTags - 1) * this.plugin.settings.ratioOfGeneralSpecific);
        const nOfTagsSpecific = (this.plugin.settings.nOfTags - 1) - nOfTagsGeneral;
        const systemPrompt = prompt(1, nOfTagsGeneral, nOfTagsSpecific);
        console.log("System prompt:", systemPrompt);

        const userPrompt = `Generate tags for the following text from: note "${displayText}"${headingText ? ` > section "${headingText}"` : ''}`;
        console.log("User prompt:", userPrompt);

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            { role: "user", content: text }
        ]

        const tags = await this.llm.tagGeneration(
            this.plugin.settings.model,
            this.plugin.settings.token,
            messages,
            this.plugin.settings.endpoint
        );

        return tags;
    }
}