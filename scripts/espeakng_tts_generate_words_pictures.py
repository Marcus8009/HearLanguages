"""Batch‑generate MP3 using espeak-ng TTS on Windows."""
import os, json, requests, pathlib, hashlib, csv
import subprocess
import tempfile

# espeak-ng voice mappings
voices = {
    "en": "en",  # English
    "zh": "cmn",  # Mandarin Chinese
    "ja": "ja",  # Japanese
    "es": "es",  # Spanish
    "fr": "fr",  # French
}

root = pathlib.Path(__file__).resolve().parent.parent
sent_csv = root/"csv"/"batch01"/"sentences_batch01_v1.csv"

# Try different encodings
encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
file_opened = False
for encoding in encodings:
    try:
        with open(sent_csv, encoding=encoding) as f:
            # Test read first line
            f.readline()
            f.seek(0)
            print(f"Successfully opened CSV with encoding: {encoding}")
            csv_reader = csv.DictReader(f)
            rows = list(csv_reader)
            file_opened = True
            break
    except UnicodeDecodeError:
        continue

if not file_opened:
    print("Could not open CSV file with any standard encoding")
    print(f"File path: {sent_csv}")
    print(f"File exists: {sent_csv.exists()}")
    exit(1)

for row in rows:
    sid = row["sentence_id"]
    for lang in voices:
        text = row.get(f"{lang}_sentence")
        if not text:
            continue
        out = root/"dist"/"sentences"/"batch01"/sid/f"{lang}.mp3"
        out.parent.mkdir(parents=True, exist_ok=True)
        if out.exists():
            continue
        
        # Create temporary WAV file first (espeak-ng outputs WAV by default)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_wav_path = temp_wav.name
        
        try:
            # Generate WAV using espeak-ng
            cmd = [
                'espeak-ng.exe',  # Windows executable
                '-v', voices[lang],  # Voice/language
                '-s', '150',  # Speed (words per minute)
                '-p', '50',   # Pitch
                '-a', '100',  # Amplitude (volume)
                '-w', temp_wav_path,  # Output WAV file
                text
            ]
            # Use shell=True on Windows to help with path resolution
            subprocess.run(cmd, check=True, capture_output=True, text=True, shell=True)
            
            # Convert WAV to MP3 using ffmpeg (matching Azure's format)
            # 24kHz sample rate, 32kbps bitrate, mono
            ffmpeg_cmd = [
                'ffmpeg.exe',
                '-i', temp_wav_path,
                '-ar', '24000',  # Sample rate 24kHz
                '-ab', '32k',    # Bitrate 32kbps
                '-ac', '1',      # Mono
                '-y',            # Overwrite output
                str(out)
            ]
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True, text=True, shell=True)
            
        except subprocess.CalledProcessError as e:
            print(f"Error processing {lang} for sentence {sid}: {e}")
            if e.stderr:
                print(f"Error details: {e.stderr}")
            continue
            
        finally:
            # Clean up temporary WAV file
            if os.path.exists(temp_wav_path):
                try:
                    os.unlink(temp_wav_path)
                except:
                    pass  # Sometimes Windows holds file locks temporarily