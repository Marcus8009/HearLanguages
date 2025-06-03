#!/usr/bin/env python3
"""
Fake Sentence Generator for Language Learning App Testing
Creates 1500 sentences (250 words × 6 difficulties) using your existing words CSV
"""

import csv
import random
import time
from pathlib import Path
from collections import defaultdict

class FakeSentenceGenerator:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.csv_dir = self.base_dir / "csv"
        
        # Languages from your structure
        self.languages = {
            'zh': 'Chinese',
            'ja': 'Japanese', 
            'es': 'Spanish',
            'fr': 'French',
            'en': 'English'
        }
        
        # Difficulty levels
        self.difficulties = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        
        # Simple sentence patterns for each language
        self.sentence_patterns = {
            'en': [
                '{word} is good', '{word} very nice', 'I like {word}', 
                '{word} here now', 'big {word}', 'small {word}',
                'my {word}', 'your {word}', 'new {word}', 'old {word}'
            ],
            'zh': [
                '{word}很好', '{word}在这里', '我喜欢{word}', 
                '大{word}', '小{word}', '新{word}',
                '我的{word}', '你的{word}', '{word}很美', '{word}不错'
            ],
            'ja': [
                '{word}です', '{word}がいい', '{word}は大きい',
                '{word}は小さい', '{word}があります', '{word}を食べる',
                '私の{word}', 'あなたの{word}', '{word}は新しい', '{word}は古い'
            ],
            'es': [
                '{word} es bueno', '{word} muy bien', 'me gusta {word}',
                '{word} aquí ahora', 'gran {word}', 'pequeño {word}',
                'mi {word}', 'tu {word}', 'nuevo {word}', 'viejo {word}'
            ],
            'fr': [
                '{word} est bon', '{word} très bien', "j'aime {word}",
                '{word} ici maintenant', 'grand {word}', 'petit {word}',
                'mon {word}', 'votre {word}', 'nouveau {word}', 'vieux {word}'
            ]
        }
        
        # Transliteration patterns (for Chinese and Japanese)
        self.transliteration_patterns = {
            'zh': [
                '{tr} hěn hǎo', '{tr} zài zhèlǐ', 'wǒ xǐhuān {tr}',
                'dà {tr}', 'xiǎo {tr}', 'xīn {tr}',
                'wǒ de {tr}', 'nǐ de {tr}', '{tr} hěn měi', '{tr} bùcuò'
            ],
            'ja': [
                '{tr} desu', '{tr} ga ii', '{tr} wa ōkii',
                '{tr} wa chiisai', '{tr} ga arimasu', '{tr} wo taberu',
                'watashi no {tr}', 'anata no {tr}', '{tr} wa atarashii', '{tr} wa furui'
            ]
        }

    def read_words_csv(self) -> list:
        """Read the existing words CSV file"""
        words_file = self.csv_dir / "words_v1NEW.csv"
        
        if not words_file.exists():
            # Try alternative names
            for alt_name in ["words_v1.csv", "words_v1FULL.csv"]:
                alt_file = self.csv_dir / alt_name
                if alt_file.exists():
                    words_file = alt_file
                    break
            else:
                raise FileNotFoundError(f"Words CSV not found. Tried: {words_file}")
        
        print(f"📖 Reading words from: {words_file}")
        
        # Try different encodings
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(words_file, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    words = list(reader)
                    print(f"✅ Successfully read {len(words)} words with {encoding} encoding")
                    return words
            except UnicodeDecodeError:
                continue
        
        raise Exception(f"Could not read {words_file} with any encoding")

    def generate_sentence_for_word(self, word_data: dict, difficulty: str, sentence_index: int) -> dict:
        """Generate a fake sentence for a given word and difficulty"""
        word_id = word_data.get('word_id', '')
        
        # Create sentence ID
        sentence_id = f"sent_{sentence_index:03d}"
        
        # Get word text for each language
        word_texts = {}
        for lang in self.languages:
            if lang == 'en':
                word_texts[lang] = word_data.get('en_word', word_data.get('base_en', 'word'))
            else:
                word_texts[lang] = word_data.get(f'{lang}_word', f'{lang}_word')
        
        # Get transliterations
        word_translits = {}
        for lang in ['zh', 'ja']:
            word_translits[lang] = word_data.get(f'{lang}_tr', f'{lang}_tr')
        
        # Generate sentences for each language
        sentences = {}
        transliterations = {}
        
        for lang in self.languages:
            if lang in self.sentence_patterns:
                # Pick a random pattern
                pattern = random.choice(self.sentence_patterns[lang])
                sentences[lang] = pattern.format(word=word_texts[lang])
            else:
                # Fallback
                sentences[lang] = f"{word_texts[lang]} good"
        
        # Generate transliterations for Chinese and Japanese
        for lang in ['zh', 'ja']:
            if lang in self.transliteration_patterns and lang in word_translits:
                pattern = random.choice(self.transliteration_patterns[lang])
                transliterations[lang] = pattern.format(tr=word_translits[lang])
        
        # Create the sentence row
        sentence_row = {
            'schema_version': '1',
            'sentence_id': sentence_id,
            'word_id': word_id,
            'difficulty': difficulty,
            'base_en': sentences['en'],
            'base_audio_ms': random.randint(800, 2000),  # Random audio length
        }
        
        # Add language-specific sentences
        for lang in self.languages:
            sentence_row[f'{lang}_sentence'] = sentences[lang]
        
        # Add transliterations
        for lang in ['zh', 'ja']:
            if lang in transliterations:
                sentence_row[f'{lang}_tr'] = transliterations[lang]
            else:
                sentence_row[f'{lang}_tr'] = ''
        
        return sentence_row

    def generate_sentences_csv(self, words: list):
        """Generate the complete sentences CSV with all difficulties"""
        print(f"\n🏗️ Generating sentences for {len(words)} words across {len(self.difficulties)} difficulties")
        
        all_sentences = []
        sentence_counter = 1
        
        # Generate sentences for each difficulty level
        for difficulty in self.difficulties:
            print(f"  📚 Generating {difficulty} level sentences...")
            
            for word_data in words:
                sentence = self.generate_sentence_for_word(word_data, difficulty, sentence_counter)
                all_sentences.append(sentence)
                sentence_counter += 1
        
        print(f"✅ Generated {len(all_sentences)} total sentences")
        
        # Write to CSV
        output_file = self.csv_dir / "batch01" / "sentences_batch01_v1NEW.csv"
        output_file.parent.mkdir(exist_ok=True)
        
        # Define CSV headers
        headers = [
            'schema_version', 'sentence_id', 'word_id', 'difficulty', 
            'base_en', 'base_audio_ms'
        ]
        
        # Add language-specific headers
        for lang in self.languages:
            headers.append(f'{lang}_sentence')
        
        # Add transliteration headers
        for lang in ['zh', 'ja']:
            headers.append(f'{lang}_tr')
        
        print(f"📝 Writing sentences to: {output_file}")
        
        with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            
            for sentence in all_sentences:
                writer.writerow(sentence)
        
        print(f"✅ Sentences CSV created successfully!")
        
        # Generate summary
        self.print_summary(all_sentences)
        
        return all_sentences

    def print_summary(self, sentences: list):
        """Print a summary of generated sentences"""
        print(f"\n📊 Generation Summary:")
        print(f"  Total sentences: {len(sentences)}")
        
        # Count by difficulty
        difficulty_counts = {}
        for sentence in sentences:
            diff = sentence.get('difficulty', 'Unknown')
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
        
        print(f"  Sentences by difficulty:")
        for diff, count in difficulty_counts.items():
            print(f"    {diff}: {count} sentences")
        
        # Show some examples
        print(f"\n🔍 Sample sentences:")
        for i, sentence in enumerate(sentences[:3]):
            print(f"  {i+1}. {sentence['sentence_id']} ({sentence['difficulty']}):")
            print(f"     EN: {sentence.get('en_sentence', '')}")
            print(f"     ZH: {sentence.get('zh_sentence', '')} ({sentence.get('zh_tr', '')})")
            print(f"     JA: {sentence.get('ja_sentence', '')} ({sentence.get('ja_tr', '')})")
            print()

    def validate_words_structure(self, words: list) -> bool:
        """Validate that words CSV has the expected structure"""
        if not words:
            print("❌ No words found in CSV")
            return False
        
        required_columns = ['word_id', 'base_en']
        expected_lang_columns = []
        
        # Check for language-specific columns
        for lang in self.languages:
            if lang == 'en':
                expected_lang_columns.append('en_word')
            else:
                expected_lang_columns.append(f'{lang}_word')
        
        # Check first row for structure
        first_word = words[0]
        missing_required = [col for col in required_columns if col not in first_word]
        missing_lang = [col for col in expected_lang_columns if col not in first_word]
        
        if missing_required:
            print(f"❌ Missing required columns: {missing_required}")
            return False
        
        if missing_lang:
            print(f"⚠️ Missing language columns: {missing_lang}")
            print("   Will use fallback values for missing languages")
        
        # Check for word_id format
        sample_ids = [w.get('word_id', '') for w in words[:5]]
        print(f"📋 Sample word IDs: {sample_ids}")
        
        return True

    def run(self):
        """Main execution function"""
        print("🚀 Fake Sentence Generator for Language Learning App")
        print("=" * 55)
        
        try:
            # Read words CSV
            words = self.read_words_csv()
            
            # Validate structure
            if not self.validate_words_structure(words):
                print("❌ Words CSV validation failed")
                return
            
            print(f"📊 Found {len(words)} words in CSV")
            
            # Show word distribution by difficulty if available
            if 'difficulty' in words[0]:
                diff_dist = {}
                for word in words:
                    diff = word.get('difficulty', 'Unknown')
                    diff_dist[diff] = diff_dist.get(diff, 0) + 1
                
                print(f"📈 Words by difficulty: {diff_dist}")
            
            # Generate sentences
            sentences = self.generate_sentences_csv(words)
            
            print(f"\n🎉 Successfully generated {len(sentences)} fake sentences!")
            print(f"📁 Output file: {self.csv_dir}/batch01/sentences_batch01_v1NEW.csv")
            print(f"\n✅ Ready for app testing!")
            
        except Exception as e:
            print(f"\n💥 Error: {e}")
            raise

def main():
    import sys
    
    # Get project root directory
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = Path(__file__).parent.parent
    
    generator = FakeSentenceGenerator(project_root)
    generator.run()

if __name__ == "__main__":
    main()