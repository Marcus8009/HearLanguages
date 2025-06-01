#!/usr/bin/env python3
"""
Updated espeak-ng TTS generator for words
Adapted for the new CSV structure with difficulties and batch organization
Words batched by 50s (but typically only 1 batch per difficulty since 42 < 50)
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

# TTS settings for words (slower and clearer than sentences)
WORD_TTS_SETTINGS = {
    'speed': '110',     # Slower for clear pronunciation
    'pitch': '55',
    'amplitude': '120', # Slightly louder
}

class WordTTSGenerator:
    def __init__(self, project_root):
        self.root = Path(project_root)
        self.csv_dir = self.root / "csv"
        self.dist_dir = self.root / "dist"
        
        # Ensure dist directory exists
        self.dist_dir.mkdir(exist_ok=True)

    def read_words_csv(self):
        """Read the words CSV with error handling"""
        # Only read the specific NEW file
        csv_file = self.csv_dir / "words_v1NEW.csv"
        
        if not csv_file.exists():
            raise FileNotFoundError(f"Required words CSV not found: {csv_file}")
        
        print(f"📖 Reading words from: {csv_file}")
        
        # Try different encodings
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(csv_file, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    print(f"✅ Successfully read {len(rows)} words")
                    return rows
            except UnicodeDecodeError:
                continue
        
        raise Exception(f"Could not read {csv_file} with any encoding")

    def generate_audio_file(self, text, output_path, language):
        """Generate audio file using espeak-ng"""
        if not text or not text.strip():
            return False
        
        voice = VOICES.get(language, 'en')
        
        # Create temporary WAV file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_wav_path = temp_wav.name
        
        try:
            # Generate WAV using espeak-ng
            cmd = [
                'espeak-ng.exe',  # Windows executable
                '-v', voice,
                '-s', WORD_TTS_SETTINGS['speed'],
                '-p', WORD_TTS_SETTINGS['pitch'],
                '-a', WORD_TTS_SETTINGS['amplitude'],
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
            
            # Convert WAV to MP3 using ffmpeg
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

    def generate_word_audio(self, words):
        """Generate audio files for all words across all difficulties, properly batched"""
        print(f"🔊 Generating word audio files...")
        
        generated_count = 0
        skipped_count = 0
        error_count = 0
        
        # Group words by difficulty for organization
        words_by_difficulty = {}
        for word in words:
            difficulty = word.get('difficulty', 'A1')
            if difficulty not in words_by_difficulty:
                words_by_difficulty[difficulty] = []
            words_by_difficulty[difficulty].append(word)
        
        print(f"📊 Found words for difficulties: {list(words_by_difficulty.keys())}")
        
        for difficulty, difficulty_words in words_by_difficulty.items():
            print(f"📚 Processing {len(difficulty_words)} words for {difficulty} level...")
            
            # Split words into batches of 50 (typically only 1 batch since 42 words < 50)
            batch_size = 50
            for batch_idx in range(0, len(difficulty_words), batch_size):
                batch_num = (batch_idx // batch_size) + 1
                batch_name = f"batch{batch_num:03d}"
                batch_words = difficulty_words[batch_idx:batch_idx + batch_size]
                
                if not batch_words:
                    continue
                
                print(f"  📦 Processing {batch_name} ({len(batch_words)} words)")
                
                for word in batch_words:
                    word_id = word.get('word_id', '')
                    if not word_id:
                        skipped_count += 1
                        continue
                    
                    # Generate audio for each language
                    for lang in VOICES.keys():
                        # Get word text for this language
                        if lang == 'en':
                            word_text = word.get('en_word', word.get('base_en', ''))
                        else:
                            word_text = word.get(f'{lang}_word', '')
                        
                        if not word_text:
                            skipped_count += 1
                            continue
                        
                        # Create output directory structure: dist/languages/zh/A1/batch001/audio/words/
                        word_dir = self.dist_dir / "languages" / lang / difficulty / batch_name / "audio" / "words"
                        word_dir.mkdir(parents=True, exist_ok=True)
                        
                        output_file = word_dir / f"{word_id}.mp3"
                        
                        # Skip if file already exists
                        if output_file.exists():
                            skipped_count += 1
                            continue
                        
                        # Generate audio
                        success = self.generate_audio_file(word_text, output_file, lang)
                        
                        if success:
                            generated_count += 1
                        else:
                            error_count += 1
        
        print(f"📊 Word Audio Summary: {generated_count} generated, {skipped_count} skipped, {error_count} errors")
        return generated_count, skipped_count, error_count

    def run(self):
        """Main execution function"""
        print("🚀 Updated Word TTS Generator")
        print("=" * 35)
        
        try:
            # Read words
            words = self.read_words_csv()
            
            # Check if we have the expected languages
            first_word = words[0] if words else {}
            available_langs = []
            for lang in VOICES.keys():
                if lang == 'en':
                    if 'en_word' in first_word or 'base_en' in first_word:
                        available_langs.append(lang)
                else:
                    if f'{lang}_word' in first_word:
                        available_langs.append(lang)
            
            print(f"🌍 Available languages: {available_langs}")
            
            if not available_langs:
                print("❌ No language columns found in words CSV")
                return
            
            # Show difficulty distribution
            difficulty_dist = {}
            for word in words:
                diff = word.get('difficulty', 'Unknown')
                difficulty_dist[diff] = difficulty_dist.get(diff, 0) + 1
            
            print(f"📊 Words by difficulty: {difficulty_dist}")
            
            # Generate audio files
            generated, skipped, errors = self.generate_word_audio(words)
            
            if generated > 0:
                print(f"🎉 Successfully generated {generated} word audio files!")
                print(f"📁 Audio files saved to: {self.dist_dir}/languages/[lang]/[difficulty]/[batch]/audio/words/")
            else:
                print("⚠️ No audio files were generated")
                
        except Exception as e:
            print(f"💥 Error: {e}")
            raise

def main():
    import sys
    
    # Get project root directory
    project_root = Path(__file__).parent.parent if len(sys.argv) <= 1 else sys.argv[1]
    
    generator = WordTTSGenerator(project_root)
    generator.run()

if __name__ == "__main__":
    main()