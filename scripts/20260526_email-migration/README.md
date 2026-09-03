# Email migration

One-off script to migrate user emails across the `User` and `Form` collections.

Design: see `../../migrate-emails-spec.md`.

## Install

```sh
cd scripts/20260526_email-migration
npm install
```

## Usage

```sh
DB_URI='mongodb://...' node migrate-emails.js \
  --csv ./emails.csv \
  --backup-root ./backups \
  --phase all \
  --no-dry-run
```

Defaults to `--dry-run`. Real runs require `--no-dry-run` and an interactive confirmation per phase.

CSV format (5 columns, header row optional, only columns 3 and 5 are read):
```
username,display_name,old_email,new_display_name,new_email
```

## Phases

- `backup` — no-op stub (snapshots happen lazily during 1/2a/2b/2c).
- `1` — `users.email`.
- `2a` — `forms.permissionList[*].email` (max-rights union on collision).
- `2b` — `forms.emails` (admin notification list).
- `2c` — `forms.form_workflows[*].emails` (static) **and** `forms.form_fields[*].optionsToRecipientsMap` (conditional).
- `verify` — re-read every touched doc, assert it hydrates and the user's email matches.
- `all` — runs `1 → 2a → 2b → 2c → verify` in order.

## Backups

Each run writes to a fresh `<backup-root>/<UTC-timestamp>/` directory:
- `manifest.json` — run metadata.
- `audit.ndjson` — append-only log of every applied/skipped write.
- `users/<id>.json` — pre-mutation User snapshots.
- `forms/<id>.json` — pre-mutation Form snapshots.

## Restore

```sh
DB_URI='mongodb://...' node restore.js --backup-dir ./backups/2026-05-26T...
```

Replays `audit.ndjson` in reverse, `$set`-ing each touched doc back to its snapshot. Per-document; no global transaction.
