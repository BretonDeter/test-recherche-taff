import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un expert en recrutement et en rédaction de CV. Ta mission est d'analyser un CV existant et une offre d'emploi, puis de rédiger une version optimisée du CV parfaitement adaptée à cette offre.

Instructions :
1. **Analyse** les compétences clés, le vocabulaire et les exigences de l'offre d'emploi
2. **Réorganise et reformule** le contenu du CV pour mettre en valeur les expériences et compétences les plus pertinentes
3. **Intègre les mots-clés** de l'offre dans les descriptions d'expériences (sans mentir)
4. **Adapte l'accroche** ou le profil pour correspondre au poste visé
5. **Conserve toutes les informations vraies** du CV original (ne pas inventer de compétences ou expériences)
6. **Structure le CV** de façon professionnelle et lisible

Format de sortie :
- Utilise du Markdown bien structuré
- Sections claires : Profil, Expériences, Compétences, Formation, etc.
- Mets en valeur les éléments les plus pertinents pour le poste
- Utilise des bullet points concis et orientés résultats
- Adapte le niveau de langue (technique ou non) à l'offre

Réponds directement avec le CV optimisé en Markdown, sans introduction ni conclusion.`;

export async function POST(req: NextRequest) {
  try {
    const { cvText, jobText } = await req.json();

    if (!cvText || typeof cvText !== "string" || cvText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Texte du CV invalide ou trop court" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!jobText || typeof jobText !== "string" || jobText.trim().length < 30) {
      return new Response(JSON.stringify({ error: "Texte de l'offre invalide ou trop court" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMessage = `## CV Original\n\n${cvText.slice(0, 12000)}\n\n---\n\n## Offre d'Emploi\n\n${jobText.slice(0, 6000)}`;

    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      thinking: { type: "adaptive" },
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Erreur generate-cv:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la génération du CV" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
