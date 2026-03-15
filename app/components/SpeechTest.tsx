"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => RecognitionLike;
    SpeechRecognition?: new () => RecognitionLike;
  }
}

export default function SpeechTest() {
  const recognitionRef = useRef<RecognitionLike | null>(null);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const RecognitionCtor = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  const supported = Boolean(RecognitionCtor);

  useEffect(() => {
    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      setError(event?.error ?? "Speech recognition error");
      setListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        setTranscript((prev) =>
          prev ? `${prev.trim()} ${finalText.trim()}` : finalText.trim(),
        );
      }
      setInterim(interimText.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
    };
  }, [RecognitionCtor]);

  const handleStart = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleStop = () => {
    recognitionRef.current?.stop();
  };

  const handleClear = () => {
    setTranscript("");
    setInterim("");
  };

  if (!supported) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
        Web Speech API is not supported in this browser.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          onClick={handleStart}
          disabled={listening}
          type="button"
        >
          Start
        </button>
        <button
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition-all hover:bg-white/5 disabled:opacity-50"
          onClick={handleStop}
          disabled={!listening}
          type="button"
        >
          Stop
        </button>
        <button
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition-all hover:bg-white/5"
          onClick={handleClear}
          type="button"
        >
          Clear
        </button>
        <span className="text-xs text-slate-500">
          Status: {listening ? "Listening…" : "Idle"}
        </span>
      </div>

      {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : null}

      <div className="mt-6 space-y-2 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">
          Transcript
        </p>
        <p className="min-h-[48px] rounded-lg border border-white/10 bg-black/20 p-3">
          {transcript || "Say something to see the transcript here."}
        </p>
        {interim ? (
          <p className="text-xs text-slate-500">Interim: {interim}</p>
        ) : null}
      </div>
    </div>
  );
}
