import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getUserFromRequest } from "../auth/callback/route";
import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/pinecone";
import { embedText } from "@/lib/openai";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { question, sessionId } = await req.json();
        const supabase = await createServerSupabaseClient();
        const user = await getUserFromRequest(req, supabase);
        if (!question || !sessionId)
            return NextResponse.json({ error: "question and sessionId required" }, { status: 400 });

        if (!user)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let currentSessionId = sessionId;

        const { data: history } = await supabase
            .from("chat_messages")
            .select("content, role")
            .eq("session_id", currentSessionId)
            .order("created_at", { ascending: true });

        const isGreeting = isPureGreeting(question);

        let context = "";
        let sources: Array<any> = [];
        let answer: string | null = null;

        if (isGreeting) {
            answer = getGreetingResponse(question);
        } else {
            const embeddings = await embedText([question]);
            const index = getIndex();
            const query = await index.query({
                vector: embeddings[0],
                topK: 5,
                includeMetadata: true,
            });
            context =
                query.matches
                    ?.map((m, i) => `Source ${i + 1}: ${m.metadata?.text}`)
                    .join("\n\n") || "";
            sources = Array.from(
                new Set(query.matches?.map((match) => match.metadata?.source_url).filter(Boolean))
            );

            const messagesForPrompt = [
                {
                    role: "system",
                    content:
                        "You are a helpful travel assistant. Strictly cite sources from the RAG context only. If unknown, say: 'I checked the available sources in the knowledge base, but none of them contain information that directly answers your question. If its a greeting, respond with a greetings and ask how you can help.'",
                },

                ...(history || []).map((h) => ({
                    role: h.role,
                    content: h.content,
                })),

                {
                    role: "user",
                    content: `${question}\n\nRAG Sources:\n${context}`,
                },
            ];

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messagesForPrompt,
            });

            answer = completion.choices[0].message.content;
        }

        const noAnswerFlag = answer?.includes('none of them contain information that directly answers your question');

        // Store both user and assistant messages (table has only session_id, content, sources)
        const { error: insertError } = await supabase.from("chat_messages").insert([
            {
                session_id: currentSessionId,
                user_id: user.id,
                content: question,
                role: 'user'
            },
            {
                session_id: currentSessionId,
                user_id: user.id,
                content: answer,
                role: 'assistant',
                sources: noAnswerFlag ? [] : sources
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
        const supabase = await createServerSupabaseClient();
        const user = await getUserFromRequest(req, supabase);

        const searchParams = req.nextUrl.searchParams;
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId required" }, { status: 400 });
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

function getGreetingResponse(question: string) {
    const cleaned = question.toLowerCase().trim();
    if (cleaned.includes("morning")) return "Good morning! How can I help plan your travels today?";
    if (cleaned.includes("afternoon")) return "Good afternoon! What destination can I help you explore?";
    if (cleaned.includes("evening")) return "Good evening! Ready to plan your next adventure?";
    return "Hello! How can I help with your travel plans?";
}
