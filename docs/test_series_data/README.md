# Botany test series working data

Use `working/` to edit questions. Each bank's first sheet has the exact upload headings used by the portal. Upload a completed workbook from the matching row in **Tests & banks**. The `templates/` folder contains untouched blank copies; `source_originals/` contains byte-for-byte copies of the 10 supplied workbooks. The files in `docs/raw/fwdtestseriesi/` were not changed.

| Schedule bank | Source rows | Working rows / target | Source rows beyond target |
| --- | ---: | ---: | ---: |
| Free diagnostic demo | 50 | 30 / 30 | 20 |
| DT-F — Diagnostic (all units) | 119 | 119 / 120 | 0 |
| T1-I — Viruses | 50 | 50 / 50 | 0 |
| T1-II — Bacteria | 100 | 100 / 100 | 0 |
| T1-III — Fungi | 90 | 50 / 50 | 40 |
| T1-IV — Plant Pathology | 112 | 80 / 80 | 32 |
| T2-I — Algae | 100 | 80 / 80 | 20 |
| T2-II — Bryophyta | 111 | 80 / 80 | 31 |
| T2-III — Pteridophytes | 104 | 80 / 80 | 24 |
| T2-IV — Gymnosperms | 60 | 50 / 50 | 10 |

The free demo takes three questions from each of the 10 units in the 50-question source, so every unit appears. Each other populated workbook takes the first scheduled number of source rows in source order. Extra rows remain in `source_originals/` for selection or later revision. The other 41 scheduled-test working banks are blank.

## Review before upload

- **DT-F needs one more question** to reach its 120-question target.
- The supplied answer keys and explanations were transferred, not academically verified. For example, the Bryophyta source marks a question about pioneer plants as **B** although option **A** states the pioneer-plant characteristic. Its source syllabus notes also refer to Gymnosperms. Review this bank carefully.
- Some source text has defects. For example, an Algae option ends at `Chlorella (` and parts of the Fungi explanations say `Option text missing from source`. Correct these in `working/` before upload.
- The portal validates workbook structure and answer-key letters; it does not verify scientific accuracy or whether a question matches the scheduled syllabus scope.

Keep the first-sheet headings unchanged. Required columns are the question, four options, and an A/B/C/D key. Fill or revise the four option analyses and context note as needed. The Instructions sheet gives the corresponding schedule code and target. Do not add rows above the header on the first sheet.
