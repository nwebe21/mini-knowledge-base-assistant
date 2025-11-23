import { NextRequest, NextResponse } from "next/server";
import { embedText, callCompletion } from "@/lib/openai";
import { getIndex } from "@/lib/pinecone";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
    const { question, userId } = await req.json();

    if (!question || !userId) {
        return NextResponse.json(
        { error: "Both question and userId are required." },
        { status: 400 }
        );
    }

    // 1️⃣ Create embedding (1536 dimensions)
    const embeddings = await embedText([question]);
    const qEmbedding = embeddings[0]; // number[]

    // 2️⃣ Pinecone similarity search
    const index = getIndex();
    const queryResp = await index.query({
        vector: qEmbedding,
        topK: 5,
        includeMetadata: true,
    });

    const matches = (queryResp.matches || []).map((m) => m.metadata || {});
    let context = "";
    const citations: { url: string; label: string }[] = [];

    matches.forEach((m:any, i:any) => {
        context += `Source ${i + 1} (${m.label} - ${m.url}):\n${m.text}\n\n`;
        if (m.url && m.label) {
            citations.push({ url: m.url, label: m.label });
        }
    });

    // 3️⃣ Build RAG message for OpenAI
    const messages: any[] = [
        {
            role: "system",
            content:
                "You are a helpful travel assistant. Answer strictly from the provided sources. If unknown, say: 'I don't know based on the provided sources.'",
        },
        {
            role: "user",
            content: `Question: ${question}\n\nSources:\n${context}\n\nAnswer concisely and cite sources if relevant.`,
        },
    ];

    // 4️⃣ Call OpenAI (chat completion)
    const answer = await callCompletion({ messages });

    // 5️⃣ Save chat to Supabase
    await supabase.from("chat_history").insert([
        {
            user_id: userId,
            question,
            answer,
            citations,
        },
    ]);

    return NextResponse.json({
        answer,
        citations,
        sources: matches,
    });
    } catch (err: any) {
        console.error("CHAT ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}