"""Read-only library QA: python photos/verify.py (requires Pillow)."""
import csv
import hashlib
from collections import Counter
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent
with (root / 'image-sources' / 'sources.csv').open(encoding='utf-8', newline='') as f:
    rows = list(csv.DictReader(f))

hashes, filenames = set(), set()
for row in rows:
    path = (root / row['filename']).resolve()
    assert path.is_relative_to(root) and path.suffix == '.jpg', row['filename']
    assert path.parent.name == row['subcategory'] and path.parent.parent.name == row['category'], path
    assert all(row[x] for x in ('original_source_url', 'creator', 'license', 'license_url', 'download_url')), path
    with Image.open(path) as im:
        im.verify()
    with Image.open(path) as im:
        im.load()
        assert im.format == 'JPEG' and im.size == (int(row['width']), int(row['height'])), path
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == row['sha256'] and digest not in hashes, path
    assert row['download_status'] == 'verified' and row['filename'] not in filenames, path
    hashes.add(digest)
    filenames.add(row['filename'])

assert filenames == {p.relative_to(root).as_posix() for p in root.rglob('*.jpg')}, 'Unmanifested or missing photos'
print(f'{len(rows)} verified JPEGs; no missing, unmanifested or byte-identical files.')
for category, count in sorted(Counter(row['category'] for row in rows).items()):
    print(f'  {category}: {count}')
