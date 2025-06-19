import TagGeneratorPlugin from './main';
import { generationGemini, generationOpenAI, generationPPLX } from './llm';
import { ApiKeys, Endpoint } from 'settings';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ResponseFormatJSONObject } from 'openai/resources/index';
import { Type } from '@google/genai';

const prompt = `Please act as a research assistant. I will provide you with the title and content of a note I have written. Your task is to identify and list relevant sources and citations that support, elaborate on, or are closely related to the topics discussed in my note.

Prioritize sources such as:
* Academic papers and journals
* Reputable news articles and investigative reports
* Published books and research monographs
* Official reports from established organizations
* Credible .gov or .edu websites

Please output: 
* list of JSON object containing the following fields: title, url
* return the list of sources with key: sources
`;


export class CiteGeneration {
    plugin: TagGeneratorPlugin;

    constructor(plugin: TagGeneratorPlugin) {
        this.plugin = plugin;
    }

    async generateCiteFromText(text: string, displayText: string, headingText?: string): Promise<{ title: string, url: string }[]> {
        const systemPrompt = prompt;
        console.log("System prompt:", systemPrompt);

        const userPrompt = `Search citations for the following text from: note '${displayText}'${headingText ? ` > section '${headingText}'` : ''}`;
        console.log("User prompt:", userPrompt);

        const userContent = `${userPrompt}\n\n${text}`;

        const cites = await this.citation(
            this.plugin.settings.modelCiteGeneration,
            this.plugin.settings.token,
            systemPrompt,
            userContent,
            this.plugin.settings.endpoint
        );

        return cites;
    }

    async citation(
        model: string,
        apiKey: ApiKeys,
        systemPrompt: string,
        userContent: string,
        endpoint: Endpoint
    ) {
        const provider = model.split('/')[0];
        let response;
        if (provider === 'openai') {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ];
            response = await this.citationOpenAI(model, apiKey["openai"], messages, endpoint["openai"] || undefined);
        }
        else if (provider === 'pplx') {
            const modelName = model.split('/')[1];
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ];
            response = await this.citationPPLX(modelName, apiKey["pplx"], messages);
        }
        else if (provider === 'gemini') {
            const modelName = model.split('/')[1];
            response = await this.citationGemini(modelName, apiKey["gemini"], systemPrompt, userContent);
        }
        else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        if (!response) {
            throw new Error("No response from LLM");
        }
        const json = JSON.parse(response);
        return json.sources || [];
    }

    // ------- LLM Helper Functions ---------------------------------------------------
    async citationOpenAI(
        model: string,
        apiKey: string,
        messages: ChatCompletionMessageParam[],
        endpoint?: string
    ) {
        const responseFormat: ResponseFormatJSONObject = { type: "json_object" };
        const content = await generationOpenAI(
            model,
            apiKey,
            messages,
            endpoint,
            responseFormat
        );

        return content;
    }

    async citationGemini(
        model: string,
        apiKey: string,
        systemPrompt: string,
        userContent: string,
    ) {
        const responseMimeType = "application/json";
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                sources: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            url: { type: Type.STRING }
                        },
                        required: ["title", "url"]
                    }
                }
            },
            required: ["sources"]
        };
        const content = await generationGemini(
            model,
            apiKey,
            systemPrompt,
            userContent,
            responseMimeType,
            responseSchema
        );

        return content;
    }

    async citationPPLX(
        model: string,
        apiKey: string,
        messages: { role: string, content: string }[],
    ) {
        const responseSchema = {
            type: "object",
            properties: {
                sources: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" }
                        },
                        required: ["title", "url"]
                    }
                }
            },
            required: ["sources"]
        };
        const responseFormat = {
            type: 'json_schema',
            json_schema: {
                schema: responseSchema
            }
        };
        const content = await generationPPLX(
            model,
            apiKey,
            messages,
            responseFormat
        );

        return content
    }
}