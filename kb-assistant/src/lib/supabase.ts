import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export { supabase };

export async function saveChat(
    question: string,
    answer: string,
    citations: { url: string; label: string }[] = []
) {
    const { data, error } = await supabase
    .from("chat_history")
    .insert([{ question, answer, citations }]);
    if (error) throw error;
    return data;
    }

    export async function getLastChats(limit = 50) {
    const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
    if (error) throw error;
    return data;
}