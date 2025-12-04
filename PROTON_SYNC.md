Proton-only Sync (Overview)

Goal
----
Use Proton Drive as the primary storage for AI conversation logs and backups, avoiding third-party clouds where possible.

Modes supported
---------------
1) Proton CLI mode (recommended for now):
   - Install a Proton Drive CLI that can upload files programmatically.
   - Set `PROTON_CLI` in `.env` to the CLI executable path. `realtime_sync.py` will shell out to upload changed files.

2) Token mode (future):
   - Set `PROTON_TOKEN` and `PROTON_FOLDER_ID` in `.env`.
   - The syncer has a placeholder for token-based API uploads; implement the API client if you need direct REST uploads.

Configuration (.env)
---------------------
- `PROTON_CLI` - optional path to Proton CLI binary for scripted uploads.
- `PROTON_TOKEN` - (optional) API token for Proton (if available).
- `PROTON_FOLDER_ID` - (optional) destination folder id in Proton Drive.
- `ENABLE_NETLIFY` - set to `false` to skip Netlify deployments and run Proton-only.

Security
--------
- Keep `.env` secret. Do not commit it.
- Conversations are stored in `conversations/` by default; this folder is gitignored.
- For stronger privacy, encrypt conversation payloads before sending them to the server; the server will store opaque blobs.

Usage
-----
1. Configure `.env` according to the mode you choose.
2. Start the server: `python aesi_core.py`
3. Start the syncer (dry-run first):

```pwsh
python realtime_sync.py --dry-run
```

4. For live mode, run without `--dry-run` after verifying `PROTON_CLI` or token config.

Notes
-----
Token/API mode is not implemented fully in this syncer yet. If Proton exposes a public REST API with long-lived tokens, we can implement it. For reliability and automation, using a CLI is the fastest way to achieve Proton-only unattended sync today.
