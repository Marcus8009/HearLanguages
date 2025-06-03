#!/usr/bin/env python3
"""
Master Test Content Generator
Generates both sentences and pictures CSVs for testing the language learning app
"""

import sys
from pathlib import Path

# Add the scripts directory to Python path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

def main():
    print("🎯 Language Learning App - Test Content Generator")
    print("=" * 55)
    print("This will generate fake sentences and pictures for testing your app")
    print("Using your existing 250-word vocabulary")
    print()
    
    project_root = Path(__file__).parent.parent
    
    try:
        # Step 1: Generate sentences
        print("📝 STEP 1: Generating fake sentences...")
        print("-" * 40)
        
        from fake_sentence_generator import FakeSentenceGenerator
        sentence_gen = FakeSentenceGenerator(project_root)
        sentences = sentence_gen.generate_sentences_csv(sentence_gen.read_words_csv())
        
        print(f"✅ Generated {len(sentences)} sentences")
        print()
        
        # Step 2: Generate pictures
        print("🖼️ STEP 2: Generating fake picture descriptions...")
        print("-" * 50)
        
        from fake_picture_generator import FakePictureGenerator
        picture_gen = FakePictureGenerator(project_root)
        pictures = picture_gen.generate_pictures_csv(picture_gen.read_sentences_csv())
        
        print(f"✅ Generated {len(pictures)} picture descriptions")
        print()
        
        # Summary
        print("🎉 TEST CONTENT GENERATION COMPLETE!")
        print("=" * 40)
        print(f"📊 Summary:")
        print(f"  • Words: 250 (from your existing CSV)")
        print(f"  • Sentences: {len(sentences)} (250 words × 6 difficulties)")
        print(f"  • Pictures: {len(pictures)} (distributed across difficulties)")
        print()
        print(f"📁 Generated files:")
        print(f"  • {project_root}/csv/batch01/sentences_batch01_v1NEW.csv")
        print(f"  • {project_root}/csv/batch01/pictures_batch01_v1NEW.csv")
        print()
        print("🚀 Next steps:")
        print("  1. Your CSV files are now ready for testing")
        print("  2. Run your TTS scripts to generate audio files")
        print("  3. Test your app with this fake content")
        print("  4. Replace with real content when ready")
        print()
        print("✅ Ready to test your language learning app!")
        
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}")
        print("\n🔍 Please make sure your words CSV file exists in one of these locations:")
        print(f"  • {project_root}/csv/words_v1NEW.csv")
        print(f"  • {project_root}/csv/words_v1.csv")
        print(f"  • {project_root}/csv/words_v1FULL.csv")
        
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        print("\n🛠️ Debug info:")
        print(f"  Project root: {project_root}")
        print(f"  Scripts directory: {scripts_dir}")
        raise

if __name__ == "__main__":
    main()