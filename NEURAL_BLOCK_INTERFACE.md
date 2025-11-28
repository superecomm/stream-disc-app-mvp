# Neural Block Interface

The **Neural-Block** is the core visual/interactive widget used throughout Stream Disc to capture, play back, and visualise short voice samples.

## 1. Purpose

| Layer | Responsibility |
|-------|----------------|
| **UX** | Give the user one obvious control for recording / playback – without revealing underlying complexity. |
| **Data** | Encapsulate a single audio blob & its derived embedding-vector. |
| **State** | Finite-state machine (idle → recording → processing → success / error). |

## 2. Public API (frontend)

```ts
interface NeuralBlockProps {
  mode: "enroll" | "test" | "identify";
  onUpload?(blob: Blob): Promise<void>;   // called after recording stops
  initialStatus?: BlockStatus;            // hydrate from server
}

// exported enum so logs & styling share same source
export type BlockStatus =
  | "idle"            // waiting for user interaction
  | "recording"       // mic live, spin animation
  | "processing"      // audio sent to backend
  | "success"         // backend returned embedding / match
  | "error";          // backend error or network failure
```

A Neural-Block is **self-contained**: drop the component anywhere and pass the async `onUpload` delegate that posts to the correct API route.

## 3. Visual States

| State | Visual cues | CTA text | Haptics |
|-------|-------------|----------|---------|
| idle | dark square + faint constellation | “Press to record” | none |
| recording | central nodes pulse + border glow | live waveform ring | optional vibration (mobile) |
| processing | spinner of six nodes orbiting | “Processing…” overlay | none |
| success | ring turns green & prints fingerprint icon | shows embedding hash below | success beep |
| error | ring flashes red 2× | error message below block | error beep |

Screenshots / Figma links are referenced in `/design/NeuralBlock.fig` (not committed).

## 4. Behaviour Details

1. **Mic permission** – prompts only once; subsequent attempts reuse the MediaStream.
2. **Auto-stop** – recording stops automatically at `5 s` or when user taps again.
3. **Noise gate** – client-side RMS threshold avoids uploading silence.
4. **Optimistic UI** – block immediately enters *processing* while fetch is in-flight; if request fails → *error*.
5. **Accessibility** – `role="button"`, `aria-live="polite"` for status text.

## 5. Theming & Extensibility

- Colours derived from Tailwind `primary` / `success` / `danger` tokens.
- Size responsive – 200 px default, scales with container using `aspect-square`.
- Future: support **playback** mode; clicking the fingerprint replays the sample.

---
*Document generated 2025-11-27.*
