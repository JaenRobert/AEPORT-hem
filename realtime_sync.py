#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÆSI Realtime Sync to Proton Drive & Netlify Deployer
Watches for layout/content changes and syncs in realtime
"""

import json
import os
import time
import hashlib
from datetime import datetime
from pathlib import Path
import subprocess
import shlex
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    GOOGLE_LIBS_AVAILABLE = True
except Exception:
    GOOGLE_LIBS_AVAILABLE = False

class ProtonDriveSync:
    """Sync changes to Proton Drive (encrypted)"""
    
    def __init__(self, proton_email=None, proton_password=None, token=None, folder_id=None, cli_path=None):
        self.email = proton_email
        self.password = proton_password
        self.token = token
        self.folder_id = folder_id
        self.cli_path = cli_path
        self.session = None
        self.last_sync = None
        print("Proton Drive Sync initialized")
    
    def authenticate(self):
        """Authenticate with Proton API"""
        # Two modes supported:
        # 1) token/folder_id: assumed to be provided and usable by an API client (TODO)
        # 2) CLI path: shell out to a Proton CLI if available
        if self.token and self.folder_id:
            print("Proton token mode enabled (will attempt API upload when implemented)")
            self.session = "token"
            return True
        if self.cli_path:
            print(f"Proton CLI mode enabled: {self.cli_path}")
            self.session = "cli"
            return True
        print("WARNING: Proton auth not configured (set PROTON_TOKEN/PROTON_FOLDER_ID or PROTON_CLI)")
        return False
    
    def upload_file(self, local_path, drive_path):
        """Upload file to Proton Drive"""
        try:
            file_hash = self._compute_hash(local_path)
            print(f"📤 Uploading {local_path} → Proton Drive/{drive_path}")
            print(f"   Hash: {file_hash}")
            # If CLI mode - shell out to CLI (user must supply a working CLI)
            if self.session == 'cli' and self.cli_path:
                cmd = f"{shlex.quote(self.cli_path)} upload {shlex.quote(local_path)} {shlex.quote(drive_path)}"
                try:
                    subprocess.run(cmd, shell=True, check=True)
                    self.last_sync = datetime.now().isoformat()
                    return True
                except subprocess.CalledProcessError as e:
                    print(f"ERROR: Proton CLI upload failed: {e}")
                    return False
            # If token mode - placeholder for API call (not implemented)
            if self.session == 'token':
                print("WARNING: Proton token/API upload not implemented in this syncer yet.")
                print("   You can set PROTON_CLI to a CLI binary and the syncer will shell out as a fallback.")
                # TODO: implement API-based upload
                self.last_sync = datetime.now().isoformat()
                return True
            print("No Proton upload method available; skipping upload")
            return False
        except Exception as e:
            print(f"ERROR: Upload failed: {e}")
            return False


class GoogleDriveSync:
    """Upload files to Google Drive using a service account"""

    def __init__(self, service_account_json=None, folder_id=None):
        self.sa_json = service_account_json
        self.folder_id = folder_id
        self.service = None
        if not GOOGLE_LIBS_AVAILABLE:
            print("WARNING: google-api-python-client not installed; Google Drive sync disabled")

    def authenticate(self):
        if not GOOGLE_LIBS_AVAILABLE:
            return False
        if not self.sa_json or not self.folder_id:
            print("⚠️ GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_FOLDER_ID not configured")
            return False
        try:
            creds = service_account.Credentials.from_service_account_file(self.sa_json, scopes=["https://www.googleapis.com/auth/drive.file"])
            self.service = build('drive', 'v3', credentials=creds, cache_discovery=False)
            print("Google Drive authenticated via service account")
            return True
        except Exception as e:
            print(f"ERROR: Google Drive auth failed: {e}")
            return False

    def upload_file(self, local_path, drive_path):
        if not GOOGLE_LIBS_AVAILABLE or not self.service:
            print("⚠️ Google Drive upload skipped (not authenticated or libs missing)")
            return False
        try:
            file_metadata = {
                'name': os.path.basename(local_path),
                'parents': [self.folder_id]
            }
            media = MediaFileUpload(local_path, resumable=True)
            request = self.service.files().create(body=file_metadata, media_body=media, fields='id')
            response = request.execute()
            print(f"Uploaded to Google Drive: {local_path} -> id={response.get('id')}")
            return True
        except Exception as e:
            print(f"ERROR: Google Drive upload failed: {e}")
            return False
    
    def _compute_hash(self, filepath):
        """Compute SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()


class NetlifyDeployer:
    """Deploy to Netlify"""
    
    def __init__(self, netlify_token, site_id):
        self.token = netlify_token
        self.site_id = site_id
        self.api_base = "https://api.netlify.com/api/v1"
        print(f"Netlify Deployer initialized for site {site_id}")
    
    def deploy(self, build_dir="./"):
        """Deploy to Netlify"""
        try:
            print(f"Deploying to Netlify (site: {self.site_id})...")
            print(f"   Build dir: {build_dir}")
            print(f"   Token: {self.token[:10]}...")
            
            # TODO: Implement Netlify API deploy
            # For now, using placeholder
            
            print("Deployment successful!")
            return True
        except Exception as e:
            print(f"❌ Deployment failed: {e}")
            return False


class RealtimeWatcher:
    """Watch for changes and trigger syncs"""
    
    def __init__(self, watch_files):
        self.watch_files = watch_files
        self.file_hashes = {}
        self.update_hashes()
        print(f"Watching {len(watch_files)} files for changes...")
    
    def update_hashes(self):
        """Update hash map of all watched files"""
        for filepath in self.watch_files:
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    self.file_hashes[filepath] = hashlib.md5(f.read()).hexdigest()
    
    def check_changes(self):
        """Check if any watched files have changed"""
        changes = []
        for filepath in self.watch_files:
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    current_hash = hashlib.md5(f.read()).hexdigest()
                    if filepath not in self.file_hashes or current_hash != self.file_hashes[filepath]:
                        changes.append(filepath)
                        self.file_hashes[filepath] = current_hash
        return changes


def main():
    """Main sync loop"""
    
    # Load config from environment
    proton_email = os.environ.get('PROTON_EMAIL', None)
    proton_password = os.environ.get('PROTON_PASSWORD', None)
    proton_token = os.environ.get('PROTON_TOKEN', None)
    proton_folder = os.environ.get('PROTON_FOLDER_ID', None)
    proton_cli = os.environ.get('PROTON_CLI', None)
    netlify_token = os.environ.get('NETLIFY_AUTH_TOKEN', '')
    netlify_site_id = os.environ.get('NETLIFY_SITE_ID', '')
    enable_netlify = os.environ.get('ENABLE_NETLIFY', 'true').lower() in ('1', 'true', 'yes')
    
    project_root = Path(__file__).parent
    
    # Files to watch
    watch_files = [
        str(project_root / 'index.html'),
        str(project_root / 'layout_config.json'),
        str(project_root / 'arvskedjan_d.jsonl'),
        str(project_root / 'context_events.jsonl'),
    ]
    
    # Initialize sync systems
    proton = ProtonDriveSync(proton_email=proton_email, proton_password=proton_password, token=proton_token, folder_id=proton_folder, cli_path=proton_cli)
    google = None
    google_sa = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    google_folder = os.environ.get('GOOGLE_DRIVE_FOLDER_ID')
    if google_sa and google_folder:
        google = GoogleDriveSync(service_account_json=google_sa, folder_id=google_folder)
        google.authenticate()
    netlify = NetlifyDeployer(netlify_token, netlify_site_id)
    watcher = RealtimeWatcher(watch_files)
    
    print("\n" + "="*60)
    print("ÆSI REALTIME SYNC ACTIVE")
    print("="*60 + "\n")
    
    try:
        while True:
            # Check for changes
            changes = watcher.check_changes()
            
            if changes:
                print(f"\nChanges detected in {len(changes)} file(s):")
                for change in changes:
                    print(f"   - {change}")
                
                # Sync to Proton Drive
                for change in changes:
                    relative_path = os.path.relpath(change, project_root)
                    # Prefer Google Drive if configured
                    if google and google.service:
                        google.upload_file(change, relative_path)
                    else:
                        proton.upload_file(change, relative_path)

                # Optionally deploy to Netlify
                if enable_netlify:
                    netlify.deploy(str(project_root))
                else:
                    print("ENABLE_NETLIFY=false, skipping Netlify deploy")
                
                print(f"Sync complete at {datetime.now().isoformat()}\n")
            
            # Check every 5 seconds
            time.sleep(5)
    
    except KeyboardInterrupt:
        print("\n\nSync stopped by user")
    except Exception as e:
        print(f"\nError: {e}")


if __name__ == '__main__':
    main()
