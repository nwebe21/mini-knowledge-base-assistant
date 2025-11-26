import { NextResponse } from "next/server";
import { embedText } from "@/lib/openai";
import { getIndex } from "@/lib/pinecone";
import * as cheerio from "cheerio";

const PAGES = [
    {
        url: "https://www.shermanstravel.com/cruise-destinations/alaska-itineraries",
        label: "alaska",
    },
    {
        url: "https://www.shermanstravel.com/cruise-destinations/caribbean-and-bahamas",
        label: "caribbean-and-bahamas",
    },
    {
        url: "https://www.shermanstravel.com/cruise-destinations/hawaiian-islands",
        label: "hawaii",
    },
    {
        url: "https://www.shermanstravel.com/cruise-destinations/northern-europe",
        label: "northern-europe",
    },
];

// Simple chunking helper
function chunk(text: string, size = 400) {
    const words = text.split(" ");
    const chunks = [];
    for (let i = 0; i < words.length; i += size) {
        chunks.push(words.slice(i, i + size).join(" "));
    }
    return chunks;
}

export async function POST() {
    try {
        const index = getIndex();
        const vectors: any[] = [];

        for (const page of PAGES) {
            // Fetch the page
            const html = await fetch(page.url).then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch ${page.url}: ${res.status}`);
                return res.text();
            });

            const $ = cheerio.load(html);

            // Extract text using multiple selectors for robustness
            const text = $("main, article, .content").text().replace(/\s+/g, " ").trim();

            if (!text) {
                console.warn(`No text found for ${page.url}, skipping.`);
                continue;
            }

            // Chunk the text
            const rawChunks = chunk(text);
            const chunks = rawChunks.filter((c) => c.trim().length > 0);
            console.log(`Chunks found for ${page.url}:`, chunks.length);

            if (chunks.length === 0) {
                console.warn(`No valid chunks for ${page.url}, skipping.`);
                continue;
            }

            // Embed chunks
            const embeddings = await embedText(chunks);

            // Build Pinecone vectors
            chunks.forEach((ch, i) => {
            vectors.push({
                id: `${page.label}-${i}`,
                values: embeddings[i],
                metadata: {
                text: ch,
                source_url: page.url,
                },
            });
            });
        }

        // Check if there are vectors before upserting
        if (vectors.length === 0) {
            console.error("No vectors to upsert. Scraping failed or pages returned empty content.");
            return NextResponse.json(
                { error: "No vectors to upsert. Check scraping logic." },
                { status: 500 }
            );
        }

        // Insert into Pinecone
        await index.upsert(vectors);

        return NextResponse.json({ inserted: vectors.length });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}