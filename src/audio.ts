import chimeUrl from "./assets/sounds/timer-finished.wav";

export function createCompletionSound(): {
  unlock: () => void;
  play: () => Promise<void>;
} {
  let context: AudioContext | null = null;
  let buffer: Promise<AudioBuffer | null> | null = null;

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

  return { unlock, play };
}
