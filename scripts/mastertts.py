#!/usr/bin/env python3
"""
Master TTS Generator
Runs all TTS generators (words, sentences, pictures) in sequence
"""

import sys
import time
from pathlib import Path

def main():
    print("🎯 Language Learning App - Master TTS Generator")
    print("=" * 52)
    print("This will generate audio files for words, sentences, and pictures")
    print("Using espeak-ng TTS with optimized settings for each content type")
    print()
    
    # Check prerequisites
    print("🔍 Checking prerequisites...")
    
    project_root = Path(__file__).parent.parent
    csv_dir = project_root / "csv"
    
    # Check for required CSV files
    required_files = [
        ("Words CSV", [csv_dir / "words_v1NEW.csv"]),
        ("Sentences CSV", [csv_dir / "batch01" / "sentences_batch01_v1NEW.csv"]),
        ("Pictures CSV", [csv_dir / "batch01" / "pictures_batch01_v1NEW.csv"])
    ]
    
    missing_files = []
    for file_type, file_paths in required_files:
        found = False
        for file_path in file_paths:
            if file_path.exists():
                print(f"  ✅ {file_type}: {file_path}")
                found = True
                break
        if not found:
            missing_files.append(file_type)
            print(f"  ❌ {file_type}: Not found")
    
    if missing_files:
        print(f"\n💥 Missing required files: {missing_files}")
        print("Please run the content generators first:")
        print("  python scripts/generate_test_content.py")
        return
    
    print(f"\n✅ All required CSV files found!")
    
    # Check TTS tools
    print(f"\n🔧 Checking TTS tools...")
    import subprocess
    
    tools = [
        ("espeak-ng.exe", "espeak-ng --version"),
        ("ffmpeg.exe", "ffmpeg -version")
    ]
    
    missing_tools = []
    for tool_name, test_command in tools:
        try:
            result = subprocess.run(
                test_command.split(), 
                capture_output=True, 
                text=True, 
                shell=True, 
                timeout=5
            )
            if result.returncode == 0:
                print(f"  ✅ {tool_name}: Available")
            else:
                missing_tools.append(tool_name)
                print(f"  ❌ {tool_name}: Not working properly")
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            missing_tools.append(tool_name)
            print(f"  ❌ {tool_name}: Not found")
    
    if missing_tools:
        print(f"\n💥 Missing required tools: {missing_tools}")
        print("Please install:")
        print("  - espeak-ng: https://github.com/espeak-ng/espeak-ng/releases")
        print("  - ffmpeg: https://ffmpeg.org/download.html")
        return
    
    print(f"\n✅ All required tools available!")
    
    # Start TTS generation
    print(f"\n🚀 Starting TTS generation...")
    print("=" * 30)
    
    total_generated = 0
    total_skipped = 0 
    total_errors = 0
    
    start_time = time.time()
    
    try:
        # Step 1: Generate word audio
        print("\n🔤 STEP 1: Generating word audio...")
        print("-" * 35)
        
        sys.path.insert(0, str(Path(__file__).parent))
        from updated_word_tts import WordTTSGenerator
        
        word_gen = WordTTSGenerator(project_root)
        words = word_gen.read_words_csv()
        word_generated, word_skipped, word_errors = word_gen.generate_word_audio(words)
        
        total_generated += word_generated
        total_skipped += word_skipped
        total_errors += word_errors
        
        print(f"✅ Word audio complete: {word_generated} generated")
        
        # Step 2: Generate sentence audio
        print(f"\n💬 STEP 2: Generating sentence audio...")
        print("-" * 38)
        
        from updated_sentence_tts import SentenceTTSGenerator
        
        sentence_gen = SentenceTTSGenerator(project_root)
        sentences = sentence_gen.read_sentences_csv()
        sent_generated, sent_skipped, sent_errors = sentence_gen.generate_sentence_audio(sentences)
        
        total_generated += sent_generated
        total_skipped += sent_skipped
        total_errors += sent_errors
        
        print(f"✅ Sentence audio complete: {sent_generated} generated")
        
        # Step 3: Generate picture audio
        print(f"\n🖼️ STEP 3: Generating picture audio...")
        print("-" * 36)
        
        from updated_picture_tts import PictureTTSGenerator
        
        picture_gen = PictureTTSGenerator(project_root)
        pictures = picture_gen.read_pictures_csv()
        pic_generated, pic_skipped, pic_errors = picture_gen.generate_picture_audio(pictures)
        
        total_generated += pic_generated
        total_skipped += pic_skipped
        total_errors += pic_errors
        
        print(f"✅ Picture audio complete: {pic_generated} generated")
        
        # Final summary
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n🎉 TTS GENERATION COMPLETE!")
        print("=" * 35)
        print(f"📊 Overall Summary:")
        print(f"  ✅ Total generated: {total_generated} audio files")
        print(f"  ⏭️ Total skipped: {total_skipped} files (already existed)")
        print(f"  ❌ Total errors: {total_errors} files")
        print(f"  ⏱️ Total time: {duration:.1f} seconds")
        
        if total_generated > 0:
            print(f"\n📁 Audio files organized in proper batches:")
            print(f"  📂 Directory structure (properly batched):")
            print(f"     dist/languages/")
            print(f"     ├── zh/A1/")
            print(f"     │   ├── batch001/audio/ (w_001-w_042, sent_001-sent_050, pic_001-pic_010)")
            print(f"     │   ├── batch002/audio/ (sent_051-sent_100, pic_011-pic_012)")
            print(f"     │   ├── batch003/audio/ (sent_101-sent_150)")
            print(f"     │   ├── batch004/audio/ (sent_151-sent_200)")
            print(f"     │   └── batch005/audio/ (sent_201-sent_250)")
            print(f"     ├── zh/A2/")
            print(f"     │   ├── batch001/audio/ (w_043-w_084, sent_251-sent_300, pic_013-pic_022)")
            print(f"     │   ├── batch002/audio/ (sent_301-sent_350)")
            print(f"     │   ├── batch003/audio/ (sent_351-sent_400)")
            print(f"     │   ├── batch004/audio/ (sent_401-sent_450)")
            print(f"     │   └── batch005/audio/ (sent_451-sent_500)")
            print(f"     └── ... (continues for B1, B2, C1, C2)")
            print(f"  ")
            print(f"     shared/images/")
            print(f"     ├── batch001/pic_001.jpg, ..., pic_010.jpg (A1 first 10)")
            print(f"     ├── batch002/pic_011.jpg, pic_012.jpg (A1 remaining 2)")
            print(f"     ├── batch003/pic_013.jpg, ..., pic_022.jpg (A2 all 10)")
            print(f"     ├── batch004/pic_023.jpg, ..., pic_030.jpg (B1 all 8)")
            print(f"     ├── batch005/pic_031.jpg, ..., pic_038.jpg (B2 all 8)")
            print(f"     ├── batch006/pic_039.jpg, ..., pic_044.jpg (C1 all 6)")
            print(f"     └── batch007/pic_045.jpg, ..., pic_050.jpg (C2 all 6)")
            
            print(f"\n📊 Expected Batch Counts:")
            print(f"  • 6 Word batches (1 per difficulty, since 42 words < 50 per batch)")
            print(f"  • 30 Sentence batches (5 per difficulty × 6 difficulties)")
            print(f"  • 8 Picture batches (A1=2, A2=1, B1=1, B2=1, C1=1, C2=1)")
            
            print(f"\n🚀 Next steps:")
            print(f"  1. Upload audio files to your CDN")
            print(f"  2. Place image files in shared/images/batch[xxx]/ directories")
            print(f"  3. Test your app with complete audio content")
            
            if total_errors == 0:
                print(f"\n✅ Perfect! No errors during generation.")
            else:
                print(f"\n⚠️ {total_errors} files had errors - review logs above")
        else:
            print(f"\n⚠️ No audio files were generated. Check the logs above for issues.")
            
    except KeyboardInterrupt:
        print(f"\n⏹️ Generation interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        raise

if __name__ == "__main__":
    main()