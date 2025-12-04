#!/usr/bin/env python3
"""
edge_server.py
Asyncio WebSocket edge server for ÆSI NEXUS real-time chat/console.

Protocol (text-based, simple prefixes):
- Client -> Server:
  - CHAT:<text>             -- user chat to AI (simulated)
  - dirigentCMD:/command    -- terminal command (must start with '/'), e.g. "/build" or "/bygg"

- Server -> Clients (broadcasts):
  - dirigentCHAT_MSG:<text> -- AI response (Reflex/Gemini)
  - reflexSERVER_LOG:<text> -- server/system log or command output

Run: python edge_server.py
Requires: websockets (pip install websockets)
"""

import asyncio
import logging
from typing import Set

import websockets
from websockets.legacy.server import WebSocketServerProtocol

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

CONNECTED: Set[WebSocketServerProtocol] = set()


async def broadcast(message: str):
    """Send message to all connected clients and prune closed connections."""
    if not CONNECTED:
        logging.debug("No clients to broadcast to.")
        return

    logging.info("Broadcasting: %s", message)
    to_remove = set()
    for ws in CONNECTED.copy():
        try:
            await ws.send(message)
        except Exception as e:
            logging.warning("Failed sending to a client, scheduling removal: %s", e)
            to_remove.add(ws)
    for r in to_remove:
        CONNECTED.discard(r)


async def get_gemini_response(query: str) -> str:
    """Simulated AI/Gemini response. Wait ~2s to mimic processing."""
    logging.info("Simulating AI response for query: %s", query)
    await asyncio.sleep(2)
    # Simple simulated reply — replace with real model integration as needed.
    return f"[Gemini-Sim] Echo: {query}"


async def handle_build_command(command: str):
    """Simulate a build command and broadcast multiple log lines as reflexSERVER_LOG."""
    steps = [
        "Initializing build environment...",
        "Installing dependencies...",
        "Compiling sources...",
        "Bundling assets...",
        "Running post-build tasks...",
        "Build completed: index.html and static assets updated."
    ]
    for step in steps:
        await asyncio.sleep(1.0)
        await broadcast(f"reflexSERVER_LOG:{step}")


async def handle_client(ws: WebSocketServerProtocol, path: str):
    """Handler for each connected client websocket."""
    addr = ws.remote_address
    logging.info("Client connected: %s", addr)
    CONNECTED.add(ws)

    # Announce connection
    await broadcast("reflexSERVER_LOG:Client connected.")

    try:
        async for raw_msg in ws:
            logging.info("Received from %s: %s", addr, raw_msg)
            if not isinstance(raw_msg, str):
                logging.warning("Non-text message received, ignoring.")
                continue

            # CHAT handling
            if raw_msg.startswith("CHAT:"):
                query = raw_msg[len("CHAT:"):].strip()
                if not query:
                    await ws.send("reflexSERVER_LOG:Empty CHAT message received.")
                    continue

                ai_reply = await get_gemini_response(query)
                # Send AI response with the required prefix
                await broadcast(f"dirigentCHAT_MSG:{ai_reply}")

            # Command handling
            elif raw_msg.startswith("dirigentCMD:"):
                payload = raw_msg[len("dirigentCMD:"):].strip()
                # Commands may include the leading '/'
                if payload.startswith("/"):
                    cmd = payload[1:].strip()
                else:
                    cmd = payload.strip()

                logging.info("Command requested: %s", cmd)
                if cmd.lower() in ("build", "bygg"):
                    await broadcast("reflexSERVER_LOG:Build command received — starting build simulation.")
                    await handle_build_command(cmd)
                    await broadcast("reflexSERVER_LOG:Build simulation finished.")
                else:
                    msg = f"Unknown command: {cmd}"
                    await broadcast(f"reflexSERVER_LOG:{msg}")

            else:
                # Unrecognized prefix: inform sender
                warn_msg = "Unrecognized message prefix. Use CHAT: or dirigentCMD:/cmd"
                logging.warning("Unrecognized message from client: %s", raw_msg)
                try:
                    await ws.send(f"reflexSERVER_LOG:{warn_msg}")
                except Exception:
                    pass

    except websockets.exceptions.ConnectionClosed as e:
        logging.info("Client disconnected: %s (%s)", addr, e)
    finally:
        CONNECTED.discard(ws)
        await broadcast("reflexSERVER_LOG:Client disconnected.")
        logging.info("Connection handler terminated for: %s", addr)


async def main():
    host = "0.0.0.0"
    port = 8765
    logging.info("Starting WebSocket server on ws://%s:%d", host, port)
    async with websockets.serve(handle_client, host, port):
        # Run forever
        await asyncio.Future()


if __name__ == "__main__":
    # Ensure proper event loop setup and avoid "no running event loop" errors.
    asyncio.run(main())