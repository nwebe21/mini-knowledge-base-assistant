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
        let messagesForPrompt: Array<any> = [];

        if (!isGreeting) {
            const embeddings = await embedText([question]);
            const index = getIndex();
            // Why topK = 5?
            // - Balance: Too few (1-2) = might miss relevant info
            //            Too many (10+) = noise, token waste, lower relevance
            // - 5 chunks × ~400 words = ~2000 words of context (manageable)
            // - Common RAG default, good for most queries
            // Consider: Make configurable (3-7) based on query complexity
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

            messagesForPrompt = [
                {
                    role: "system",
                    content:
                        "You are a helpful travel assistant. Strictly cite sources from the RAG context only. If unknown, say: 'I checked the available sources in the knowledge base, but none of them contain information that directly answers your question'.",
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
        } else {
            messagesForPrompt = [
                {
                    role: 'system',
                    content: "Its a greetings, respond with a greetings and ask how can you help."
                }
            ]
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messagesForPrompt,
        });

        answer = completion.choices[0].message.content;

        const noAnswerFlag = answer?.includes('none of them contain information that directly answers your question');
        const sanitizedAnswer = answer ? removeInlineSources(answer) : answer;

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
                content: sanitizedAnswer,
                role: 'assistant',
                sources: noAnswerFlag || isGreeting ? [] : sources
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
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", 'how are you', "good day"];

    // Lowercase, trim, and remove punctuation
    const cleaned = text.toLowerCase().trim().replace(/[.,!?]/g, "");

    // Check if it exactly matches a greeting
    return greetings.includes(cleaned);
}

function removeInlineSources(text: string) {
    return text.replace(/\s*\(Source\s*\d+\)/gi, "");
}
