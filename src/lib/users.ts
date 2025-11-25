import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function registerUser(username: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
    .from("users")
    .insert([{ username, password: hashed }])
    .select();
    if (error) throw error;
    return data[0];
    }

    export async function loginUser(username: string, password: string) {
    const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
    if (error) throw error;

    const valid = await bcrypt.compare(password, data.password);
    if (!valid) throw new Error("Invalid credentials");
    return data; // return user object (id, username)
}