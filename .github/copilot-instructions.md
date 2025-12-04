Purpose
-------
This file gives short, actionable guidance for AI coding agents working in this repo so they can be productive immediately.

Big picture
-----------
- Python core: `aesi_core.py` is the primary runtime. It runs an HTTP service on port `8000`, handles `/pulse` and `/ping`, calls the Gemini API, and appends immutable entries to `arvskedjan_d.jsonl` (the project "ledger").
- Frontend: Vite + React sources live under `src/`, `index.html`, and assorted legacy JS in `js/` and `components/`. `npm run dev` (Vite) serves the frontend for development.
- Node helpers: `server/gemini_proxy.js` and `server/drive_fetch.js` are small utilities (expect `GEMINI_API_KEY` in `server/config/.env`). Note: `server/index.js` in this repo currently contains React entry code — it is not a runnable Node server as-is.

Primary data flow
-----------------
- Browser -> POST `/pulse` on `http://localhost:8000` -> handled by `aesi_core.py`.
- `aesi_core.py` uses hard-coded role instructions (e.g. `REFLEX`, `CLAUDE`, `HAFTED`) and a Gemini API key to generate responses.
- Every interaction is logged (append-only) to `arvskedjan_d.jsonl` via `skriv_till_arvskedjan()` — treat that file as the immutable audit trail.

How to run locally (common tasks)
--------------------------------
- Start the Python core (recommended local dev flow):

  ```pwsh
  python aesi_core.py
  ```

- On Windows the helper `start.bat` provides a small menu that runs `python aesi_core.py` and opens `http://localhost:8000/index.html`.
- Start frontend dev server (Vite):

  ```pwsh
  npm install
  npm run dev
  ```

- There's an npm script `npm run server` which runs `node server/index.js` but `server/index.js` contains front-end code — inspect before using.

Important repo-specific conventions
---------------------------------
- Roles and naming: Role constants are used as conversational system instructions. Common role keys: `JEMMIN`, `REFLEX`, `HAFTED`, `CLAUDE`, `SMILE`, `ERNIE`.
- Memory ledger: `arvskedjan_d.jsonl` is newline-delimited JSON; code appends entries and writes a `hash` per entry. Do not rewrite or truncate this file during normal operations.
- Encoding: files and network payloads use UTF-8; the Python code uses non-ASCII identifiers (e.g. `ÆSI_MASTER_API_KEY`) — preserve encoding and exact names when editing.
- API keys: there are two places where a Gemini key may live:
  - directly in `aesi_core.py` as `ÆSI_MASTER_API_KEY` (replace the placeholder with your key for quick local testing).
  - in `server/config/.env` as `GEMINI_API_KEY` for the Node helper `gemini_proxy.js`.

Examples for agents (do these, not generic tips)
----------------------------------------------
- When adding a new endpoint that communicates with the AI, mirror the `POST /pulse` pattern: validate `text` and `node`, call `call_gemini(prompt, node)`, then append both prompt and response to `arvskedjan_d.jsonl` using `skriv_till_arvskedjan()`.
- To test end-to-end locally, send a POST to the Python core:

  ```pwsh
  curl -X POST http://localhost:8000/pulse -H "Content-Type: application/json" -d '{"text":"hello", "node":"REFLEX"}'
  ```

- If you change network behavior, remember the core sets CORS headers in `AESIHandler`: keep `Access-Control-Allow-Origin: *` for local dev unless you intentionally lock it down.

Files to inspect first
---------------------
- `aesi_core.py` — main runtime, role instructions, Gemini integration, ledger writes.
- `start.bat` — Windows helper to launch `aesi_core.py` and open `index.html`.
- `package.json` — `npm run dev` (Vite) and `npm run server` (caution: `server/index.js` is front-end code in this repo).
- `src/`, `components/`, `js/` — front-end code; React entry points in `src/`.
- `server/gemini_proxy.js` — node helper showing expected env var location `server/config/.env`.

What I will not assume or change
------------------------------
- Do not move or rewrite `arvskedjan_d.jsonl` entries. Agents should append-only.
- Do not assume `server/index.js` is a Node server without confirming intent with the maintainer.

If any of the above is unclear or you want certain behaviors changed (for example: move Gemini key to a central config, add a proper Node backend, or standardize role names), tell me which part to update and I will produce a precise patch.

Request for feedback
--------------------
Is there anything missing or incorrect about the described run commands, ports, or key files? Reply with the area you want expanded (architecture, example code, or developer workflows) and I will iterate.
