import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Seuls les protocoles HTTP et HTTPS sont autorisés" }, { status: 400 });
    }

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CVMatcher/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      maxRedirects: 5,
      maxContentLength: 5 * 1024 * 1024,
    });

    const $ = cheerio.load(response.data);

    // Remove noise elements
    $("script, style, nav, header, footer, aside, [role='navigation'], .nav, .menu, .header, .footer, .sidebar, .ads, .advertisement").remove();

    // Try to find the main job content
    const selectors = [
      "main",
      "article",
      '[class*="job"]',
      '[class*="offer"]',
      '[class*="description"]',
      '[class*="posting"]',
      ".content",
      "#content",
      "body",
    ];

    let text = "";
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length) {
        text = el.text().replace(/\s+/g, " ").trim();
        if (text.length > 200) break;
      }
    }

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Impossible d'extraire le contenu de cette page. Essayez de coller le texte directement." },
        { status: 422 }
      );
    }

    // Limit to 8000 chars to avoid huge context
    return NextResponse.json({ text: text.slice(0, 8000) });
  } catch (error: unknown) {
    console.error("Erreur scrape-job:", error);
    const axiosError = error as { response?: { status: number }; code?: string };
    if (axiosError?.response?.status === 403) {
      return NextResponse.json(
        { error: "Accès refusé par le site. Copiez-collez le texte de l'offre directement." },
        { status: 422 }
      );
    }
    if (axiosError?.code === "ECONNREFUSED" || axiosError?.code === "ENOTFOUND") {
      return NextResponse.json({ error: "Impossible d'accéder à cette URL" }, { status: 422 });
    }
    return NextResponse.json({ error: "Erreur lors de la récupération de l'URL" }, { status: 500 });
  }
}
