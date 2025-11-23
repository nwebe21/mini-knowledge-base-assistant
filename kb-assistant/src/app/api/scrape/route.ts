import { fetchAndExtractText } from "@/lib/scraper";
import { chunkTextByChars } from "@/lib/chunker";
import { embedText } from "@/lib/openai";
import { getIndex, deleteByUrl } from "@/lib/pinecone";
import crypto from "crypto";

const TARGETS = [
    { url: "https://www.shermanstravel.com/cruise-destinations/alaska-itineraries", label: "Alaska" },
    { url: "https://www.shermanstravel.com/cruise-destinations/caribbean-and-bahamas", label: "Caribbean & Bahamas" },
    { url: "https://www.shermanstravel.com/cruise-destinations/hawaiian-islands", label: "Hawaiian Islands" },
    { url: "https://www.shermanstravel.com/cruise-destinations/northern-europe", label: "Northern Europe" },
];

export async function POST() {
    try {
    const index = getIndex();
    const upserts: any[] = [];

    for (const t of TARGETS) {
        const text = await fetchAndExtractText(t.url);
        const chunks = chunkTextByChars(text, 1500);

        await deleteByUrl(t.url); // remove old vectors

        const ids = chunks.map((_, i) =>
        crypto.createHash("sha256").update(t.url + "||" + i).digest("hex")
        );
        const embeddings = await embedText(chunks);

        const vectors = embeddings.map((emb, i) => ({
        id: ids[i],
        values: emb,
        metadata: { url: t.url, label: t.label, chunk_index: i, text: chunks[i].slice(0, 1000) },
        }));

        const BATCH = 100;
        for (let i = 0; i < vectors.length; i += BATCH) {
        await index.upsert({ upsertRequest: { vectors: vectors.slice(i, i + BATCH) } });
        }

        upserts.push({ url: t.url, chunks: chunks.length });
    }

    return new Response(JSON.stringify({ ok: true, upserts }), { status: 200 });
    } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
}