import { Pinecone } from "@pinecone-database/pinecone";


let client: any;

export async function initPinecone() {
    if (!client) {
        client = new Pinecone();
        await client.init({
            apiKey: process.env.PINECONE_API_KEY!,
            environment: process.env.PINECONE_ENVIRONMENT!,
        });
    }
    return client;
}

export async function getIndex() {
    const pinecone = await initPinecone();
    return pinecone.Index(process.env.PINECONE_INDEX_NAME!);
}

export async function deleteByUrl(url: string) {
    const index = await getIndex();
    await index.delete1({ deleteAll: false, filter: { url } });
}