#!/usr/bin/env python3
"""
Generate hierarchical manifests for scalable language learning content.
Replaces the single massive manifest with a 3-tier system:
1. Root manifest (metadata only)
2. Language manifests (per language)  
3. Batch manifests (actual file URLs)
"""

import pathlib
import hashlib
import json
import time
import csv
from collections import defaultdict

SCHEMA_VERSION = 3

# Project root is one level above this script's parent
root = pathlib.Path(__file__).resolve().parent.parent
dist = root / "dist"
csv_dir = root / "csv"

def get_language_name(code):
    """Convert language code to readable name"""
    names = {
        'en': 'English',
        'ja': 'Japanese', 
        'es': 'Spanish',
        'fr': 'French',
        'zh': 'Chinese',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi'
    }
    return names.get(code, code.upper())

def read_csv_files():
    """Read CSV files to understand content structure (keeping your existing logic)"""
    content_info = {
        'difficulties': set(),
        'word_count_by_difficulty': {},
        'sentence_count_by_difficulty': {},
        'picture_count_by_difficulty': {}
    }
    
    # Read words CSV
    words_csv = csv_dir / "words_v1NEW.csv"
    if words_csv.exists():
        print(f"  📄 Reading {words_csv.name}")
        with open(words_csv, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                difficulty = row.get('difficulty', 'A1')
                content_info['difficulties'].add(difficulty)
                content_info['word_count_by_difficulty'][difficulty] = \
                    content_info['word_count_by_difficulty'].get(difficulty, 0) + 1
    
    # Read sentences CSV
    sentences_csv = csv_dir / "batch01" / "sentences_batch01_v1NEW.csv"
    if sentences_csv.exists():
        print(f"  📄 Reading {sentences_csv.name}")
        with open(sentences_csv, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                difficulty = row.get('difficulty', 'A1')
                content_info['difficulties'].add(difficulty)
                content_info['sentence_count_by_difficulty'][difficulty] = \
                    content_info['sentence_count_by_difficulty'].get(difficulty, 0) + 1
    
    # Read pictures CSV
    pictures_csv = csv_dir / "batch01" / "pictures_batch01_v1NEW.csv"
    if pictures_csv.exists():
        print(f"  📄 Reading {pictures_csv.name}")
        with open(pictures_csv, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                difficulty = row.get('difficulty', 'A1')
                content_info['difficulties'].add(difficulty)
                content_info['picture_count_by_difficulty'][difficulty] = \
                    content_info['picture_count_by_difficulty'].get(difficulty, 0) + 1
    
    return content_info

def generate_hierarchical_manifests():
    """Generate the new 3-tier hierarchical manifest system"""
    
    print("🚀 Hierarchical Content Manifest Generator v3")
    print("=" * 50)
    
    # Step 0: Read CSV files for context
    print("🔍 Reading CSV files for content structure...")
    csv_content_info = read_csv_files()
    print(f"📊 CSV Analysis: {sorted(csv_content_info['difficulties'])} difficulties found")
    for diff in sorted(csv_content_info['difficulties']):
        words = csv_content_info['word_count_by_difficulty'].get(diff, 0)
        sentences = csv_content_info['sentence_count_by_difficulty'].get(diff, 0)
        pictures = csv_content_info['picture_count_by_difficulty'].get(diff, 0)
        print(f"  {diff}: {words} words, {sentences} sentences, {pictures} pictures")
    
    # Create manifest directories
    manifest_dir = dist / "manifests"
    languages_dir = manifest_dir / "languages"
    batches_dir = manifest_dir / "batches"
    
    for dir_path in [manifest_dir, languages_dir, batches_dir]:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created directory: {dir_path}")
    
    # Step 1: Scan all generated audio files and organize by language
    print("\n🔍 Scanning generated audio files...")
    content_by_language = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    language_info = defaultdict(lambda: {
        'difficulties': set(),
        'content_counts': defaultdict(lambda: defaultdict(int))
    })
    
    total_files_scanned = 0
    
    # Scan audio files in the languages directory
    languages_dir_path = dist / "languages"
    if languages_dir_path.exists():
        for lang_dir in languages_dir_path.iterdir():
            if not lang_dir.is_dir():
                continue
            
            lang = lang_dir.name
            print(f"  📂 Scanning language: {lang}")
            
            for difficulty_dir in lang_dir.iterdir():
                if not difficulty_dir.is_dir():
                    continue
                
                difficulty = difficulty_dir.name
                language_info[lang]['difficulties'].add(difficulty)
                
                for batch_dir in difficulty_dir.iterdir():
                    if not batch_dir.is_dir() or not batch_dir.name.startswith('batch'):
                        continue
                    
                    batch = batch_dir.name
                    audio_dir = batch_dir / "audio"
                    
                    if audio_dir.exists():
                        for content_type in ['words', 'sentences', 'pictures']:
                            content_dir = audio_dir / content_type
                            if content_dir.exists():
                                batch_files = []
                                
                                for audio_file in content_dir.glob("*.mp3"):
                                    # Calculate SHA-256
                                    data = audio_file.read_bytes()
                                    sha = hashlib.sha256(data).hexdigest()
                                    size = audio_file.stat().st_size
                                    
                                    # Relative path from dist root
                                    rel_path = audio_file.relative_to(dist).as_posix()
                                    
                                    file_info = {
                                        "path": rel_path,
                                        "type": "audio",
                                        "bytes": size,
                                        "sha256": sha
                                    }
                                    
                                    batch_files.append(file_info)
                                    language_info[lang]['content_counts'][difficulty][content_type] += 1
                                    total_files_scanned += 1
                                
                                if batch_files:
                                    content_by_language[lang][difficulty][content_type].append({
                                        'batch': batch,
                                        'files': batch_files
                                    })
                                    print(f"    ✅ {len(batch_files)} {content_type} files in {batch}")
    
    print(f"📊 Total audio files scanned: {total_files_scanned}")
    
    # Also scan shared images if they exist
    shared_dir = dist / "shared" / "images"
    if shared_dir.exists():
        print("  📂 Scanning shared images...")
        for batch_dir in shared_dir.iterdir():
            if not batch_dir.is_dir() or not batch_dir.name.startswith('batch'):
                continue
            
            batch = batch_dir.name
            shared_files = []
            
            for image_file in batch_dir.glob("*.jpg"):
                # Calculate SHA-256
                data = image_file.read_bytes()
                sha = hashlib.sha256(data).hexdigest()
                size = image_file.stat().st_size
                
                # Relative path from dist root
                rel_path = image_file.relative_to(dist).as_posix()
                
                file_info = {
                    "path": rel_path,
                    "type": "image",
                    "bytes": size,
                    "sha256": sha
                }
                
                shared_files.append(file_info)
                total_files_scanned += 1
            
            if shared_files:
                # Add shared images to all languages (since they're shared)
                for lang in content_by_language.keys():
                    for difficulty in content_by_language[lang].keys():
                        if 'pictures' not in content_by_language[lang][difficulty]:
                            content_by_language[lang][difficulty]['pictures'] = []
                        
                        content_by_language[lang][difficulty]['pictures'].append({
                            'batch': f"shared_{batch}",
                            'files': shared_files
                        })
                
                print(f"    ✅ {len(shared_files)} shared images in {batch}")
    
    # Step 2: Generate batch manifests (small, specific files)
    print(f"\n📝 Generating batch manifests...")
    batch_count = 0
    
    for lang, difficulties in content_by_language.items():
        for difficulty, content_types in difficulties.items():
            for content_type, batches in content_types.items():
                for batch_data in batches:
                    batch = batch_data['batch']
                    files = batch_data['files']
                    
                    if not files:  # Skip empty batches
                        continue
                    
                    batch_manifest = {
                        "schema_version": SCHEMA_VERSION,
                        "language": lang,
                        "difficulty": difficulty,
                        "content_type": content_type,
                        "batch": batch,
                        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "file_count": len(files),
                        "total_bytes": sum(f["bytes"] for f in files),
                        "files": files
                    }
                    
                    batch_filename = f"{difficulty}_{content_type}_{lang}_{batch}_manifest.json"
                    batch_file = batches_dir / batch_filename
                    
                    with open(batch_file, "w", encoding="utf-8") as f:
                        json.dump(batch_manifest, f, ensure_ascii=False, indent=2)
                    
                    batch_count += 1
    
    print(f"  ✅ Generated {batch_count} batch manifests")
    
    # Step 3: Generate language manifests (medium-sized, per language)
    print(f"\n📝 Generating language manifests...")
    language_count = 0
    
    for lang, lang_info in language_info.items():
        difficulties_data = {}
        
        for difficulty in sorted(lang_info['difficulties']):
            difficulty_data = {}
            
            for content_type in ['sentences', 'words', 'pictures']:
                if content_type in language_info[lang]['content_counts'][difficulty]:
                    # Find all batches for this combination
                    batches = []
                    if (lang in content_by_language and 
                        difficulty in content_by_language[lang] and
                        content_type in content_by_language[lang][difficulty]):
                        
                        batches = [batch_data['batch'] 
                                 for batch_data in content_by_language[lang][difficulty][content_type]]
                    
                    if batches:  # Only include if there are actual batches
                        difficulty_data[content_type] = {
                            "batches": sorted(set(batches)),  # Remove duplicates and sort
                            "total_files": language_info[lang]['content_counts'][difficulty][content_type]
                        }
            
            if difficulty_data:
                difficulties_data[difficulty] = difficulty_data
        
        if difficulties_data:
            language_manifest = {
                "schema_version": SCHEMA_VERSION,
                "language": lang,
                "language_name": get_language_name(lang),
                "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "difficulties": difficulties_data
            }
            
            lang_file = languages_dir / f"{lang}_manifest.json"
            with open(lang_file, "w", encoding="utf-8") as f:
                json.dump(language_manifest, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ Generated {lang}_manifest.json")
            language_count += 1
    
    # Step 4: Generate root manifest (lightweight directory)
    print(f"\n📝 Generating root manifest...")
    
    languages_list = []
    total_content_files = 0
    
    for lang, lang_info in language_info.items():
        lang_entry = {
            "code": lang,
            "name": get_language_name(lang),
            "difficulties": sorted(lang_info['difficulties']),
            "content_counts": {}
        }
        
        lang_total = 0
        for difficulty in sorted(lang_info['difficulties']):
            difficulty_counts = dict(language_info[lang]['content_counts'][difficulty])
            lang_entry["content_counts"][difficulty] = difficulty_counts
            lang_total += sum(difficulty_counts.values())
        
        lang_entry["total_files"] = lang_total
        total_content_files += lang_total
        languages_list.append(lang_entry)
    
    root_manifest = {
        "schema_version": SCHEMA_VERSION,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_languages": len(languages_list),
        "total_content_files": total_content_files,
        "total_batch_manifests": batch_count,
        "manifest_structure": {
            "root_manifest": "Contains metadata and language directory",
            "language_manifests": f"{language_count} files in manifests/languages/",
            "batch_manifests": f"{batch_count} files in manifests/batches/"
        },
        "languages": sorted(languages_list, key=lambda x: x['code'])
    }
    
    root_file = manifest_dir / "root_manifest.json"
    with open(root_file, "w", encoding="utf-8") as f:
        json.dump(root_manifest, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ Generated root_manifest.json")
    
    # Final Summary
    print(f"\n🎉 Hierarchical manifest generation complete!")
    print(f"📊 Summary:")
    print(f"  🌍 {len(languages_list)} languages: {', '.join(sorted([l['code'] for l in languages_list]))}")
    print(f"  📁 {language_count} language manifests")
    print(f"  📦 {batch_count} batch manifests")
    print(f"  📄 1 root manifest")
    print(f"  🎵 {total_content_files} total content files")
    print(f"  📈 Total manifest files: {language_count + batch_count + 1}")
    
    print(f"\n📂 Generated manifest structure:")
    print(f"  {manifest_dir}/")
    print(f"  ├── root_manifest.json")
    print(f"  ├── languages/")
    print(f"  │   ├── en_manifest.json")
    print(f"  │   ├── ja_manifest.json")
    print(f"  │   └── ...")
    print(f"  └── batches/")
    print(f"      ├── A1_sentences_en_batch001_manifest.json")
    print(f"      ├── A1_words_en_batch001_manifest.json")
    print(f"      └── ...")
    
    return root_manifest

if __name__ == "__main__":
    try:
        generate_hierarchical_manifests()
        print(f"\n🚀 Ready to test! Update your app to use the new manifest system.")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()
        raise