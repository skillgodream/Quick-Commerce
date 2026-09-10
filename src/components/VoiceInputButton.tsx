import React, { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  isProcessing = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Graceful fallback: simulated spoken report for blue-collar testing
      const sampleSpokenReports = [
        "I know how to scan but I am still confused where products are in aisles 4 to 8.",
        "Scanner device disconnected two times during the cold room pick.",
        "Today was smooth, I found all items fast without getting lost.",
        "The beverage carton was too heavy and the packaging barcode was ripped.",
      ];
      const randomReport =
        sampleSpokenReports[Math.floor(Math.random() * sampleSpokenReports.length)];
      onTranscript(randomReport);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // English (India) natural accent for Indian dark stores

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  return (
    <button
      id="voice-input-btn"
      type="button"
      onClick={toggleListening}
      disabled={isProcessing}
      title={hasSpeechSupport ? "Tap to speak in your natural voice" : "Tap to speak (speech simulation)"}
      className={`relative inline-flex items-center justify-center p-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
        isListening
          ? "bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse"
          : isProcessing
          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm"
      }`}
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
