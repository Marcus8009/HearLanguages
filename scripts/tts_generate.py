"""Batch‑generate MP3 using Azure Neural TTS."""
import os, json, requests, pathlib, hashlib, csv
key = os.getenv("AZURE_TTS_KEY")
region = os.getenv("AZURE_TTS_REGION")
END = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
FMT = "audio-24khz-32kbitrate-mono-mp3"
voices = {
    "en": "en-US-AIGenerate2Neural",
    "zh": "zh-CN-XiaoyiMultilingualNeural",
    "ja": "ja-JP-NanamiNeural",
    "es": "es-ES-AlvaroNeural",
    "fr": "fr-FR-BrigitteNeural",
}
root = pathlib.Path(__file__).resolve().parent.parent
sent_csv = root/"csv"/"batch01"/"sentences_batch01_v1.csv"
for row in csv.DictReader(open(sent_csv, encoding="utf-8-sig")):
    sid = row["sentence_id"]
    for lang in voices:
        text = row.get(f"{lang}_sentence")
        if not text:
            continue
        out = root/"dist"/"sentences"/"batch01"/sid/f"{lang}.mp3"
        out.parent.mkdir(parents=True, exist_ok=True)
        if out.exists():
            continue
        ssml = f"""
        <speak version='1.0' xml:lang='{lang}'>
          <voice name='{voices[lang]}'>{text}</voice>
        </speak>"""
        r = requests.post(END, params={"X-Microsoft-OutputFormat": FMT},
                         headers={"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml"},
                         data=ssml.encode("utf-8"))
        r.raise_for_status()
        with open(out, "wb") as f: f.write(r.content)
