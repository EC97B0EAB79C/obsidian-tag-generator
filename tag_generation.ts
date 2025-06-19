import TagGeneratorPlugin from './main';
import { generationGemini, generationOpenAI, generationPPLX } from './llm';
import { ApiKeys, Endpoint } from 'settings';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ResponseFormatJSONObject } from 'openai/resources/index';
import { Type } from '@google/genai';

const prompt = (nOfTagsCategory: number, nOfTagsGeneral: number, nOfTagsSpecific: number) => `This GPT helps users generate a set of relevant keywords or tags based on the content of any note or text they provide.
It offers concise, descriptive, and relevant tags that help organize and retrieve similar notes or resources later.
The GPT will aim to provide up to ${nOfTagsCategory + nOfTagsGeneral + nOfTagsSpecific} keywords, with ${nOfTagsCategory} keyword acting as a category, ${nOfTagsGeneral} general tags applicable to a broad context, and ${nOfTagsSpecific} being more specific to the content of the note.
It avoids suggesting overly generic or redundant keywords unless necessary.
It will list the tags using underscores instead of spaces, ordered from the most general to the most specific.
Every tag will be lowercase.
Return the list in json format with key "keywords" for keyword list.`;


export class TagGeneration {
    plugin: TagGeneratorPlugin;

    constructor(plugin: TagGeneratorPlugin) {
        this.plugin = plugin;
    }

    async generateTagFromText(text: string, displayText: string, headingText?: string): Promise<string[]> {
        const nOfTagsGeneral = Math.ceil((this.plugin.settings.nOfTags - 1) * this.plugin.settings.ratioOfGeneralSpecific);
        const nOfTagsSpecific = (this.plugin.settings.nOfTags - 1) - nOfTagsGeneral;
        const systemPrompt = prompt(1, nOfTagsGeneral, nOfTagsSpecific);
        console.log("System prompt:", systemPrompt);

        const userPrompt = `Generate tags for the following text from: note "${displayText}"${headingText ? ` > section "${headingText}"` : ''}`;
        console.log("User prompt:", userPrompt);

        const userContent = `${userPrompt}\n\n${text}`;

        const tags = await this.tagGeneration(
            this.plugin.settings.modelTagGeneration,
            this.plugin.settings.token,
            systemPrompt,
            userContent,
            this.plugin.settings.endpoint
        );

        return tags;
    }

    async tagGeneration(
        model: string,
        apiKey: ApiKeys,
        systemPrompt: string,
        userContent: string,
        endpoint: Endpoint
    ): Promise<string[]> {
        const provider = model.split('/')[0];
        let response;
        if (provider === 'openai') {
            const messages: ChatCompletionMessageParam[] = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ];
            response = await this.tagGenerationOpenAI(model, apiKey["openai"], messages, endpoint["openai"]);
        }
        else if (provider === 'gemini') {
            const modelName = model.split('/')[1];
            response = await this.tagGenerationGemini(modelName, apiKey["gemini"], systemPrompt, userContent);
        }
        else if (provider === 'pplx') {
            const modelName = model.split('/')[1];
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ];
            response = await this.tagGenerationPPLX(modelName, apiKey["pplx"], messages);
        }
        else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        if (!response) {
            throw new Error("No response from LLM");
        }
        const json = JSON.parse(response);
        return json.keywords || [];
    }

    // ------- LLM Helper Functions ---------------------------------------------------
    async tagGenerationOpenAI(
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

    async tagGenerationGemini(
        model: string,
        apiKey: string,
        systemPrompt: string,
        userContent: string,
    ) {
        const responseMimeType = "application/json";
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                keywords: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            },
            required: ["keywords"]
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

    async tagGenerationPPLX(
        model: string,
        apiKey: string,
        messages: { role: string, content: string }[],
    ) {
        const responseSchema = {
            type: "object",
            properties: {
                keywords: {
                    type: "array",
                    items: {
                        type: "string"
                    }
                }
            },
            required: ["keywords"]
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

        return content;
    }
}