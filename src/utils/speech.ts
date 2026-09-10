// Browser-native Text-to-Speech utility for frontline workers

// Keep module-level reference to active utterance to prevent Chrome V8 garbage collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakMessage(
  text: string,
  isHindi: boolean = false,
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any currently playing audio

    // Clean text of markdown or special characters before speaking
    const cleanText = text
      .replace(/[#*_`~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Chrome workaround: resume if synth is paused or stuck
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterance = utterance; // Retain reference
    utterance.rate = 0.95; // Slightly slower pacing for warehouse clarity
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (isHindi) {
      const hindiVoice = voices.find(
        (v) =>
          v.lang.startsWith("hi") ||
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("hindi")
      );
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = "hi-IN";
    } else {
      const indianEnglish = voices.find(
        (v) => v.lang === "en-IN" || v.name.toLowerCase().includes("india")
      );
      if (indianEnglish) utterance.voice = indianEnglish;
      utterance.lang = "en-IN";
    }

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis unavailable:", err);
    activeUtterance = null;
    if (onEnd) onEnd();
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}
