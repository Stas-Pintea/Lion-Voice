import * as piper from '@mintplex-labs/piper-tts-web';

let loadedVoice = null;

export async function synthesize(text, voiceId, onProgress) {
  if (voiceId !== loadedVoice) {
    // The library reuses one model session, so reload it when the voice changes.
    piper.TtsSession._instance = null;
    loadedVoice = voiceId;
  }
  return piper.predict({ text, voiceId }, onProgress);
}
