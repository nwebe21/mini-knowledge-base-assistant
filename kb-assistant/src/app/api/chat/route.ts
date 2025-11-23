import { NextRequest, NextResponse } from "next/server";
import { embedText, callCompletion, ChatMessage } from "@/lib/openai";
import { getIndex } from "@/lib/pinecone";
import { saveChat } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
    const body = await req.json();
    const question: string = body.question;
    if (!question) {
        return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Embed the question (flatten to 1D array)
    const embeddingArr = await embedText([question]); // returns number[][]
    const qEmbedding = embeddingArr[0]; // number[]

    // Query Pinecone for top 5 relevant chunks
    const index = await getIndex();
    const queryResp = index.query({
        queryRequest: {
        vector: qEmbedding,
        topK: 5,
        includeMetadata: true,
        },
    });

    const matches = (queryResp.matches || []).map((m: any) => m.metadata || {});

    // Build context string for RAG
    let context = "";
    const citations: { url: string; label: string }[] = [];
    matches.forEach((m:any, i:any) => {
        context += `Document ${i + 1} (source: ${m.label || m.url} - ${m.url || "n/a"}):\n${m.text || ""}\n\n---\n`;
        if (m.url && m.label) {
        citations.push({ url: m.url, label: m.label });
        }
    });

    // Build prompt for the model
    const systemMessage: ChatMessage = {
        role: "system",
        content:
        "You are a helpful travel assistant. Answer strictly using the documents provided. If the answer is not in the documents, say 'I don't know based on the provided sources.' Provide inline citations.",
    };

    const userMessage: ChatMessage = {
        role: "user",
        content: `Question: ${question}\n\nDocuments:\n${context}\n\nAnswer concisely:`,
    };

    const answer = await callCompletion({ messages: [systemMessage, userMessage] });

    // Persist to Supabase
    await saveChat(question, answer, citations);

    return NextResponse.json({ answer, citations, matches });
    } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}