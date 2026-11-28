# Bazaar local photography library

**117 verified original JPEG downloads (115.5 MB)** for the four departments the store actually models. These are research and merchandising assets, independent of `frontend/public/products` and MongoDB. No cloud upload, replacement URL or SKU assignment has been made.

Git tracks the inventory and verification script only. A fresh clone does not contain the original photographs; run the library check on the machine that holds them.

| Catalog category | Folder | Images | What's inside |
|---|---|---:|---|
| T-shirts | [`clothing/tshirts/`](clothing/tshirts/) | 18 | Plain hanger shots, selected on-model and printed tees, striped flat lay |
| Shirts | [`clothing/shirts/`](clothing/shirts/) | 35 | Linen, button shirts, blouses, collars, construction details and alternate views |
| Pants | [`clothing/pants/`](clothing/pants/) | 31 | Chinos, jeans, denim details and tailored archival trousers |
| Shoes | [`footwear/shoes/`](footwear/shoes/) | 33 | Boots, sneakers, loafers, flats, heels and formal footwear |

Browse the subfolder for the silhouette, or filter [`image-sources/sources.csv`](image-sources/sources.csv) by `category`, `subcategory`, `collection` and dimensions. Filenames use `<catalog-category>-<visible-description>-<sequence>.jpg`. Front, rear, profile and detail are labeled where distinguishable. The catalog has no gender taxonomy; gender was not guessed from a model or garment. There are no accessory, beauty or electronics records in the current catalog.

## Provenance and intended use

- **70 archive references:** The Metropolitan Museum of Art, Costume Institute. Only objects flagged public domain with actual Open Access image files were retained. [Met Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access), [CC0](https://creativecommons.org/publicdomain/zero/1.0/). Useful for editorial studies of cut, construction, footwear and multi-angle presentation. These are historic pieces, **not** product shots of the store's modern branded stock.
- **36 Flickr originals:** discovered via [Openverse](https://openverse.org/). The original publisher's public download page had to offer the original file and display the matching commercial-use Creative Commons license. `creator`, source page and exact license/version are in each row. Credit the photographer and indicate changes; preserve applicable ShareAlike conditions on adaptations.
- **10 Shopify Burst files:** real plain-tee photographs, obtained through the publicly offered free download. These are 925 px wide; suitable for small references rather than full-screen zoom. The [Burst license](https://www.shopify.com/stock-photos/licenses/shopify-some-rights-reserved) allows commercial use, not sale as stock files or replication of the service.
- **1 Wikimedia Commons original:** black Western boots, with the photographer credit and commercial-use license from the individual file record.

Copyright permissions for a photo don't establish model releases, trademark endorsement, inventory authenticity or a match to a retail SKU. The **47 catalog references** still require that independent review. Preserve source credits when making crops, responsive renditions or future cloud records.

## Validation and remaining gaps

236 photo candidates were acquired to the temporary staging area; **117 were admitted** after visual screening. Rejected examples included portraits where the garment was incidental, label-only images, promotional layouts, repeated poses and near-identical color treatments. 106 of the retained originals have a long edge of at least 1,500 px. Orientation, crop and scale were not modified in the stored originals.

Final recheck: every file decoded, dimensions matched its CSV row and SHA-256 matched. **0 corrupted files retained, 0 byte-identical duplicates found, 0 missing catalog categories.** Source acquisition logged **123 failed photo/page requests** (51 Burst and 70 Commons rate-limit responses, 2 unavailable Flickr pages); a separate Smithsonian discovery request was rate-limited. These are attempts, not missing files advertised in the manifest. No restricted downloads were placed in this library.

**Next collection target:** 12 additional distinct T-shirt photos to reach 30. For the other departments, prioritize *contemporary supplier-matched* front/back/detail series rather than increasing the archival count. Do not deploy editorial reference photos as retail product images.

To add a future approved original: choose its category/subcategory; assign the next sequence; record its relative filename, creator, source, direct download or official download page, license, dimensions and hash in the manifest. Recheck with Python and Pillow:

```sh
python photos/verify.py
```
