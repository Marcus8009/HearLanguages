#!/usr/bin/env python3
"""
Advanced CSV Splitter for Language Learning Architecture
- Handles your exact CSV structure from the uploaded files
- Validates data integrity
- Creates proper manifest files
- Generates directory structure
- Creates audio file mapping
"""

import csv
import json
import os
import shutil
import hashlib
import time
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional

class LanguageLearningCSVSplitter:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.old_csv_dir = self.base_dir / "csv"
        self.output_dir = self.base_dir / "new_structure"
        
        # Configuration based on your uploaded CSVs
        self.languages = ['zh', 'ja', 'es', 'fr', 'en']
        self.difficulties = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        
        # Batch sizes for development phase (250 words, 50 pictures)
        self.words_per_batch = 50
        self.sentences_per_batch = 50
        self.pictures_per_batch = 10
        
        # Stats tracking
        self.stats = {
            'words_processed': 0,
            'sentences_processed': 0,
            'pictures_processed': 0,
            'batches_created': 0,
            'errors': [],
            'warnings': []
        }

    def read_csv_with_encoding(self, file_path: Path) -> List[Dict[str, Any]]:
        """Try multiple encodings to read CSV file"""
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    print(f"✅ Successfully read {file_path.name} with {encoding} encoding ({len(rows)} rows)")
                    return rows
            except UnicodeDecodeError:
                continue
        
        raise Exception(f"❌ Could not read {file_path} with any encoding")

    def validate_csv_structure(self, data: List[Dict], expected_columns: List[str], csv_type: str) -> bool:
        """Validate CSV structure matches expectations"""
        if not data:
            self.stats['errors'].append(f"Empty {csv_type} CSV")
            return False
        
        actual_columns = set(data[0].keys())
        expected_columns_set = set(expected_columns)
        
        missing_columns = expected_columns_set - actual_columns
        extra_columns = actual_columns - expected_columns_set
        
        if missing_columns:
            self.stats['errors'].append(f"{csv_type} CSV missing columns: {missing_columns}")
            return False
        
        if extra_columns:
            self.stats['warnings'].append(f"{csv_type} CSV has extra columns: {extra_columns}")
        
        # Validate required fields are not empty
        required_fields = {
            'words': ['word_id', 'base_en', 'difficulty'],
            'sentences': ['sentence_id', 'word_id', 'difficulty'],
            'pictures': ['picture_id', 'file', 'difficulty']
        }
        
        if csv_type in required_fields:
            for row in data[:5]:  # Check first 5 rows
                for field in required_fields[csv_type]:
                    if not row.get(field, '').strip():
                        self.stats['errors'].append(f"{csv_type} CSV has empty required field '{field}' in row: {row}")
                        return False
        
        print(f"✅ {csv_type} CSV structure validated successfully")
        return True

    def analyze_data_distribution(self, data: List[Dict], data_type: str):
        """Analyze data distribution by difficulty"""
        difficulty_counts = Counter(row.get('difficulty', 'Unknown') for row in data)
        
        print(f"\n📊 {data_type} Distribution by Difficulty:")
        for difficulty, count in sorted(difficulty_counts.items()):
            print(f"  {difficulty}: {count} items")
        
        # Check for potential issues
        if 'Unknown' in difficulty_counts:
            self.stats['warnings'].append(f"{data_type} has {difficulty_counts['Unknown']} items with unknown difficulty")
        
        return difficulty_counts

    def create_directory_structure(self):
        """Create the new directory structure"""
        print(f"\n🏗️ Creating directory structure in {self.output_dir}")
        
        # Remove existing output directory
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)
        
        for lang in self.languages:
            for difficulty in self.difficulties:
                # Create batch directories (batch001 to batch005 for development)
                for batch_num in range(1, 6):
                    batch_name = f"batch{batch_num:03d}"
                    
                    # Create content directory
                    content_dir = self.output_dir / "languages" / lang / difficulty / batch_name / "content"
                    content_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Create audio directories
                    audio_base = self.output_dir / "languages" / lang / difficulty / batch_name / "audio"
                    (audio_base / "words").mkdir(parents=True, exist_ok=True)
                    (audio_base / "sentences").mkdir(parents=True, exist_ok=True)
                    (audio_base / "pictures").mkdir(parents=True, exist_ok=True)
        
        # Create shared images directory
        shared_images_dir = self.output_dir / "languages" / "shared" / "images"
        for batch_num in range(1, 6):
            batch_name = f"batch{batch_num:03d}"
            (shared_images_dir / batch_name).mkdir(parents=True, exist_ok=True)
        
        print(f"✅ Directory structure created")

    def split_words_csv(self, words_data: List[Dict]):
        """Split words CSV by language, difficulty, and batch"""
        print(f"\n🔤 Processing {len(words_data)} words")
        
        # Validate structure
        expected_columns = ['schema_version', 'word_id', 'base_en', 'pos', 'difficulty', 'created_utc']
        expected_columns.extend([f'{lang}_word' for lang in self.languages if lang != 'en'])
        expected_columns.extend([f'{lang}_tr' for lang in ['zh', 'ja']])
        expected_columns.append('en_word')
        
        if not self.validate_csv_structure(words_data, expected_columns, 'words'):
            return
        
        # Analyze distribution
        self.analyze_data_distribution(words_data, 'Words')
        
        # Group by difficulty
        words_by_difficulty = defaultdict(list)
        for word in words_data:
            difficulty = word.get('difficulty', 'A1')
            words_by_difficulty[difficulty].append(word)
        
        for difficulty in self.difficulties:
            words_for_difficulty = words_by_difficulty[difficulty]
            if not words_for_difficulty:
                continue
                
            print(f"  📦 Processing {len(words_for_difficulty)} words for {difficulty}")
            
            # Split into batches
            for batch_idx, start_idx in enumerate(range(0, len(words_for_difficulty), self.words_per_batch)):
                batch_num = batch_idx + 1
                batch_name = f"batch{batch_num:03d}"
                batch_words = words_for_difficulty[start_idx:start_idx + self.words_per_batch]
                
                if not batch_words:
                    continue
                
                self.stats['batches_created'] += 1
                self.stats['words_processed'] += len(batch_words)
                
                # Create CSV for each language
                for lang in self.languages:
                    self.create_words_csv_for_language(batch_words, lang, difficulty, batch_name)

    def create_words_csv_for_language(self, words: List[Dict], lang: str, difficulty: str, batch: str):
        """Create words CSV for a specific language"""
        output_path = self.output_dir / "languages" / lang / difficulty / batch / "content" / "words.csv"
        
        # Prepare headers for this language
        headers = ['schema_version', 'word_id', 'base_en', 'pos', 'difficulty', 'created_utc']
        
        if lang == 'zh':
            headers.extend(['zh_word', 'zh_tr'])
        elif lang == 'ja':
            headers.extend(['ja_word', 'ja_tr'])
        elif lang in ['es', 'fr']:
            headers.append(f'{lang}_word')
        elif lang == 'en':
            headers.append('en_word')
        
        with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            
            for word in words:
                row = {
                    'schema_version': word.get('schema_version', '1'),
                    'word_id': word.get('word_id', ''),
                    'base_en': word.get('base_en', ''),
                    'pos': word.get('pos', ''),
                    'difficulty': difficulty,
                    'created_utc': word.get('created_utc', '')
                }
                
                # Add language-specific data
                if lang == 'zh':
                    row['zh_word'] = word.get('zh_word', '')
                    row['zh_tr'] = word.get('zh_tr', '')
                elif lang == 'ja':
                    row['ja_word'] = word.get('ja_word', '')
                    row['ja_tr'] = word.get('ja_tr', '')
                elif lang in ['es', 'fr']:
                    row[f'{lang}_word'] = word.get(f'{lang}_word', '')
                elif lang == 'en':
                    row['en_word'] = word.get('en_word', word.get('base_en', ''))
                
                writer.writerow(row)

    def split_sentences_csv(self, sentences_data: List[Dict]):
        """Split sentences CSV by language, difficulty, and batch"""
        print(f"\n💬 Processing {len(sentences_data)} sentences")
        
        # Validate structure
        expected_columns = ['schema_version', 'sentence_id', 'word_id', 'difficulty', 'base_en', 'base_audio_ms']
        expected_columns.extend([f'{lang}_sentence' for lang in self.languages])
        expected_columns.extend([f'{lang}_tr' for lang in ['zh', 'ja']])
        
        if not self.validate_csv_structure(sentences_data, expected_columns, 'sentences'):
            return
        
        # Analyze distribution
        self.analyze_data_distribution(sentences_data, 'Sentences')
        
        # Group by difficulty
        sentences_by_difficulty = defaultdict(list)
        for sentence in sentences_data:
            difficulty = sentence.get('difficulty', 'A1')
            sentences_by_difficulty[difficulty].append(sentence)
        
        for difficulty in self.difficulties:
            sentences_for_difficulty = sentences_by_difficulty[difficulty]
            if not sentences_for_difficulty:
                continue
                
            print(f"  📦 Processing {len(sentences_for_difficulty)} sentences for {difficulty}")
            
            # Split into batches
            for batch_idx, start_idx in enumerate(range(0, len(sentences_for_difficulty), self.sentences_per_batch)):
                batch_num = batch_idx + 1
                batch_name = f"batch{batch_num:03d}"
                batch_sentences = sentences_for_difficulty[start_idx:start_idx + self.sentences_per_batch]
                
                if not batch_sentences:
                    continue
                
                self.stats['sentences_processed'] += len(batch_sentences)
                
                # Create CSV for each language
                for lang in self.languages:
                    self.create_sentences_csv_for_language(batch_sentences, lang, difficulty, batch_name)

    def create_sentences_csv_for_language(self, sentences: List[Dict], lang: str, difficulty: str, batch: str):
        """Create sentences CSV for a specific language"""
        output_path = self.output_dir / "languages" / lang / difficulty / batch / "content" / "sentences.csv"
        
        # Prepare headers
        headers = ['schema_version', 'sentence_id', 'word_id', 'difficulty', 'base_en', 'base_audio_ms']
        
        if lang == 'zh':
            headers.extend(['zh_sentence', 'zh_tr'])
        elif lang == 'ja':
            headers.extend(['ja_sentence', 'ja_tr'])
        elif lang in ['es', 'fr', 'en']:
            headers.append(f'{lang}_sentence')
        
        with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            
            for sentence in sentences:
                row = {
                    'schema_version': sentence.get('schema_version', '1'),
                    'sentence_id': sentence.get('sentence_id', ''),
                    'word_id': sentence.get('word_id', ''),
                    'difficulty': difficulty,
                    'base_en': sentence.get('base_en', ''),
                    'base_audio_ms': sentence.get('base_audio_ms', '800')
                }
                
                # Add language-specific data
                if lang == 'zh':
                    row['zh_sentence'] = sentence.get('zh_sentence', '')
                    row['zh_tr'] = sentence.get('zh_tr', '')
                elif lang == 'ja':
                    row['ja_sentence'] = sentence.get('ja_sentence', '')
                    row['ja_tr'] = sentence.get('ja_tr', '')
                elif lang in ['es', 'fr', 'en']:
                    row[f'{lang}_sentence'] = sentence.get(f'{lang}_sentence', '')
                
                writer.writerow(row)

    def split_pictures_csv(self, pictures_data: List[Dict]):
        """Split pictures CSV by language, difficulty, and batch"""
        print(f"\n🖼️ Processing {len(pictures_data)} pictures")
        
        # Validate structure
        expected_columns = ['schema_version', 'picture_id', 'file', 'display_ms', 'difficulty']
        expected_columns.extend([f'{lang}_sentence' for lang in self.languages])
        expected_columns.extend([f'{lang}_tr' for lang in ['zh', 'ja']])
        
        if not self.validate_csv_structure(pictures_data, expected_columns, 'pictures'):
            return
        
        # Analyze distribution
        self.analyze_data_distribution(pictures_data, 'Pictures')
        
        # Group by difficulty
        pictures_by_difficulty = defaultdict(list)
        for picture in pictures_data:
            difficulty = picture.get('difficulty', 'A1')
            pictures_by_difficulty[difficulty].append(picture)
        
        for difficulty in self.difficulties:
            pictures_for_difficulty = pictures_by_difficulty[difficulty]
            if not pictures_for_difficulty:
                continue
                
            print(f"  📦 Processing {len(pictures_for_difficulty)} pictures for {difficulty}")
            
            # Split into batches
            for batch_idx, start_idx in enumerate(range(0, len(pictures_for_difficulty), self.pictures_per_batch)):
                batch_num = batch_idx + 1
                batch_name = f"batch{batch_num:03d}"
                batch_pictures = pictures_for_difficulty[start_idx:start_idx + self.pictures_per_batch]
                
                if not batch_pictures:
                    continue
                
                self.stats['pictures_processed'] += len(batch_pictures)
                
                # Create CSV for each language
                for lang in self.languages:
                    self.create_pictures_csv_for_language(batch_pictures, lang, difficulty, batch_name)

    def create_pictures_csv_for_language(self, pictures: List[Dict], lang: str, difficulty: str, batch: str):
        """Create pictures CSV for a specific language"""
        output_path = self.output_dir / "languages" / lang / difficulty / batch / "content" / "pictures.csv"
        
        # Prepare headers
        headers = ['schema_version', 'picture_id', 'file', 'display_ms', 'difficulty']
        
        if lang == 'zh':
            headers.extend(['zh_sentence', 'zh_tr'])
        elif lang == 'ja':
            headers.extend(['ja_sentence', 'ja_tr'])
        elif lang in ['es', 'fr', 'en']:
            headers.append(f'{lang}_sentence')
        
        with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            
            for picture in pictures:
                row = {
                    'schema_version': picture.get('schema_version', '1'),
                    'picture_id': picture.get('picture_id', ''),
                    'file': picture.get('file', ''),
                    'display_ms': picture.get('display_ms', '10000'),
                    'difficulty': difficulty
                }
                
                # Add language-specific data
                if lang == 'zh':
                    row['zh_sentence'] = picture.get('zh_sentence', '')
                    row['zh_tr'] = picture.get('zh_tr', '')
                elif lang == 'ja':
                    row['ja_sentence'] = picture.get('ja_sentence', '')
                    row['ja_tr'] = picture.get('ja_tr', '')
                elif lang in ['es', 'fr', 'en']:
                    row[f'{lang}_sentence'] = picture.get(f'{lang}_sentence', '')
                
                writer.writerow(row)

    def create_manifests(self):
        """Create manifest files for the new structure"""
        print(f"\n📋 Creating manifest files...")
        
        languages_dir = self.output_dir / "languages"
        
        # Root language index
        root_manifest = {
            "version": "1.0",
            "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "languages": []
        }
        
        lang_names = {
            'zh': {'name': 'Chinese', 'native': '中文'},
            'ja': {'name': 'Japanese', 'native': '日本語'},
            'es': {'name': 'Spanish', 'native': 'Español'},
            'fr': {'name': 'French', 'native': 'Français'},
            'en': {'name': 'English', 'native': 'English'}
        }
        
        for lang in self.languages:
            root_manifest["languages"].append({
                "code": lang,
                "name": lang_names[lang]["name"],
                "native": lang_names[lang]["native"]
            })
        
        # Write root manifest
        with open(languages_dir / "index.json", 'w', encoding='utf-8') as f:
            json.dump(root_manifest, f, indent=2, ensure_ascii=False)
        
        # Language-specific manifests
        for lang in self.languages:
            lang_path = languages_dir / lang
            
            if not lang_path.exists():
                continue
            
            lang_manifest = {
                "language": lang,
                "version": "1.0",
                "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "difficulties": self.difficulties,
                "batches": {}
            }
            
            for difficulty in self.difficulties:
                difficulty_path = lang_path / difficulty
                if difficulty_path.exists():
                    batches = [d.name for d in difficulty_path.iterdir() 
                              if d.is_dir() and d.name.startswith('batch')]
                    if batches:
                        lang_manifest["batches"][difficulty] = sorted(batches)
            
            # Write language manifest
            with open(lang_path / "index.json", 'w', encoding='utf-8') as f:
                json.dump(lang_manifest, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Manifest files created")

    def generate_stats_report(self):
        """Generate a comprehensive stats report"""
        print(f"\n📊 Processing Statistics:")
        print(f"  Words processed: {self.stats['words_processed']}")
        print(f"  Sentences processed: {self.stats['sentences_processed']}")
        print(f"  Pictures processed: {self.stats['pictures_processed']}")
        print(f"  Batches created: {self.stats['batches_created']}")
        
        if self.stats['warnings']:
            print(f"\n⚠️ Warnings ({len(self.stats['warnings'])}):")
            for warning in self.stats['warnings']:
                print(f"  - {warning}")
        
        if self.stats['errors']:
            print(f"\n❌ Errors ({len(self.stats['errors'])}):")
            for error in self.stats['errors']:
                print(f"  - {error}")
        
        # Save detailed report
        report = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "stats": self.stats,
            "configuration": {
                "languages": self.languages,
                "difficulties": self.difficulties,
                "words_per_batch": self.words_per_batch,
                "sentences_per_batch": self.sentences_per_batch,
                "pictures_per_batch": self.pictures_per_batch,
            }
        }
        
        report_path = self.output_dir / "processing_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed report saved to: {report_path}")

    def run(self):
        """Main processing function"""
        print("🚀 Advanced CSV Splitter for Language Learning Architecture")
        print("=" * 60)
        
        # Check input files
        words_file = self.old_csv_dir / "words_v1NEW.csv"
        sentences_file = self.old_csv_dir / "batch01" / "sentences_batch01_v1NEW.csv"
        pictures_file = self.old_csv_dir / "batch01" / "pictures_batch01_v1NEW.csv"
        
        if not words_file.exists():
            print(f"❌ Words file not found: {words_file}")
            return
        
        if not sentences_file.exists():
            print(f"❌ Sentences file not found: {sentences_file}")
            return
        
        if not pictures_file.exists():
            print(f"❌ Pictures file not found: {pictures_file}")
            return
        
        try:
            # Create directory structure
            self.create_directory_structure()
            
            # Process CSV files
            words_data = self.read_csv_with_encoding(words_file)
            self.split_words_csv(words_data)
            
            sentences_data = self.read_csv_with_encoding(sentences_file)
            self.split_sentences_csv(sentences_data)
            
            pictures_data = self.read_csv_with_encoding(pictures_file)
            self.split_pictures_csv(pictures_data)
            
            # Create manifest files
            self.create_manifests()
            
            # Generate report
            self.generate_stats_report()
            
            print(f"\n🎉 CSV splitting completed successfully!")
            print(f"📁 New structure created in: {self.output_dir}")
            
            if not self.stats['errors']:
                print("\n✅ No errors detected - ready for content generation!")
            else:
                print(f"\n⚠️ {len(self.stats['errors'])} errors need to be addressed")
                
        except Exception as e:
            print(f"\n💥 Fatal error: {e}")
            self.stats['errors'].append(str(e))
            self.generate_stats_report()

def main():
    import sys
    
    # Get project root directory
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = Path(__file__).parent.parent
    
    splitter = LanguageLearningCSVSplitter(project_root)
    splitter.run()

if __name__ == "__main__":
    main()