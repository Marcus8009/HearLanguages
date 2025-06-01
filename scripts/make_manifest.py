#!/usr/bin/env python3
"""
Generate SHA-256 manifest for the new batch structure.
Updated to handle the corrected directory structure with proper batching.
"""

import pathlib
import hashlib
import json
import time
import csv

SCHEMA_VERSION = 2  # Bumped version for new structure

# Project root is one level above this script's parent
root = pathlib.Path(__file__).resolve().parent.parent
dist = root / "dist"
csv_dir = root / "csv"

def read_csv_files():
    """Read the NEW CSV files to understand the content structure"""
    content_info = {
        'difficulties': set(),
        'word_count_by_difficulty': {},
        'sentence_count_by_difficulty': {},
        'picture_count_by_difficulty': {}
    }
    
    # Read words CSV
    words_csv = csv_dir / "words_v1NEW.csv"
    if words_csv.exists():
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
        with open(pictures_csv, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                difficulty = row.get('difficulty', 'A1')
                content_info['difficulties'].add(difficulty)
                content_info['picture_count_by_difficulty'][difficulty] = \
                    content_info['picture_count_by_difficulty'].get(difficulty, 0) + 1
    
    return content_info

def calculate_batch_structure(content_info):
    """Calculate expected batch structure based on content counts"""
    batch_structure = {}
    
    for difficulty in content_info['difficulties']:
        batch_structure[difficulty] = {
            'word_batches': [],
            'sentence_batches': [],
            'picture_batches': []
        }
        
        # Word batches (50 per batch)
        word_count = content_info['word_count_by_difficulty'].get(difficulty, 0)
        word_batch_count = (word_count + 49) // 50  # Round up
        batch_structure[difficulty]['word_batches'] = [f"batch{i+1:03d}" for i in range(word_batch_count)]
        
        # Sentence batches (50 per batch)
        sentence_count = content_info['sentence_count_by_difficulty'].get(difficulty, 0)
        sentence_batch_count = (sentence_count + 49) // 50  # Round up
        batch_structure[difficulty]['sentence_batches'] = [f"batch{i+1:03d}" for i in range(sentence_batch_count)]
        
        # Picture batches (10 per batch)
        picture_count = content_info['picture_count_by_difficulty'].get(difficulty, 0)
        picture_batch_count = (picture_count + 9) // 10  # Round up
        batch_structure[difficulty]['picture_batches'] = [f"batch{i+1:03d}" for i in range(picture_batch_count)]
    
    return batch_structure

def generate_manifest():
    """Generate comprehensive manifest for all content"""
    
    print("🔍 Reading CSV files to understand content structure...")
    content_info = read_csv_files()
    batch_structure = calculate_batch_structure(content_info)
    
    print(f"📊 Found difficulties: {sorted(content_info['difficulties'])}")
    print(f"📊 Content counts by difficulty:")
    for diff in sorted(content_info['difficulties']):
        words = content_info['word_count_by_difficulty'].get(diff, 0)
        sentences = content_info['sentence_count_by_difficulty'].get(diff, 0)
        pictures = content_info['picture_count_by_difficulty'].get(diff, 0)
        print(f"  {diff}: {words} words, {sentences} sentences, {pictures} pictures")
    
    files = []
    languages = ['en', 'zh', 'ja', 'es', 'fr']  # All supported languages
    
    print("\n🔍 Scanning generated audio files...")
    
    # Scan audio files in the new structure
    languages_dir = dist / "languages"
    if languages_dir.exists():
        for lang_dir in languages_dir.iterdir():
            if not lang_dir.is_dir():
                continue
            
            lang = lang_dir.name
            print(f"  📂 Scanning language: {lang}")
            
            for difficulty_dir in lang_dir.iterdir():
                if not difficulty_dir.is_dir():
                    continue
                
                difficulty = difficulty_dir.name
                
                for batch_dir in difficulty_dir.iterdir():
                    if not batch_dir.is_dir() or not batch_dir.name.startswith('batch'):
                        continue
                    
                    batch = batch_dir.name
                    audio_dir = batch_dir / "audio"
                    
                    if audio_dir.exists():
                        # Scan words, sentences, pictures
                        for content_type in ['words', 'sentences', 'pictures']:
                            content_dir = audio_dir / content_type
                            if content_dir.exists():
                                for audio_file in content_dir.glob("*.mp3"):
                                    # Calculate SHA-256
                                    data = audio_file.read_bytes()
                                    sha = hashlib.sha256(data).hexdigest()
                                    size = audio_file.stat().st_size
                                    
                                    # Relative path from dist root
                                    rel_path = audio_file.relative_to(dist).as_posix()
                                    
                                    files.append({
                                        "path": rel_path,
                                        "type": "audio",
                                        "content_type": content_type,
                                        "language": lang,
                                        "difficulty": difficulty,
                                        "batch": batch,
                                        "bytes": size,
                                        "sha256": sha
                                    })
    
    # Scan shared images if they exist
    shared_dir = dist / "shared" / "images"
    if shared_dir.exists():
        print("  📂 Scanning shared images...")
        for batch_dir in shared_dir.iterdir():
            if not batch_dir.is_dir() or not batch_dir.name.startswith('batch'):
                continue
            
            batch = batch_dir.name
            for image_file in batch_dir.glob("*.jpg"):
                # Calculate SHA-256
                data = image_file.read_bytes()
                sha = hashlib.sha256(data).hexdigest()
                size = image_file.stat().st_size
                
                # Relative path from dist root
                rel_path = image_file.relative_to(dist).as_posix()
                
                files.append({
                    "path": rel_path,
                    "type": "image",
                    "content_type": "pictures",
                    "batch": batch,
                    "bytes": size,
                    "sha256": sha
                })
    
    # Create comprehensive manifest
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "content_info": {
            "difficulties": sorted(content_info['difficulties']),
            "languages": languages,
            "batch_structure": batch_structure,
            "totals": {
                "words": sum(content_info['word_count_by_difficulty'].values()),
                "sentences": sum(content_info['sentence_count_by_difficulty'].values()),
                "pictures": sum(content_info['picture_count_by_difficulty'].values()),
                "audio_files": len([f for f in files if f["type"] == "audio"]),
                "image_files": len([f for f in files if f["type"] == "image"])
            }
        },
        "files": files
    }
    
    # Create output directory
    manifest_dir = dist / "manifests"
    manifest_dir.mkdir(parents=True, exist_ok=True)
    
    # Write main manifest
    manifest_file = manifest_dir / "content_manifest_v2.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Manifest written → {manifest_file}")
    print(f"📊 Manifest summary:")
    print(f"  🔤 {manifest['content_info']['totals']['words']} words")
    print(f"  💬 {manifest['content_info']['totals']['sentences']} sentences") 
    print(f"  🖼️ {manifest['content_info']['totals']['pictures']} pictures")
    print(f"  🔊 {manifest['content_info']['totals']['audio_files']} audio files")
    print(f"  📷 {manifest['content_info']['totals']['image_files']} image files")
    
    # Also create batch-specific manifests for easier consumption
    print(f"\n📝 Creating batch-specific manifests...")
    for difficulty in content_info['difficulties']:
        for content_type in ['words', 'sentences', 'pictures']:
            # Map content type to correct batch structure key
            batch_key_map = {
                'words': 'word_batches',
                'sentences': 'sentence_batches', 
                'pictures': 'picture_batches'
            }
            batch_key = batch_key_map[content_type]
            batches = batch_structure[difficulty][batch_key]
            for batch in batches:
                batch_files = [f for f in files 
                             if f.get('difficulty') == difficulty 
                             and f.get('content_type') == content_type 
                             and f.get('batch') == batch]
                
                if batch_files:
                    batch_manifest = {
                        "schema_version": SCHEMA_VERSION,
                        "difficulty": difficulty,
                        "content_type": content_type,
                        "batch": batch,
                        "generated_utc": manifest["generated_utc"],
                        "files": batch_files
                    }
                    
                    batch_file = manifest_dir / f"{difficulty}_{content_type}_{batch}_manifest.json"
                    with open(batch_file, "w", encoding="utf-8") as f:
                        json.dump(batch_manifest, f, ensure_ascii=False, indent=2)
    
    return manifest

if __name__ == "__main__":
    print("🚀 Content Manifest Generator v2")
    print("=" * 40)
    
    try:
        generate_manifest()
        print("\n🎉 Manifest generation complete!")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        raise