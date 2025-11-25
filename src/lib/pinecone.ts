import { Pinecone } from "@pinecone-database/pinecone";

let client: Pinecone;

export function initPinecone() {
    if (!client) {
    client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
    });
    }
    return client;
    }

    export function getIndex() {
    const pinecone = initPinecone();
    return pinecone.index(process.env.PINECONE_INDEX_NAME!);
    }

    export async function deleteByUrl(url: string) {
    const index = getIndex();
    await index.deleteMany({
    filter: { url: url },
    });
}
