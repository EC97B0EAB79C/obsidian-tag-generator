import OpenAI from "openai";

export class LLMGeneration {
    async completionOpenAI(
        model: string,
        apiKey: string,
        messages: { role: string, content: string }[],
        endpoint?: string
    ): Promise<string[]> {
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

            const jsonResponse = response.choices[0].message.content;
            const json = JSON.parse(jsonResponse);

            return json.keywords;
        } catch (error) {
            console.error("Error generating tag:", error);
            return [];
        }
    }
}