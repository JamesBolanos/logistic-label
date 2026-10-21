# Saved-label ZPL export

In **Saved labels**, choose **ZPL printer resolution**, then **Download ZPL** on the existing label. This is available on the generator page and the label-history page. Saving a new label still downloads its PDF automatically; its ZPL is available from history. Downloading either format reuses the saved SSCC and does not reserve another serial number.

Match the printer's nominal resolution: 203 dpi (8 dots/mm), 300 dpi (12 dots/mm), or 600 dpi (24 dots/mm). The default is 203 dpi. Use media and a printer wide enough for the saved layout; a 6 × 8 label requires a six-inch print width. The two-copy layout remains two compact labels on one 4 × 6 sheet.

## Rendering contract

- `src/lib/server/labels/layout.js` defines the shared physical layout and preserves saved `v1`–`v4` template selection.
- The PDF adapter serializes the existing PDF drawing operations. The ZPL adapter uses printer text and drawing commands; printer fonts can differ from the PDF preview.
- ZPL barcode bars use the existing GS1-128 encoder, including FNC1 separators and checksums, and are drawn as filled `^GB` rectangles. They are not rasterized from a PDF and do not depend on a printer's automatic Code 128 encoding choices.
- Guided barcodes use 0.5 mm modules (4, 6, or 12 whole dots), at least 31.75 mm bar height, and at least 10 modules of quiet space on each side. Oversized symbols are rejected. Legacy `v1` symbols keep their smaller allocation and are not upgraded to guided-label compliance.
- Text uses UTF-8 (`^CI28`) and `^FH` escapes for command prefixes, controls, underscores, and non-ASCII bytes. Actual glyph coverage depends on the printer's font.
- Files contain one label format with `^PQ1`, explicit dimensions/orientation, and no printer setup persistence or network delivery commands.

## Endpoint and checks

`GET /api/zpl/download/{id}?dpi=203` requires authentication, scopes the database lookup to the signed-in user, applies the existing download rate limiter, and returns a private, non-cacheable `.zpl` attachment. It performs no database writes. Invalid resolutions return 400, unavailable labels 404, oversized barcodes 422, and generation failures a generic 500 response. History keeps saved rows visible so users can retry failed downloads.

Unit tests cover physical dimensions and bar positions at all three resolutions, supported layouts, template compatibility, escaping, access scoping, rate limits, and errors. A browser test uses synthetic data to check the selected resolution, file download, retry, and PDF action without a database. Existing PDF tests cover shared-layout regression risk. ZPL downloads are not counted as PDF analytics events.

Physical print and scanner verification remain necessary before relying on a printer configuration; automated tests do not establish print grade. No external renderer receives label data.

## Command references

- [Zebra: printhead dots per millimeter](https://docs.zebra.com/content/tcm/us/en/printers/software/zpl-pg/advanced-techniques/set-dots-millimeter.html)
- [Zebra: graphic boxes and lines (`^GB`)](https://docs.zebra.com/content/tcm/us/en/printers/software/zpl-pg/zpl-commands/%5Egb.html)
- [Zebra: hexadecimal field data (`^FH`)](https://docs.zebra.com/content/tcm/us/en/printers/software/zpl-pg/zpl-commands/%5Efh.html)
