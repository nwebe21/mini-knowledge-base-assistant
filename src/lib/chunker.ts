export function chunkTextByChars(text: string, maxChars = 1500): string[] {
    const parts = text.split(/\n{1,}/).map((s) => s.trim()).filter(Boolean);
    const chunks: string[] = [];
    let cur = "";

    for (const p of parts) {
    if ((cur + "\n\n" + p).length > maxChars) {
        if (cur) chunks.push(cur.trim());
        cur = p;
    } else {
        cur = cur ? cur + "\n\n" + p : p;
    }
    }

    if (cur) chunks.push(cur.trim());
    return chunks;
}
