const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

/**
 * Clones a voice from an audio file using ElevenLabs Instant Voice Cloning.
 * Returns the generated voice_id.
 */
export async function cloneVoice(
  audioBlob: Blob,
  voiceName: string,
  apiKey: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("name", voiceName);
  formData.append("description", "Voz clonada via LeadFlow");
  formData.append("files", audioBlob, "recording.webm");

  const res = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[elevenlabs] Voice clone error:", errorText);
    throw new Error(`ElevenLabs voice clone failed: ${res.status}`);
  }

  const data = (await res.json()) as { voice_id: string };
  return data.voice_id;
}

/**
 * Deletes a cloned voice from ElevenLabs to avoid accumulating unused voices.
 */
export async function deleteVoice(voiceId: string, apiKey: string): Promise<void> {
  await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
    method: "DELETE",
    headers: { "xi-api-key": apiKey },
  });
}

export async function generateSpeechBase64(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<string> {
  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[elevenlabs] TTS error:", errorText);
    throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
