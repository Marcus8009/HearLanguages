"""Merge words & sentence translations, ensure required columns present."""
import csv, sys, pathlib

def ensure_cols(row, cols):
    for c in cols:
        row.setdefault(c, "")

BATCH = "batch01"
root = pathlib.Path(__file__).resolve().parent.parent
words = {r["word_id"]: r for r in csv.DictReader(open(root/"csv"/"words_v1.csv", encoding="utf-8-sig"))}

sent_path = root/"csv"/BATCH/f"sentences_{BATCH}_v1.csv"
rows = []
with open(sent_path, encoding="utf-8-sig") as f:
    rdr = csv.DictReader(f)
    for row in rdr:
        ensure_cols(row, ["schema_version", "sentence_id", "word_id", "base_en"])
        assert row["word_id"] in words, f"Unknown word_id {row['word_id']}"
        rows.append(row)
print(f"Validated {len(rows)} sentences.")
