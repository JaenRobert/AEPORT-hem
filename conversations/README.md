Conversations folder

This directory stores conversation JSON files created by the local ÆSI server.

Layout:
- conversations/<node>/conversation_<timestamp>_<id>.json

Each file contains a JSON object with:
- metadata: node, created_at, participants, tags (optional)
- content: messages: [ {role, text, timestamp}, ... ]
- provenance: saved_by, hash (optional)

Security:
- These files may contain sensitive data. Do NOT commit `conversations/` to git.
- Store Proton or other sync credentials in `.env` and do not commit them.

If you want end-to-end privacy, encrypt the `conversation` payload before POSTing to the server; the server will store encrypted blobs unchanged.
