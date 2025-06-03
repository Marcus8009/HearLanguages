#!/usr/bin/env python3
"""
Fake Picture CSV Generator for Language Learning App Testing
Creates picture descriptions using existing sentence data
"""

import csv
import random
from pathlib import Path

class FakePictureGenerator:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.csv_dir = self.base_dir / "csv"
        
        # Languages from your structure
        self.languages = ['zh', 'ja', 'es', 'fr', 'en']
        
        # Difficulty levels
        self.difficulties = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        
        # Picture descriptions per difficulty (total 50 pictures across all difficulties)
        self.pictures_per_difficulty = {
            'A1': 12,  # Most pictures for beginner level
            'A2': 10,
            'B1': 8,
            'B2': 8,
            'C1': 6,
            'C2': 6
        }

    def read_sentences_csv(self) -> list:
        """Read the generated sentences CSV"""
        sentences_file = self.csv_dir / "batch01" / "sentences_batch01_v1NEW.csv"
        
        if not sentences_file.exists():
            raise FileNotFoundError(f"Sentences CSV not found: {sentences_file}")
        
        print(f"📖 Reading sentences from: {sentences_file}")
        
        # Try different encodings
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(sentences_file, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    sentences = list(reader)
                    print(f"✅ Successfully read {len(sentences)} sentences with {encoding} encoding")
                    return sentences
            except UnicodeDecodeError:
                continue
        
        raise Exception(f"Could not read {sentences_file} with any encoding")

    def generate_pictures_csv(self, sentences: list):
        """Generate fake picture CSV based on sentences"""
        print(f"\n🖼️ Generating picture descriptions from {len(sentences)} sentences")
        
        # Group sentences by difficulty
        sentences_by_difficulty = {}
        for sentence in sentences:
            diff = sentence.get('difficulty', 'A1')
            if diff not in sentences_by_difficulty:
                sentences_by_difficulty[diff] = []
            sentences_by_difficulty[diff].append(sentence)
        
        all_pictures = []
        picture_counter = 1
        
        # Generate pictures for each difficulty
        for difficulty in self.difficulties:
            num_pictures = self.pictures_per_difficulty.get(difficulty, 8)
            available_sentences = sentences_by_difficulty.get(difficulty, [])
            
            if not available_sentences:
                print(f"⚠️ No sentences found for {difficulty}, skipping pictures")
                continue
            
            print(f"  📚 Generating {num_pictures} pictures for {difficulty} level...")
            
            # Randomly select sentences for pictures
            selected_sentences = random.sample(
                available_sentences, 
                min(num_pictures, len(available_sentences))
            )
            
            for sentence in selected_sentences:
                picture_id = f"pic_{picture_counter:03d}"
                picture_file = f"{picture_id}.jpg"
                
                picture_row = {
                    'schema_version': '1',
                    'picture_id': picture_id,
                    'file': picture_file,
                    'display_ms': random.choice([8000, 10000, 12000]),  # 8-12 seconds
                    'difficulty': difficulty,
                }
                
                # Copy sentence data for each language
                for lang in self.languages:
                    sentence_key = f'{lang}_sentence'
                    if sentence_key in sentence:
                        picture_row[sentence_key] = sentence[sentence_key]
                    else:
                        picture_row[sentence_key] = ''
                
                # Copy transliterations
                for lang in ['zh', 'ja']:
                    tr_key = f'{lang}_tr'
                    if tr_key in sentence:
                        picture_row[tr_key] = sentence[tr_key]
                    else:
                        picture_row[tr_key] = ''
                
                all_pictures.append(picture_row)
                picture_counter += 1
        
        print(f"✅ Generated {len(all_pictures)} picture descriptions")
        
        # Write to CSV
        output_file = self.csv_dir / "batch01" / "pictures_batch01_v1NEW.csv"
        output_file.parent.mkdir(exist_ok=True)
        
        # Define CSV headers
        headers = [
            'schema_version', 'picture_id', 'file', 'display_ms', 'difficulty'
        ]
        
        # Add language-specific headers
        for lang in self.languages:
            headers.append(f'{lang}_sentence')
        
        # Add transliteration headers
        for lang in ['zh', 'ja']:
            headers.append(f'{lang}_tr')
        
        print(f"📝 Writing pictures to: {output_file}")
        
        with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            
            for picture in all_pictures:
                writer.writerow(picture)
        
        print(f"✅ Pictures CSV created successfully!")
        
        # Generate summary
        self.print_summary(all_pictures)
        
        return all_pictures

    def print_summary(self, pictures: list):
        """Print a summary of generated pictures"""
        print(f"\n📊 Picture Generation Summary:")
        print(f"  Total pictures: {len(pictures)}")
        
        # Count by difficulty
        difficulty_counts = {}
        for picture in pictures:
            diff = picture.get('difficulty', 'Unknown')
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
        
        print(f"  Pictures by difficulty:")
        for diff, count in difficulty_counts.items():
            print(f"    {diff}: {count} pictures")
        
        # Show some examples
        print(f"\n🔍 Sample picture descriptions:")
        for i, picture in enumerate(pictures[:3]):
            print(f"  {i+1}. {picture['picture_id']} ({picture['difficulty']}) - {picture['file']}:")
            print(f"     EN: {picture.get('en_sentence', '')}")
            print(f"     ZH: {picture.get('zh_sentence', '')} ({picture.get('zh_tr', '')})")
            print(f"     Display: {picture.get('display_ms', 0)}ms")
            print()

    def run(self):
        """Main execution function"""
        print("🚀 Fake Picture Generator for Language Learning App")
        print("=" * 52)
        
        try:
            # Read sentences CSV
            sentences = self.read_sentences_csv()
            
            # Generate pictures
            pictures = self.generate_pictures_csv(sentences)
            
            print(f"\n🎉 Successfully generated {len(pictures)} picture descriptions!")
            print(f"📁 Output file: {self.csv_dir}/batch01/pictures_batch01_v1NEW.csv")
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
    
    generator = FakePictureGenerator(project_root)
    generator.run()

if __name__ == "__main__":
    main()