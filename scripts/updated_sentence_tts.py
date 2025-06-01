#!/usr/bin/env python3
"""
Updated espeak-ng TTS generator for sentences
Adapted for the new CSV structure with difficulties and batch organization
Sentences batched by 50s across multiple batches
"""

import os
import csv
import subprocess
import tempfile
from pathlib import Path

# espeak-ng voice mappings
VOICES = {
    "en": "en",      # English
    "zh": "cmn",     # Mandarin Chinese  
    "ja": "ja",      # Japanese
    "es": "es",      # Spanish
    "fr": "fr",      # French
}

# TTS settings for different content types
TTS_SETTINGS = {
    'sentences': {
        'speed': '140',     # Slightly slower for sentences
        'pitch': '50',
        'amplitude': '100',
    },
    'words': {
        'speed': '120',     # Slower for individual words
        'pitch': '55', 
        'amplitude': '110',
    }
}

class SentenceTTSGenerator:
    def __init__(self, project_root):
        self.root = Path(project_root)
        self.csv_dir = self.root / "csv"
        self.dist_dir = self.root / "dist"
        
        # Ensure dist directory exists
        self.dist_dir.mkdir(exist_ok=True)

    def read_sentences_csv(self):
        """Read the sentences CSV with error handling"""
        # Only read the specific NEW file
        csv_file = self.csv_dir / "batch01" / "sentences_batch01_v1NEW.csv"
        
        if not csv_file.exists():
            raise FileNotFoundError(f"Required sentences CSV not found: {csv_file}")
        
        print(f"📖 Reading sentences from: {csv_file}")
        
        # Try different encodings
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(csv_file, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    print(f"✅ Successfully read {len(rows)} sentences")
                    return rows
            except UnicodeDecodeError:
                continue
        
        raise Exception(f"Could not read {csv_file} with any encoding")

    def generate_audio_file(self, text, output_path, language, content_type='sentences'):
        """Generate audio file using espeak-ng"""
        if not text or not text.strip():
            return False
        
        # Get TTS settings
        settings = TTS_SETTINGS.get(content_type, TTS_SETTINGS['sentences'])
        voice = VOICES.get(language, 'en')
        
        # Create temporary WAV file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_wav_path = temp_wav.name
        
        try:
            # Generate WAV using espeak-ng
            cmd = [
                'espeak-ng.exe',  # Windows executable
                '-v', voice,
                '-s', settings['speed'],
                '-p', settings['pitch'],
                '-a', settings['amplitude'],
                '-w', temp_wav_path,
                text
            ]
            
            # Run espeak-ng
            result = subprocess.run(
                cmd, 
                check=True, 
                capture_output=True, 
                text=True, 
                shell=True
            )
            
            # Convert WAV to MP3 using ffmpeg (matching your original format)
            ffmpeg_cmd = [
                'ffmpeg.exe',
                '-i', temp_wav_path,
                '-ar', '24000',  # Sample rate 24kHz
                '-ab', '32k',    # Bitrate 32kbps
                '-ac', '1',      # Mono
                '-y',            # Overwrite output
                str(output_path)
            ]
            
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True, text=True, shell=True)
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Error generating audio for {output_path}: {e}")
            return False
            
        finally:
            # Clean up temporary WAV file
            if os.path.exists(temp_wav_path):
                try:
                    os.unlink(temp_wav_path)
                except:
                    pass

    def generate_sentence_audio(self, sentences):
        """Generate audio files for all sentences with proper batching"""
        print(f"🔊 Generating sentence audio files...")
        
        generated_count = 0
        skipped_count = 0
        error_count = 0
        
        # Group sentences by difficulty for organization
        sentences_by_difficulty = {}
        for sentence in sentences:
            difficulty = sentence.get('difficulty', 'A1')
            if difficulty not in sentences_by_difficulty:
                sentences_by_difficulty[difficulty] = []
            sentences_by_difficulty[difficulty].append(sentence)
        
        print(f"📊 Found sentences for difficulties: {list(sentences_by_difficulty.keys())}")
        
        for difficulty, difficulty_sentences in sentences_by_difficulty.items():
            print(f"📚 Processing {len(difficulty_sentences)} sentences for {difficulty} level...")
            
            # Split sentences into batches of 50
            batch_size = 50
            for batch_idx in range(0, len(difficulty_sentences), batch_size):
                batch_num = (batch_idx // batch_size) + 1
                batch_name = f"batch{batch_num:03d}"
                batch_sentences = difficulty_sentences[batch_idx:batch_idx + batch_size]
                
                if not batch_sentences:
                    continue
                
                print(f"  📦 Processing {batch_name} ({len(batch_sentences)} sentences)")
                
                for sentence in batch_sentences:
                    sentence_id = sentence.get('sentence_id', '')
                    if not sentence_id:
                        skipped_count += 1
                        continue
                    
                    # Generate audio for each language
                    for lang in VOICES.keys():
                        sentence_text = sentence.get(f'{lang}_sentence', '')
                        
                        if not sentence_text:
                            skipped_count += 1
                            continue
                        
                        # Create output directory structure: dist/languages/zh/A1/batch001/audio/sentences/
                        sentence_dir = self.dist_dir / "languages" / lang / difficulty / batch_name / "audio" / "sentences"
                        sentence_dir.mkdir(parents=True, exist_ok=True)
                        
                        output_file = sentence_dir / f"{sentence_id}.mp3"
                        
                        # Skip if file already exists
                        if output_file.exists():
                            skipped_count += 1
                            continue
                        
                        # Generate audio
                        success = self.generate_audio_file(
                            sentence_text, 
                            output_file, 
                            lang, 
                            'sentences'
                        )
                        
                        if success:
                            generated_count += 1
                        else:
                            error_count += 1
        
        print(f"📊 Sentence Audio Summary: {generated_count} generated, {skipped_count} skipped, {error_count} errors")
        return generated_count, skipped_count, error_count

    def run(self):
        """Main execution function"""
        print("🚀 Updated Sentence TTS Generator")
        print("=" * 40)
        
        try:
            # Read sentences
            sentences = self.read_sentences_csv()
            
            # Check if we have the expected languages
            first_sentence = sentences[0] if sentences else {}
            available_langs = []
            for lang in VOICES.keys():
                if f'{lang}_sentence' in first_sentence:
                    available_langs.append(lang)
            
            print(f"🌍 Available languages: {available_langs}")
            
            if not available_langs:
                print("❌ No language columns found in sentences CSV")
                return
            
            # Generate audio files
            generated, skipped, errors = self.generate_sentence_audio(sentences)
            
            if generated > 0:
                print(f"🎉 Successfully generated {generated} sentence audio files!")
                print(f"📁 Audio files saved to: {self.dist_dir}/languages/[lang]/[difficulty]/[batch]/audio/sentences/")
            else:
                print("⚠️ No audio files were generated")
                
        except Exception as e:
            print(f"💥 Error: {e}")
            raise

def main():
    import sys
    
    # Get project root directory
    project_root = Path(__file__).parent.parent if len(sys.argv) <= 1 else sys.argv[1]
    
    generator = SentenceTTSGenerator(project_root)
    generator.run()

if __name__ == "__main__":
    main()