import TagGeneratorPlugin from './main';
import { LLMGeneration } from './llm';

const prompt = `Please act as a research assistant. I will provide you with the title and content of a note I have written. Your task is to identify and list relevant sources and citations that support, elaborate on, or are closely related to the topics discussed in my note.

Prioritize sources such as:
* Academic papers and journals
* Reputable news articles and investigative reports
* Published books and research monographs
* Official reports from established organizations
* Credible .gov or .edu websites

Please output: 
* list of JSON object containing the following fields: title, url
`;

export class CiteGeneration {
    plugin: TagGeneratorPlugin;
    llm: LLMGeneration;

    constructor(plugin: TagGeneratorPlugin) {
        this.plugin = plugin;
        this.llm = new LLMGeneration();
    }

    async generateCiteFromText(text: string, displayText: string, headingText?: string): Promise<object[]> {
        const systemPrompt = prompt;
        console.log("System prompt:", systemPrompt);

        const userPrompt = `Search citations for the following text from: note '${displayText}'${headingText ? ` > section '${headingText}'` : ''}`;
        console.log("User prompt:", userPrompt);

        const messages = [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": `${userPrompt}\n\n${text}` }
        ]

        const cites = await this.llm.citationPPLX(
            this.plugin.settings.pplxModel,
            this.plugin.settings.pplxToken,
            messages
        );

        return cites;
    }
}