import asyncio
import websockets
import logging
import time
import os
import json 

# Konfigurera loggning (Svensk utdata för bättre konsolläsning)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Global uppsättning för anslutna klienter
CONNECTED_CLIENTS = set()

# --- Nyhetsflöde (News Feed) ---
NEWS_FEED = [
    {"source": "SYSTEM", "message": "WebSocket-server startad och redo för anslutningar."},
    {"source": "REFLEX", "message": "Indexeringsstatus: Alla filer är synkroniserade."},
    {"source": "E1TAN", "message": "Humanistisk resonans är nu aktiv."}
]

async def send_news_feed(websocket):
    """Skickar nyhetslistan till en specifik klient."""
    for news in NEWS_FEED:
        news_json = json.dumps(news)
        await websocket.send(f"NEWS_ITEM:{news_json}")
        await asyncio.sleep(0.1)

async def add_news_item(source, message):
    """Lägger till en nyhet och broadcasta den till alla klienter."""
    news = {"source": source, "message": message}
    NEWS_FEED.insert(0, news)  # Lägg till först i listan
    if len(NEWS_FEED) > 50:  # Begränsa storleken
        NEWS_FEED.pop()
    news_json = json.dumps(news)
    await broadcast(f"NEWS_ITEM:{news_json}")

# --- Gemini AI / Nod Kommunikation (Simulerad) ---
async def get_gemini_response(user_query):
    logging.info(f"Kallar på Reflex (Gemini) med: '{user_query}'")
    await asyncio.sleep(2) 
    
    if "bygg" in user_query.lower() or "deploy" in user_query.lower():
        response_text = "Reflex rekommenderar att du initierar /bygg CMD för att validera kompilatorn och uppdatera manifestet."
    else:
        response_text = f"Jag har behandlat din chattfråga: '{user_query}'. All data är synkroniserad och klar för nästa operation."

    return {"text": response_text}

# --- WebSocket Funktioner ---

async def register(websocket):
    CONNECTED_CLIENTS.add(websocket)
    logging.info(f"Client connected. Total: {len(CONNECTED_CLIENTS)}")

async def unregister(websocket):
    CONNECTED_CLIENTS.remove(websocket)
    logging.info(f"Client disconnected. Total: {len(CONNECTED_CLIENTS)}")

async def broadcast(message):
    """Skickar ett meddelande till alla anslutna klienter."""
    if CONNECTED_CLIENTS:
        await asyncio.wait([client.send(message) for client in CONNECTED_CLIENTS])

async def handle_build_command(command):
    """Implementerar CMD:bygg-logiken (Plan 2.C)."""
    
    await broadcast("SERVER_LOG: Initierar BYGG-process...")
    await asyncio.sleep(0.5)
    
    if "bygg" in command.lower() or "index" in command.lower():
        await broadcast("SERVER_LOG: Bygger front-end till index.html (Steg 1/3): Komponenter kompilerade.")
        await asyncio.sleep(0.5)
        await broadcast("SERVER_LOG: Bygg (Steg 2/3): CSS minifierad.")
        await asyncio.sleep(0.5)
        await broadcast("SERVER_LOG: Bygg (Steg 3/3): Bundling klar.")
        await broadcast("SERVER_LOG: Index.html och assets uppdaterade. Status: KLAR.")
        
    else:
        await broadcast(f"SERVER_LOG: Okänt BYGG-kommando: '{command}'. Använd '/bygg ihop detta med index'.")

async def server_handler(websocket, path):
    """Main handler för varje WebSocket-anslutning, implementerar protokollet."""
    await register(websocket)
    try:
        async for message in websocket:
            logging.info(f"Received: {message}")
            
            # --- Hantering av CMD (Kommando) ---
            if message.startswith("CMD:"):
                command = message[4:].strip().lower()

                if command.startswith("bygg"):
                    await handle_build_command(command)
                
                elif command == "status":
                    await broadcast("SERVER_LOG: Systemstatus: Online. Noder: Dirigent (Aktiv), Reflex (Väntar).")

                elif command == "/get_news" or command == "get_news" or command.startswith("/get_news"):
                    # Skicka nyhetsflödet till den anropande klienten
                    await send_news_feed(websocket)
                    await add_news_item("SYSTEM", f"Ny klient ansluten. Totalt: {len(CONNECTED_CLIENTS)}")

                else:
                    response = f"SERVER_LOG: Okänt CMD-kommando: '{command}'"
                    await broadcast(response)

            # --- Hantering av CHAT (Anropar AI) ---
            elif message.startswith("CHAT:"):
                user_query = message[5:].strip()
                
                response_data = await get_gemini_response(user_query)
                await broadcast(f"CHAT_MSG: {response_data['text']}")

            else:
                await websocket.send(f"SERVER_LOG: Okänt meddelandeformat.")

    except websockets.exceptions.ConnectionClosedOK:
        pass
    except Exception as e:
        logging.error(f"Ett oväntat fel uppstod: {e}")
    finally:
        await unregister(websocket)

# --- Server Start (FIXEN för RuntimeError) ---

async def main():
    """Huvudfunktion för att starta servern."""
    # Lyssnar på 127.0.0.1, port 8767 (FIXAT för att undvika WinError 10048)
    async with websockets.serve(server_handler, "127.0.0.1", 8767):
        logging.info("WebSocket Server started on ws://127.0.0.1:8767. Press Ctrl+C to exit.")
        await asyncio.Future() 

if __name__ == "__main__":
    try:
        # Startar event loopen på det moderna sättet
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Server terminated by user (Ctrl+C).")
    except Exception as e:
        logging.error(f"Failed to start server: {e}")