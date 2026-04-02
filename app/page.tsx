"use client";

import { useState } from "react";
import CVUploader from "@/components/CVUploader";
import JobOfferInput from "@/components/JobOfferInput";
import GeneratedCV from "@/components/GeneratedCV";
import { Sparkles, Zap, Shield, ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const [cvText, setCvText] = useState("");
  const [jobText, setJobText] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = cvText.length > 50 && jobText.length > 30 && !isStreaming;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsStreaming(true);
    setGeneratedContent("");
    setError(null);

    try {
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, jobText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming non supporté");

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setGeneratedContent((prev) => prev + chunk);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    setCvText("");
    setJobText("");
    setGeneratedContent("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">CV Adapter</h1>
              <p className="text-xs text-gray-400 leading-tight">Powered by Claude Opus</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-500" /> Ultra-rapide</span>
            <span className="flex items-center gap-1"><Shield size={12} className="text-green-500" /> Données non stockées</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Sparkles size={12} />
            Optimisé par l&apos;IA Claude Opus 4.6
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Adaptez votre CV à chaque offre
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Importez votre CV et une offre d&apos;emploi. Notre IA réécrit votre CV pour maximiser vos chances de décrocher le poste.
          </p>
        </div>

        {/* Input section */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* CV Upload */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-6">
            <CVUploader
              onTextExtracted={setCvText}
              disabled={isStreaming}
            />
            {cvText && (
              <div className="mt-3 p-2.5 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  ✓ {cvText.split(/\s+/).length.toLocaleString()} mots extraits
                </p>
              </div>
            )}
          </div>

          {/* Job Offer */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-6">
            <JobOfferInput
              onJobTextReady={setJobText}
              disabled={isStreaming}
            />
            {jobText && (
              <div className="mt-3 p-2.5 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  ✓ {jobText.split(/\s+/).length.toLocaleString()} mots récupérés
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`
              group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg
              ${canGenerate
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }
            `}
          >
            {isStreaming ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Générer mon CV adapté
                <ArrowRight size={18} className={`transition-transform ${canGenerate ? "group-hover:translate-x-1" : ""}`} />
              </>
            )}
          </button>

          {!cvText && !jobText && (
            <p className="text-xs text-gray-400">
              Uploadez votre CV et ajoutez une offre d&apos;emploi pour commencer
            </p>
          )}
          {cvText && !jobText && (
            <p className="text-xs text-gray-400">
              Ajoutez maintenant l&apos;offre d&apos;emploi
            </p>
          )}
          {!cvText && jobText && (
            <p className="text-xs text-gray-400">
              Uploadez votre CV pour continuer
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <strong>Erreur :</strong> {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Fermer</button>
          </div>
        )}

        {/* Generated CV */}
        {(generatedContent || isStreaming) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-6">
            <GeneratedCV content={generatedContent} isStreaming={isStreaming} />
          </div>
        )}

        {/* Reset */}
        {generatedContent && !isStreaming && (
          <div className="text-center">
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Recommencer avec un nouveau CV
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400">
          Vos données ne sont pas stockées · Propulsé par{" "}
          <span className="font-medium text-gray-500">Anthropic Claude</span>
        </p>
      </footer>
    </div>
  );
}
