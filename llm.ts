import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { GoogleGenAI } from "@google/genai";
import { ResponseFormatJSONObject, ResponseFormatJSONSchema, ResponseFormatText } from "openai/resources/index";

export async function generationOpenAI(
    model: string,
    apiKey: string,
    messages: ChatCompletionMessageParam[],
    endpoint?: string,
    responseFormat?: ResponseFormatText | ResponseFormatJSONSchema | ResponseFormatJSONObject | undefined
) {
    try {
        console.log("Generating with OpenAI:", model, endpoint);
        const client = new OpenAI({
            baseURL: endpoint,
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
        console.log("> Client created:", client);

        const response = await client.chat.completions.create({
            messages: messages,
            temperature: 1.0,
            top_p: 1.0,
            model: model,
            response_format: responseFormat,
        });
        console.log("> Response received:", response);

        if (!response || !response.choices || response.choices.length === 0) {
            console.error("No choices in response");
            return;
        }
        if (!response.choices[0].message || !response.choices[0].message.content) {
            console.error("No content in response message");
            return;
        }

        return response.choices[0].message.content;
    } catch (error) {
        console.error("> Error generating:", error);
        return;
    }
}

export async function generationGemini(
    model: string,
    apiKey: string,
    systemPrompt: string,
    userContent: string,
    responseMimeType?: string,
    responseSchema?: any
) {
    try {
        console.log("Generating with Gemini:", model);
        const genAI = new GoogleGenAI({ apiKey: apiKey });
        console.log("> Client created:", genAI);

        const response = await genAI.models.generateContent({
            model: model,
            contents: userContent,
            config: {
                responseMimeType: responseMimeType,
                responseSchema: responseSchema,
                systemInstruction: systemPrompt,
            }
        });
        console.log("> Response received:", response);

        if (!response || !response.text) {
            console.error("No text in response");
            return;
        }

        return response.text;
    } catch (error) {
        console.error("> Error generating:", error);
        return;
    }
}

export async function generationPPLX(
    model: string,
    apiKey: string,
    messages: { role: string, content: string }[],
    responseFormat?: any
) {
    try {
        console.log("Generating with Perplexity:", model);
        const body = {
            model: model,
            messages: messages,
            response_format: responseFormat
        };
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        };

        const response = await fetch('https://api.perplexity.ai/chat/completions', options);
        console.log("> Response received:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.choices || data.choices.length === 0) {
            console.error("No choices in response");
            return;
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error("> Error generating:", error);
        return;
    }
}