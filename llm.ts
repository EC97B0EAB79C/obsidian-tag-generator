import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { GoogleGenAI, Type } from "@google/genai";
import { ApiKeys, Endpoint } from "settings";


export class LLMGeneration {
    // --- Tag Generation Methods ----------------------------------------------------------------
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

    async tagGenerationOpenAI(
        model: string,
        apiKey: string,
        messages: ChatCompletionMessageParam[],
        endpoint?: string
    ) {
        try {
            console.log("Generating completion with OpenAI:", model, endpoint);
            const client = new OpenAI({
                baseURL: endpoint,
                apiKey: apiKey,
                dangerouslyAllowBrowser: true
            });
            console.log("Client created:", client);

            const response = await client.chat.completions.create({
                messages: messages,
                temperature: 1.0,
                top_p: 1.0,
                model: model,
                response_format: { type: "json_object" },
            });
            console.log("Response received:", response);

            return response.choices[0].message.content;
        } catch (error) {
            console.error("Error generating tag:", error);
            return;
        }
    }

    async tagGenerationGemini(
        model: string,
        apiKey: string,
        systemPrompt: string,
        userContent: string,
    ) {
        try {
            console.log("Generating completion with Gemini:", model);
            const genAI = new GoogleGenAI({ apiKey: apiKey });
            console.log("Client created:", genAI);

            const response = await genAI.models.generateContent({
                model: model,
                contents: userContent,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
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
                    },
                    systemInstruction: systemPrompt,
                }
            });
            console.log("Response received:", response);

            return response.text;
        } catch (error) {
            console.error("Error generating tag:", error);
            return "[]";
        }
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

        const body = {
            model: model,
            messages: messages,
            response_format: {
                type: 'json_schema',
                json_schema: {
                    schema: responseSchema
                }
            }
        };
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        };

        try {
            console.log("Generating tag with Perplexity:", model);
            const response = await fetch('https://api.perplexity.ai/chat/completions', options);
            console.log("Response received:", response);

            const data = await response.json();
            const content = data.choices[0].message.content;
            return content;
        } catch (err) {
            console.error(err);
            return;
        }
    }


    // --- Citation Methods ----------------------------------------------------------------
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
        return response;
    }

    async citationOpenAI(
        model: string,
        apiKey: string,
        messages: ChatCompletionMessageParam[],
        endpoint?: string
    ) {
        try {
            console.log("Generating citation with OpenAI:", model, endpoint);
            const client = new OpenAI({
                baseURL: endpoint,
                apiKey: apiKey,
                dangerouslyAllowBrowser: true
            });
            console.log("Client created:", client);

            const response = await client.chat.completions.create({
                messages: messages,
                temperature: 1.0,
                top_p: 1.0,
                model: model,
                response_format: { type: "json_object" },
            });
            console.log("Response received:", response);

            const data = response.choices[0].message.content;
            if (!data) {
                throw new Error("No content in response");
            }
            console.log("Data received:", data);
            const sources = JSON.parse(data).sources || [];
            return sources || [];
        }
        catch (error) {
            console.error("Error generating citation:", error);
            return [];
        }
    }

    async citationGemini(
        model: string,
        apiKey: string,
        systemPrompt: string,
        userContent: string,
    ) {
        try {
            console.log("Generating citation with Gemini:", model);
            const genAI = new GoogleGenAI({ apiKey: apiKey });
            console.log("Client created:", genAI);

            const response = await genAI.models.generateContent({
                model: model,
                contents: userContent,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
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
                    },
                    systemInstruction: systemPrompt,
                }
            });
            console.log("Response received:", response);
            if (!response.text) {
                throw new Error("No text in response");
            }

            return JSON.parse(response.text).sources || [];
        } catch (error) {
            console.error("Error generating citation:", error);
            return [];
        }
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

        const body = {
            model: model,
            messages: messages,
            response_format: {
                type: 'json_schema',
                json_schema: {
                    schema: responseSchema
                }
            }
        };
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        };

        try {
            console.log("Generating citation with Perplexity:", model);
            const response = await fetch('https://api.perplexity.ai/chat/completions', options);
            console.log("Response received:", response);

            const data = await response.json();
            const sources = JSON.parse(data.choices[0].message.content).sources || [];
            console.log("Data received:", sources);
            return sources || [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}