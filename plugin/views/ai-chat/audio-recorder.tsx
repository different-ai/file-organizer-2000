import React, { useRef, useState, useEffect } from "react";
import { Button } from "./button";
import { usePlugin } from "./provider";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptionComplete,
}) => {
  const plugin = usePlugin();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Convert WebM to WAV
  const convertWebMToWAV = async (webmBlob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV format
    const wavBlob = await new Promise<Blob>(resolve => {
      const length =
        renderedBuffer.length * renderedBuffer.numberOfChannels * 2;
      const view = new DataView(new ArrayBuffer(44 + length));

      // Write WAV header
      writeUTFBytes(view, 0, "RIFF");
      view.setUint32(4, 36 + length, true);
      writeUTFBytes(view, 8, "WAVE");
      writeUTFBytes(view, 12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, renderedBuffer.numberOfChannels, true);
      view.setUint32(24, renderedBuffer.sampleRate, true);
      view.setUint32(28, renderedBuffer.sampleRate * 4, true);
      view.setUint16(32, 4, true);
      view.setUint16(34, 16, true);
      writeUTFBytes(view, 36, "data");
      view.setUint32(40, length, true);

      // Write audio data
      const data = new Float32Array(renderedBuffer.length);
      renderedBuffer.copyFromChannel(data, 0);
      let offset = 44;
      for (let i = 0; i < data.length; i++) {
        const sample = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        offset += 2;
      }

      resolve(new Blob([view], { type: "audio/wav" }));
    });

    return wavBlob;
  };

  const writeUTFBytes = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      audioChunks.current = [];
      mediaRecorder.ondataavailable = event => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      await new Promise<void>(resolve => {
        mediaRecorderRef.current!.onstop = async () => {
          try {
            const webmBlob = new Blob(audioChunks.current, {
              type: "audio/webm",
            });
            const wavBlob = await convertWebMToWAV(webmBlob);

            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(wavBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;

              // Send to server for transcription
              const response = await fetch(
                `${plugin.getServerUrl()}/api/transcribe`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audio: base64Audio,
                    extension: "wav",
                  }),
                }
              );

              const data = await response.json();
              onTranscriptionComplete(data.text);
            };
          } catch (error) {
            console.error("Error processing audio:", error);
          }
          resolve();
        };
      });
    }
  };

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      className={`ml-2 ${isRecording ? "bg-[--text-error]" : ""}`}
      title={isRecording ? "Stop Recording" : "Start Recording"}
    >
      {isRecording ? "Stop Recording" : "Start Recording"}
    </Button>
  );
};
