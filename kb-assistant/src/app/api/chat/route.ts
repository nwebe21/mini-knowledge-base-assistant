import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";
import { embedText } from "@/lib/openai";
import { getIndex } from "@/lib/pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { question, sessionId, userId } = await req.json();

        if (!question || !sessionId || !userId) {
            return NextResponse.json({ error: "question, sessionId and userId required" }, { status: 400 });
        }

        let currentSessionId = sessionId;

        // Fetch conversation history
        const { data: history } = await supabase
            .from("chat_messages")
            .select("content, role")
            .eq("session_id", currentSessionId)
            .order("created_at", { ascending: true });

        let context: string = '';
        let sources: Array<any> = [];

        if (!isPureGreeting(question)) {
            // RAG vector search
            const embeddings = await embedText([question]);
            const index = getIndex();
            const query = await index.query({
                vector: embeddings[0],
                topK: 5,
                includeMetadata: true,
            });
            context = query.matches
                ?.map((m, i) => `Source ${i + 1}: ${m.metadata?.text}`)
                .join("\n\n") || "";
            sources = Array.from(new Set(query.matches?.map(match => match.metadata?.source_url).filter(Boolean)));
            console.log('###########', query)
        }

        // Prepare prompt for AI using sources.label to determine role
        const messagesForPrompt = [
            {
                role: "system",
                content: "You are a helpful travel assistant. Strictly cite sources from the RAG context only. If unknown, say: 'I checked the available sources in the knowledge base, but none of them contain information that directly answers your question.' However, if its just a greetings"
            },

            ...(history || []).map(h => ({
                role: h.role,
                content: h.content
            })),

            {
                role: "user",
                content: `${question}\n\nRAG Sources:\n${context}`
            }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messagesForPrompt,
        });
        console.log('completion', completion);

        const answer = completion.choices[0].message.content;
        console.log('answer', answer);
        console.log('question', question);
        console.log('user_id', userId);
        console.log('sources', sources);
        console.log('session_id', currentSessionId);
        // Store both user and assistant messages (table has only session_id, content, sources)
        const { error: insertError } = await supabase.from("chat_messages").insert([
            {
                session_id: currentSessionId,
                user_id: userId,
                content: question,
                role: 'user'
            },
            {
                session_id: currentSessionId,
                user_id: userId,
                content: answer,
                role: 'assistant',
                sources: sources
            }
        ]);

        if (insertError) throw insertError;

        // Fetch all messages for this session, including recently inserted ones
        const { data: message } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("session_id", currentSessionId)
            .eq("role", "assistant")
            .order("created_at", { ascending: false })
            .limit(1);
        return NextResponse.json({
            message: message?.length ? message[0] : []
        });
    } catch (err: any) {
        console.error("Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET: fetch all messages for a given session
export async function GET(req: NextRequest) {
    try {
        const sessionId = req.nextUrl.searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId required" }, { status: 400 });
        }

        const { data: messages, error } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true })
            .limit(50);
        if (error) throw error;

        return NextResponse.json({ messages });
    } catch (err: any) {
        console.error("GET /api/chat Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function isPureGreeting(text: string) {
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", 'how are you'];

    // Lowercase, trim, and remove punctuation
    const cleaned = text.toLowerCase().trim().replace(/[.,!?]/g, "");

    // Check if it exactly matches a greeting
    return greetings.includes(cleaned);
}
