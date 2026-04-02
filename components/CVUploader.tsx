"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

interface CVUploaderProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export default function CVUploader({ onTextExtracted, disabled }: CVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        setError("Veuillez uploader un fichier PDF");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("Le fichier ne doit pas dépasser 10 Mo");
        return;
      }

      setFile(f);
      setStatus("loading");
      setError(null);

      const formData = new FormData();
      formData.append("file", f);

      try {
        const res = await fetch("/api/parse-cv", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur inconnue");
        }

        onTextExtracted(data.text);
        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Erreur lors de la lecture du PDF");
      }
    },
    [onTextExtracted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setError(null);
    onTextExtracted("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Votre CV (PDF)
      </label>

      {status === "success" && file ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="text-green-500 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700 truncate">{file.name}</p>
            <p className="text-xs text-green-600">CV analysé avec succès</p>
          </div>
          <button
            onClick={reset}
            className="text-green-500 hover:text-green-700 transition-colors"
            aria-label="Supprimer le fichier"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={() => !disabled && setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            disabled={disabled || status === "loading"}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="flex flex-col items-center gap-3">
            {status === "loading" ? (
              <>
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Extraction du texte en cours…</p>
              </>
            ) : (
              <>
                <div className={`p-3 rounded-full ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}>
                  <Upload className={isDragging ? "text-blue-500" : "text-gray-400"} size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Glissez votre CV ici ou{" "}
                    <span className="text-blue-600 hover:underline">parcourez</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF uniquement · Max 10 Mo</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <X className="text-red-400 shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {status === "idle" && !file && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileText size={14} />
          <span>Formats recommandés : CV créé avec Word, LibreOffice ou un éditeur PDF</span>
        </div>
      )}
    </div>
  );
}
