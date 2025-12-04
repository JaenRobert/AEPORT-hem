Documents folder

This directory stores project documents that the AIs and users can create and manage.

Layout:
- documents/<folder>/<document_name>.json

Each document is a JSON object and may contain metadata and content fields.

Security & scale:
- The folder is gitignored by default (see `.gitignore`).
- Designed to handle many documents; listing endpoints are paginated client-side.
- For large scale (thousands of documents), consider using a lightweight DB or indexing service. This simple filesystem layout is easy to backup to Proton Drive.
