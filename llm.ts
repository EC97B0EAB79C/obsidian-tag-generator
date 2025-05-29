import OpenAI from "openai";

export class LLMGeneration {
    async completion(
        model: string,
        apiKey: string,
        messages: { role: string, content: string }[],
        endpoint?: string
    ): Promise<string[]> {
        const provider = model.split('/')[0];
        let response;
        if (provider === 'openai') {
            response = await this.completionOpenAI(model, apiKey, messages, endpoint);
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


    async completionOpenAI(
        model: string,
        apiKey: string,
        messages: { role: string, content: string }[],
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

    async completionPPLX(
        model: string,
        apiKey: string,
        messages: { role: string, content: string }[],
    ) {
        const options = {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: `{"model":"${model}","messages":${JSON.stringify(messages)}}`
        };

        try {
            console.log("Generating citation with Perplexity:", model);
            const response = await fetch('https://api.perplexity.ai/chat/completions', options);
            console.log("Response received:", response);

            const data = await response.json();
            return data.citations || [];
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}