"use client";

import { useState } from "react";
import { Link, FileText, Loader2, CheckCircle, X } from "lucide-react";

type Mode = "url" | "text";

interface JobOfferInputProps {
  onJobTextReady: (text: string) => void;
  disabled?: boolean;
}

export default function JobOfferInput({ onJobTextReady, disabled }: JobOfferInputProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/scrape-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      onJobTextReady(data.text);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erreur lors de la récupération");
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    onJobTextReady(value);
    if (value.trim().length > 30) {
      setStatus("success");
    } else {
      setStatus("idle");
    }
  };

  const reset = () => {
    setUrl("");
    setText("");
    setStatus("idle");
    setError(null);
    onJobTextReady("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Offre d'emploi
      </label>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => { setMode("url"); reset(); }}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === "url"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Link size={14} />
          Via URL
        </button>
        <button
          onClick={() => { setMode("text"); reset(); }}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === "text"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText size={14} />
          Texte libre
        </button>
      </div>

      {/* URL mode */}
      {mode === "url" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setStatus("idle"); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleUrlFetch()}
              placeholder="https://www.linkedin.com/jobs/view/..."
              disabled={disabled || status === "loading"}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleUrlFetch}
              disabled={disabled || status === "loading" || !url.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {status === "loading" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Récupérer"
              )}
            </button>
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-500 shrink-0" size={16} />
              <span className="text-sm text-green-700">Offre récupérée avec succès</span>
              <button onClick={reset} className="ml-auto text-green-500 hover:text-green-700">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text mode */}
      {mode === "text" && (
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Collez ici le texte complet de l'offre d'emploi…&#10;&#10;Ex : Nous recherchons un développeur Full Stack…"
            disabled={disabled}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">{text.length} caractères</span>
            {text && (
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X size={12} /> Effacer
              </button>
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
    </div>
  );
}
