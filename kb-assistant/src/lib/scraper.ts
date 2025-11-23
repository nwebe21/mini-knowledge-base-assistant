import * as cheerio from "cheerio";

export async function fetchAndExtractText(url: string): Promise<string> {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract article content
    const article = $("article, .post, .entry-content, .main-content").first();
    let text = "";
    if (article.length) {
    article.find("h1,h2,h3,p,li").each((i: any, el: any) => {
        const t = $(el).text().trim();
        if (t) text += t + "\n\n";
    });
    } else {
    $("p").each((i: any, el: any) => {
        const t = $(el).text().trim();
        if (t) text += t + "\n\n";
    });
    }

    return text.replace(/\s{2,}/g, " ").trim();
}
