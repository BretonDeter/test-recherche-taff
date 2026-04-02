import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Le fichier doit être un PDF" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier ne doit pas dépasser 10 Mo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length < 50) {
      return NextResponse.json(
        { error: "Impossible d'extraire le texte du PDF. Vérifiez que le PDF n'est pas une image scannée." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: data.text.trim(), pages: data.numpages });
  } catch (error) {
    console.error("Erreur parse-cv:", error);
    return NextResponse.json({ error: "Erreur lors de la lecture du PDF" }, { status: 500 });
  }
}
