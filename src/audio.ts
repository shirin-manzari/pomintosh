import chimeUrl from "./assets/sounds/timer-finished.wav";
import startupUrl from "./assets/sounds/mac-startup.wav";

export function createCompletionSound(): {
  unlock: () => void;
  play: () => Promise<void>;
  playStartup: () => Promise<void>;
} {
  let context: AudioContext | null = null;
  let buffer: Promise<AudioBuffer | null> | null = null;
  let startupBuffer: Promise<AudioBuffer> | null = null;

  function unlock(): void {
    // Open the audio context during a user gesture for WebView autoplay rules.
    if (!context) {
      try {
        context = new AudioContext();
      } catch (error) {
        console.warn("Completion audio unavailable:", error);
        return;
      }
    }
    const audioContext = context;
    buffer ??= fetch(chimeUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load completion chime.");
        return response.arrayBuffer();
      })
      .then((data) => audioContext.decodeAudioData(data))
      .catch((error: unknown) => {
        console.warn("Completion chime unavailable:", error);
        return null;
      });
    void audioContext.resume().catch((error: unknown) => console.warn("Could not enable audio:", error));
  }

  async function play(): Promise<void> {
    const audioContext = context;
    const audioBuffer = buffer;
    if (!audioContext || !audioBuffer) return;

    try {
      const decodedBuffer = await audioBuffer;
      if (!decodedBuffer) return;
      await audioContext.resume();
      const source = audioContext.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.warn("Could not play completion chime:", error);
    }
  }

  async function playStartup(): Promise<void> {
    const audioContext = context;
    if (!audioContext) return;

    try {
      await audioContext.resume();
      startupBuffer ??= fetch(startupUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Could not load startup chime.");
          return response.arrayBuffer();
        })
        .then((data) => audioContext.decodeAudioData(data));
      const source = audioContext.createBufferSource();
      source.buffer = await startupBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.warn("Could not play startup chime:", error);
    }
  }

  return { unlock, play, playStartup };
}
