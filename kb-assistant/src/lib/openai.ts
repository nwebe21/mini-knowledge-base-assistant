import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedText(texts: string[]): Promise<number[][]> {
    const resp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
    });
    return resp.data.map((d) => d.embedding);
    }

    export async function callCompletion({
    messages,
    }: {
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    }): Promise<string> {
    const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.0,
    max_tokens: 800,
    });
    return resp.choices[0].message?.content ?? "";
}