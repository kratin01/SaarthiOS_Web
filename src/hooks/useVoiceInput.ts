/**
 * Speaking instead of typing.
 *
 * Both engines run at once, and they do different jobs:
 *
 * - The browser's `SpeechRecognition` streams words while you talk, so there is
 *   something on screen immediately. It is only a preview. Its `en-IN` model
 *   mangles code-switched speech — "aaj maine" comes back as "Aa Mane" — so its
 *   text is never what gets used.
 * - Meanwhile the clip is recorded and sent to the server, which transcribes it
 *   with the configured AI provider. That costs a second or two and is far
 *   better at a sentence that changes language halfway through.
 *
 * The server's answer wins. If it cannot answer — no provider, no network, a
 * provider with no audio support — whatever the browser heard is used instead,
 * so pressing the button always produces something.
 *
 * Nothing is ever sent on its own; the text lands in the message box to be read.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/api';
import { errorMessage } from '@/api/http';

export type VoiceState = 'idle' | 'listening' | 'transcribing';

/** Closest preset for Hinglish: Indian-accented English with Hindi loanwords. */
const LANG = 'en-IN';

/** Below this there is no speech in the clip, only the click of the button. */
const MIN_CLIP_BYTES = 1200;

type Recogniser = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const SpeechRecognitionCtor = (): (new () => Recogniser) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** getUserMedia is absent on http:// origins, which is worth saying out loud. */
const canRecord = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

const pickMimeType = () =>
  MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';

export function useVoiceInput({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState('');

  const recogniser = useRef<Recogniser | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  /** What the browser heard, kept only in case the server cannot answer. */
  const heard = useRef('');
  /** Distinguishes "the user pressed stop" from "the engine gave up". */
  const wanted = useRef(false);

  const supported = canRecord() || Boolean(SpeechRecognitionCtor());

  const reset = useCallback(() => {
    wanted.current = false;
    heard.current = '';
    setPreview('');
    setState('idle');
  }, []);

  const releaseMic = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  /** The preview engine. Its transcript is a fallback, never the answer. */
  const startPreview = useCallback(() => {
    const Ctor = SpeechRecognitionCtor();
    if (!Ctor) return;

    try {
      const engine = new Ctor();
      engine.lang = LANG;
      engine.interimResults = true;
      engine.maxAlternatives = 1;
      // Ignored on Android Chrome, which stops at every pause — the restart in
      // `onend` is what actually keeps it running there.
      engine.continuous = true;

      engine.onresult = (event: any) => {
        let settled = '';
        let pending = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) settled += result[0].transcript;
          else pending += result[0].transcript;
        }
        if (settled) heard.current = `${heard.current} ${settled}`.trim();
        setPreview(`${heard.current} ${pending}`.trim());
      };

      // A failing preview is not worth a message — the recording is the thing
      // that matters and it is still running.
      engine.onerror = () => {};

      engine.onend = () => {
        if (!wanted.current) return;
        try {
          engine.start();
        } catch {
          // Already restarting.
        }
      };

      recogniser.current = engine;
      engine.start();
    } catch {
      recogniser.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setError(null);
    heard.current = '';
    setPreview('');

    // Without microphone access the browser engine is the only option left.
    if (!canRecord()) {
      if (!SpeechRecognitionCtor()) {
        setError('This browser cannot record audio. Type your message instead.');
        return;
      }
      wanted.current = true;
      setState('listening');
      startPreview();
      return;
    }

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (err) {
      setError(
        (err as Error)?.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser settings.'
          : 'Could not start the microphone.'
      );
      return;
    }

    const mimeType = pickMimeType();
    const engine = new MediaRecorder(
      stream.current,
      mimeType ? { mimeType, audioBitsPerSecond: 32_000 } : undefined
    );
    chunks.current = [];

    engine.ondataavailable = (event) => {
      if (event.data.size) chunks.current.push(event.data);
    };

    engine.onstop = async () => {
      releaseMic();
      const clip = new Blob(chunks.current, { type: engine.mimeType || 'audio/webm' });
      chunks.current = [];
      const fallback = heard.current.trim();

      if (clip.size < MIN_CLIP_BYTES) {
        if (fallback) onText(fallback);
        reset();
        return;
      }

      setState('transcribing');
      try {
        const text = await chatApi.transcribe(clip, `voice-note.${extensionFor(engine.mimeType)}`);
        if (text.trim()) onText(text.trim());
        else if (fallback) onText(fallback);
        else setError('That came through silent. Try again.');
      } catch (err) {
        // The browser already heard something usable, so use it rather than
        // making the user say the whole thing over again.
        if (fallback) onText(fallback);
        else setError(errorMessage(err, 'Could not transcribe that. Try typing instead.'));
      } finally {
        reset();
      }
    };

    recorder.current = engine;
    wanted.current = true;
    setState('listening');
    engine.start();
    startPreview();
  }, [releaseMic, reset, startPreview, state]);

  const stop = useCallback(() => {
    wanted.current = false;
    recogniser.current?.stop();
    recogniser.current = null;

    if (recorder.current?.state === 'recording') {
      // `onstop` takes it from here, including the transcription request.
      recorder.current.stop();
      recorder.current = null;
      return;
    }

    // Preview-only mode: what the browser heard is all there is.
    const fallback = heard.current.trim();
    if (fallback) onText(fallback);
    reset();
  }, [onText, reset]);

  // Leaving the page mid-sentence must not leave the microphone open.
  useEffect(
    () => () => {
      wanted.current = false;
      recogniser.current?.abort();
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  return {
    supported,
    state,
    listening: state === 'listening',
    busy: state === 'transcribing',
    preview,
    error,
    start,
    stop,
    toggle: () => (state === 'idle' ? void start() : stop())
  };
}

const extensionFor = (mimeType: string) => {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
};
