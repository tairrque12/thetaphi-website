# Legacy Roster Import Review

Status: Dry run only
Production records created: 0

## Safety decision

The attached PDF is not reliable enough for an automatic production import. It contains stale contact details, wrapped cells, missing values, inconsistent line headings, possible duplicates, and a graduate-chapter row mixed into the undergraduate roster.

The import therefore uses two gates:

1. Private extraction and normalization
2. Officer review and explicit approval before profile creation

The PDF, extracted text, staged records, and exception details are excluded from Git. Only aggregate counts appear here.

## Preliminary dry-run results

| Classification | Count |
| --- | ---: |
| Source records detected | 264 |
| Ready for officer review | 101 |
| Needs manual correction | 145 |
| Explicitly marked Chapter Invisible | 18 |
| Missing email | 116 |
| Malformed email extraction | 13 |
| Ambiguous crossing line | 24 |
| Possible duplicate records | 6 |

“Ready for officer review” does not mean verified. Every living brother remains unverified until he claims and confirms his profile.

The 18 explicit Chapter Invisible markers are recognized automatically. Those profiles will preserve chapter and lineage history while receiving no account or communication.

## Review requirements

Before production promotion, an officer must resolve:

- Records without a reliable first and last name
- Wrapped or malformed email addresses
- Possible duplicate identities
- Combined or ambiguous crossing terms
- The graduate-chapter record mixed into the source
- Unnumbered newer line entries
- Any source row whose fields shifted during PDF extraction

No guessed email address, phone number, address, crossing term, or lineage relationship may be silently accepted.

## Private dry-run command

First extract the PDF to layout-preserving text outside the repository. Then run:

```bash
npm run roster:review -- --input /private/path/to/layout.txt
```

The command writes private files under `private/roster-import/`:

- `staging-records.json`
- `review-summary.json`

Both are ignored by Git and created with owner-only file permissions.

## Production staging

The database includes management-only staging tables:

- `roster_import_batches`
- `roster_import_records`

Their row-level policies allow only Officers and Admins to access them. Staged records remain separate from `brother_profiles` until an officer approves them. Promotion into real brother profiles will be implemented only after the review interface and record-correction workflow are approved.
