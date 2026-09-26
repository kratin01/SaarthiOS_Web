/**
 * Speaking instead of typing.
 *
 * Two engines, because one is not enough:
 *
 * 1. The browser's own `SpeechRecognition`. Free, instant, and it streams words
 *    as you say them so mistakes are visible immediately. Chrome, Edge and
 *    Safari have it — Firefox does not, and neither does an iOS web app once it
 *    has been added to the home screen.
 * 2. Recording the clip and sending it to the server, which transcribes it with
 *    the AI provider already configured. Slower, but it works everywhere and it
 *    is noticeably better at a sentence that switches between Hindi and English
 *    halfway through.
 *
 * The first is used when it exists, the second otherwise. Neither ever sends a
 * message — the text lands in the box for the user to read first.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/api';
import { errorMessage } from '@/api/http';

export type VoiceState = 'idle' | 'listening' | 'transcribing';

/**
 * Indian English. It is the closest preset for Hinglish: the acoustic model is
 * trained on Indian speakers and it already knows the Hindi words that turn up
 * in everyday English sentences.
 */
const LANG = 'en-IN';

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
  const [interim, setInterim] = useState('');

  const recogniser = useRef<Recogniser | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  /** Distinguishes "the user pressed stop" from "the engine gave up". */
  const wanted = useRef(false);

  const supported = Boolean(SpeechRecognitionCtor()) || canRecord();

  const finish = useCallback(() => {
    setState('idle');
    setInterim('');
    wanted.current = false;
  }, []);

  // ---- Engine 1: the browser ------------------------------------------------

  const startNative = useCallback(
    (Ctor: new () => Recogniser) => {
      const engine = new Ctor();
      engine.lang = LANG;
      engine.interimResults = true;
      engine.maxAlternatives = 1;
      // Ignored on Android Chrome, which stops at the first pause regardless —
      // the `onend` restart below is what actually keeps it going there.
      engine.continuous = true;

      engine.onresult = (event: any) => {
        let settled = '';
        let pending = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) settled += result[0].transcript;
          else pending += result[0].transcript;
        }
        if (settled.trim()) onText(settled.trim());
        setInterim(pending);
      };

      engine.onerror = (event: any) => {
        // `no-speech` and `aborted` are what a quiet room and the stop button
        // look like. Neither is worth showing to anyone.
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        setError(
          event.error === 'not-allowed'
            ? 'Microphone access was blocked. Allow it in your browser settings.'
            : 'Could not hear that. Try again.'
        );
        wanted.current = false;
      };

      engine.onend = () => {
        // Android stops after every pause; restart while the button is still on.
        if (wanted.current) {
          try {
            engine.start();
            return;
          } catch {
            // Already restarting — fall through and close cleanly.
          }
        }
        finish();
      };

      recogniser.current = engine;
      wanted.current = true;
      setError(null);
      setState('listening');
      engine.start();
    },
    [finish, onText]
  );

  // ---- Engine 2: record, then ask the server --------------------------------

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });

    const mimeType = pickMimeType();
    const engine = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks.current = [];

    engine.ondataavailable = (event) => {
      if (event.data.size) chunks.current.push(event.data);
    };

    engine.onstop = async () => {
      // Releases the microphone, and with it the browser's recording indicator.
      stream.getTracks().forEach((track) => track.stop());

      const clip = new Blob(chunks.current, { type: engine.mimeType || 'audio/webm' });
      chunks.current = [];
      if (clip.size < 1200) {
        finish();
        return;
      }

      setState('transcribing');
      try {
        const text = await chatApi.transcribe(clip, `voice-note.${extensionFor(engine.mimeType)}`);
        if (text.trim()) onText(text.trim());
        else setError('That came through silent. Try again.');
      } catch (err) {
        setError(errorMessage(err, 'Could not transcribe that. Try typing instead.'));
      } finally {
        finish();
      }
    };

    recorder.current = engine;
    wanted.current = true;
    setError(null);
    setState('listening');
    engine.start();
  }, [finish, onText]);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setError(null);

    const Ctor = SpeechRecognitionCtor();
    if (Ctor) {
      try {
        startNative(Ctor);
        return;
      } catch {
        // Some builds expose the constructor and then refuse to start it.
      }
    }

    if (!canRecord()) {
      setError('This browser cannot record audio. Type your message instead.');
      return;
    }

    try {
      await startRecording();
    } catch (err) {
      setError(
        (err as Error)?.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser settings.'
          : 'Could not start the microphone.'
      );
      finish();
    }
  }, [finish, state, startNative, startRecording]);

  const stop = useCallback(() => {
    wanted.current = false;
    recogniser.current?.stop();
    if (recorder.current?.state === 'recording') recorder.current.stop();
    // The recording path reports back from `onstop`, so it stays busy for now.
    if (!recorder.current) finish();
  }, [finish]);

  // Leaving the page mid-sentence must not leave the microphone open.
  useEffect(
    () => () => {
      wanted.current = false;
      recogniser.current?.abort();
      if (recorder.current?.state === 'recording') recorder.current.stop();
    },
    []
  );

  return {
    supported,
    state,
    listening: state === 'listening',
    busy: state === 'transcribing',
    interim,
    error,
    dismissError: () => setError(null),
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
