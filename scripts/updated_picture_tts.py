#!/usr/bin/env python3
"""
Updated espeak-ng TTS generator for picture descriptions
Adapted for the new CSV structure with difficulties and batch organization
Pictures batched by 10s across multiple batches
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

# TTS settings for picture descriptions (similar to sentences but slightly slower)
PICTURE_TTS_SETTINGS = {
    'speed': '130',     # Moderate speed for picture descriptions
    'pitch': '50',
    'amplitude': '105',
}

class PictureTTSGenerator:
    def __init__(self, project_root):
        self.root = Path(project_root)
        self.csv_dir = self.root / "csv"
        self.dist_dir = self.root / "dist"
        
        # Ensure dist directory exists
        self.dist_dir.mkdir(exist_ok=True)

    def read_pictures_csv(self):
        """Read the pictures CSV with error handling"""
        # Only read the specific NEW file
        csv_file = self.csv_dir / "batch01" / "pictures_batch01_v1NEW.csv"
        
        if not csv_file.exists():
            raise FileNotFoundError(f"Required pictures CSV not found: {csv_file}")
        
        print(f"📖 Reading pictures from: {csv_file}")
        
        # Try different encodings
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(csv_file, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    print(f"✅ Successfully read {len(rows)} pictures")
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
                '-s', PICTURE_TTS_SETTINGS['speed'],
                '-p', PICTURE_TTS_SETTINGS['pitch'],
                '-a', PICTURE_TTS_SETTINGS['amplitude'],
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

    def generate_picture_audio(self, pictures):
        """Generate audio files for all picture descriptions with proper batching"""
        print(f"🔊 Generating picture description audio files...")
        
        generated_count = 0
        skipped_count = 0
        error_count = 0
        
        # Group pictures by difficulty for organization
        pictures_by_difficulty = {}
        for picture in pictures:
            difficulty = picture.get('difficulty', 'A1')
            if difficulty not in pictures_by_difficulty:
                pictures_by_difficulty[difficulty] = []
            pictures_by_difficulty[difficulty].append(picture)
        
        print(f"📊 Found pictures for difficulties: {list(pictures_by_difficulty.keys())}")
        
        for difficulty, difficulty_pictures in pictures_by_difficulty.items():
            print(f"📚 Processing {len(difficulty_pictures)} pictures for {difficulty} level...")
            
            # Split pictures into batches of 10
            batch_size = 10
            for batch_idx in range(0, len(difficulty_pictures), batch_size):
                batch_num = (batch_idx // batch_size) + 1
                batch_name = f"batch{batch_num:03d}"
                batch_pictures = difficulty_pictures[batch_idx:batch_idx + batch_size]
                
                if not batch_pictures:
                    continue
                
                print(f"  📦 Processing {batch_name} ({len(batch_pictures)} pictures)")
                
                for picture in batch_pictures:
                    picture_id = picture.get('picture_id', '')
                    if not picture_id:
                        skipped_count += 1
                        continue
                    
                    # Generate audio for each language
                    for lang in VOICES.keys():
                        sentence_text = picture.get(f'{lang}_sentence', '')
                        
                        if not sentence_text:
                            skipped_count += 1
                            continue
                        
                        # Create output directory structure: dist/languages/zh/A1/batch001/audio/pictures/
                        picture_dir = self.dist_dir / "languages" / lang / difficulty / batch_name / "audio" / "pictures"
                        picture_dir.mkdir(parents=True, exist_ok=True)
                        
                        output_file = picture_dir / f"{picture_id}.mp3"
                        
                        # Skip if file already exists
                        if output_file.exists():
                            skipped_count += 1
                            continue
                        
                        # Generate audio
                        success = self.generate_audio_file(sentence_text, output_file, lang)
                        
                        if success:
                            generated_count += 1
                        else:
                            error_count += 1
        
        print(f"📊 Picture Audio Summary: {generated_count} generated, {skipped_count} skipped, {error_count} errors")
        return generated_count, skipped_count, error_count

    def run(self):
        """Main execution function"""
        print("🚀 Updated Picture TTS Generator")
        print("=" * 38)
        
        try:
            # Read pictures
            pictures = self.read_pictures_csv()
            
            # Check if we have the expected languages
            first_picture = pictures[0] if pictures else {}
            available_langs = []
            for lang in VOICES.keys():
                if f'{lang}_sentence' in first_picture:
                    available_langs.append(lang)
            
            print(f"🌍 Available languages: {available_langs}")
            
            if not available_langs:
                print("❌ No language columns found in pictures CSV")
                return
            
            # Show difficulty distribution
            difficulty_dist = {}
            for picture in pictures:
                diff = picture.get('difficulty', 'Unknown')
                difficulty_dist[diff] = difficulty_dist.get(diff, 0) + 1
            
            print(f"📊 Pictures by difficulty: {difficulty_dist}")
            
            # Generate audio files
            generated, skipped, errors = self.generate_picture_audio(pictures)
            
            if generated > 0:
                print(f"🎉 Successfully generated {generated} picture audio files!")
                print(f"📁 Audio files saved to: {self.dist_dir}/languages/[lang]/[difficulty]/[batch]/audio/pictures/")
            else:
                print("⚠️ No audio files were generated")
                
        except Exception as e:
            print(f"💥 Error: {e}")
            raise

def main():
    import sys
    
    # Get project root directory
    project_root = Path(__file__).parent.parent if len(sys.argv) <= 1 else sys.argv[1]
    
    generator = PictureTTSGenerator(project_root)
    generator.run()

if __name__ == "__main__":
    main()