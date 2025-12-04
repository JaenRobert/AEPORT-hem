#!/usr/bin/env python3
"""
edge_server.py
Asyncio WebSocket edge server for ÆSI NEXUS real-time chat/console.

Protocol (text-based, simple prefixes):
- Client -> Server:
  - CHAT:<role>:<text>      -- user chat to AI with role (e.g. CHAT:REFLEX:hello)
  - dirigentCMD:/command    -- terminal command (must start with '/'), e.g. "/build" or "/bygg"

- Server -> Clients (broadcasts):
  - dirigentCHAT_MSG:<text> -- AI response (Reflex/Gemini)
  - reflexSERVER_LOG:<text> -- server/system log or command output

Run: python edge_server.py
Requires: websockets (pip install websockets)
"""

import asyncio
import logging
import os
import json
import hashlib
from datetime import datetime
from typing import Set

import websockets
from websockets.legacy.server import WebSocketServerProtocol

# Import from aesi_core for Gemini integration
try:
    import aesi_core
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logging.warning("aesi_core.py not found - using simulated responses")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

CONNECTED: Set[WebSocketServerProtocol] = set()
LEDGER_FILE = "arvskedjan_d.jsonl"

# Default role if none specified
DEFAULT_ROLE = "REFLEX"


def skriv_till_arvskedjan(entry: dict):
    """
    Append entry to arvskedjan_d.jsonl (immutable ledger).
    Follows repo convention of append-only writes with hash.
    """
    try:
        entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
        entry_str = json.dumps(entry, ensure_ascii=False)
        entry["hash"] = hashlib.sha256(entry_str.encode("utf-8")).hexdigest()[:16]
        
        with open(LEDGER_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        logging.debug("Ledger entry written: %s", entry.get("hash"))
    except Exception as e:
        logging.error("Failed to write to ledger: %s", e)


async def broadcast(message: str):
    """Send message to all connected clients and prune closed connections."""
    if not CONNECTED:
        logging.debug("No clients to broadcast to.")
        return

    logging.info("Broadcasting: %s", message[:100])
    to_remove = set()
    for ws in CONNECTED.copy():
        try:
            await ws.send(message)
        except Exception as e:
            logging.warning("Failed sending to a client, scheduling removal: %s", e)
            to_remove.add(ws)
    for r in to_remove:
        CONNECTED.discard(r)


async def get_gemini_response(query: str, role: str = DEFAULT_ROLE) -> str:
    """
    Get AI response from Gemini via aesi_core integration.
    Falls back to simulation if aesi_core is unavailable.
    """
    if GEMINI_AVAILABLE:
        try:
            logging.info("Calling Gemini API for role %s: %s", role, query[:50])
            # Use aesi_core's call_gemini function
            response = await asyncio.to_thread(aesi_core.call_gemini, query, role)
            
            # Log to ledger
            skriv_till_arvskedjan({
                "type": "websocket_chat",
                "role": role,
                "query": query,
                "response": response
            })
            
            return response
        except Exception as e:
            logging.error("Gemini API call failed: %s", e)
            return f"[Error] Failed to get AI response: {str(e)}"
    else:
        # Simulation fallback
        logging.info("Simulating AI response for query: %s", query[:50])
        await asyncio.sleep(1)
        return f"[Gemini-Sim | {role}] Echo: {query}"


async def handle_build_command(command: str):
    """Simulate a build command and broadcast multiple log lines as reflexSERVER_LOG."""
    steps = [
        "🔧 Initializing build environment...",
        "📦 Installing dependencies...",
        "⚙️  Compiling sources...",
        "📦 Bundling assets...",
        "✅ Running post-build tasks...",
        "✨ Build completed: index.html and static assets updated."
    ]
    
    # Log build command to ledger
    skriv_till_arvskedjan({
        "type": "build_command",
        "command": command
    })
    
    for step in steps:
        await asyncio.sleep(0.8)
        await broadcast(f"reflexSERVER_LOG:{step}")


async def handle_status_command():
    """Report server status."""
    status_lines = [
        f"🔌 Connected clients: {len(CONNECTED)}",
        f"🤖 Gemini API: {'Available' if GEMINI_AVAILABLE else 'Simulated'}",
        f"📋 Ledger: {LEDGER_FILE}",
        f"🚀 Server running on ws://0.0.0.0:{os.environ.get('PORT', '8765')}"
    ]
    for line in status_lines:
        await broadcast(f"reflexSERVER_LOG:{line}")


async def handle_client(ws: WebSocketServerProtocol, path: str):
    """Handler for each connected client websocket."""
    addr = ws.remote_address
    logging.info("Client connected: %s", addr)
    CONNECTED.add(ws)

    # Announce connection
    await broadcast(f"reflexSERVER_LOG:✅ Client connected from {addr}")
    
    # Log connection to ledger
    skriv_till_arvskedjan({
        "type": "client_connection",
        "address": str(addr)
    })

    try:
        async for raw_msg in ws:
            logging.info("Received from %s: %s", addr, raw_msg[:100])
            if not isinstance(raw_msg, str):
                logging.warning("Non-text message received, ignoring.")
                continue

            # CHAT handling with optional role: CHAT:<role>:<text> or CHAT:<text>
            if raw_msg.startswith("CHAT:"):
                payload = raw_msg[len("CHAT:"):].strip()
                if not payload:
                    await ws.send("reflexSERVER_LOG:⚠️  Empty CHAT message received.")
                    continue

                # Parse role if provided
                parts = payload.split(":", 1)
                if len(parts) == 2 and parts[0].upper() in ["REFLEX", "CLAUDE", "HAFTED", "JEMMIN", "SMILE", "ERNIE"]:
                    role = parts[0].upper()
                    query = parts[1].strip()
                else:
                    role = DEFAULT_ROLE
                    query = payload

                if not query:
                    await ws.send("reflexSERVER_LOG:⚠️  Empty query received.")
                    continue

                # Notify processing started
                await broadcast(f"reflexSERVER_LOG:💭 Processing query with {role}...")
                
                ai_reply = await get_gemini_response(query, role)
                # Send AI response with the required prefix
                await broadcast(f"dirigentCHAT_MSG:{ai_reply}")

            # Command handling
            elif raw_msg.startswith("dirigentCMD:"):
                payload = raw_msg[len("dirigentCMD:"):].strip()
                # Commands may include the leading '/'
                if payload.startswith("/"):
                    cmd = payload[1:].strip().lower()
                else:
                    cmd = payload.strip().lower()

                logging.info("Command requested: %s", cmd)
                
                if cmd in ("build", "bygg"):
                    await broadcast("reflexSERVER_LOG:🔨 Build command received — starting build simulation.")
                    await handle_build_command(cmd)
                    await broadcast("reflexSERVER_LOG:✅ Build simulation finished.")
                
                elif cmd in ("status", "stat"):
                    await handle_status_command()
                
                elif cmd in ("help", "hjälp"):
                    help_text = (
                        "Available commands:\n"
                        "  /build, /bygg - Run build simulation\n"
                        "  /status - Show server status\n"
                        "  /help - Show this help\n"
                        "Chat format: CHAT:[ROLE:]<message>"
                    )
                    await broadcast(f"reflexSERVER_LOG:{help_text}")
                
                else:
                    msg = f"❌ Unknown command: {cmd}. Type /help for available commands."
                    await broadcast(f"reflexSERVER_LOG:{msg}")

            else:
                # Unrecognized prefix: inform sender
                warn_msg = "⚠️  Unrecognized message prefix. Use CHAT:[ROLE:]<text> or dirigentCMD:/cmd"
                logging.warning("Unrecognized message from client: %s", raw_msg[:100])
                try:
                    await ws.send(f"reflexSERVER_LOG:{warn_msg}")
                except Exception:
                    pass

    except websockets.exceptions.ConnectionClosed as e:
        logging.info("Client disconnected: %s (%s)", addr, e)
    except Exception as e:
        logging.error("Error in client handler: %s", e)
        try:
            await ws.send(f"reflexSERVER_LOG:❌ Server error: {str(e)}")
        except Exception:
            pass
    finally:
        CONNECTED.discard(ws)
        await broadcast(f"reflexSERVER_LOG:👋 Client disconnected from {addr}")
        
        # Log disconnection to ledger
        skriv_till_arvskedjan({
            "type": "client_disconnection",
            "address": str(addr)
        })
        
        logging.info("Connection handler terminated for: %s", addr)


async def main():
    host = "0.0.0.0"
    # ÄNDRAT: Använd port 8765 istället för 8766 (som redan används)
    port = int(os.environ.get("PORT", "8765"))
    
    logging.info("=" * 60)
    logging.info("ÆSI NEXUS WebSocket Edge Server")
    logging.info("=" * 60)
    logging.info("Starting WebSocket server on ws://%s:%d", host, port)
    logging.info("Local access: ws://127.0.0.1:%d", port)
    logging.info("Gemini Integration: %s", "Active" if GEMINI_AVAILABLE else "Simulated")
    logging.info("Ledger File: %s", LEDGER_FILE)
    logging.info("=" * 60)
    
    try:
        async with websockets.serve(handle_client, host, port):
            # Run forever
            await asyncio.Future()
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            logging.error("=" * 60)
            logging.error("PORT %d IS ALREADY IN USE!", port)
            logging.error("Please close the other program using this port or change PORT in environment")
            logging.error("=" * 60)
            raise
        else:
            raise


if __name__ == "__main__":
    # Ensure proper event loop setup and avoid "no running event loop" errors.
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Server shutdown requested.")
    except Exception as e:
        logging.error("Server crashed: %s", e)
        raise