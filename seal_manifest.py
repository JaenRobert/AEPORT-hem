vimport hashlib
import os
import datetime

def calculate_hash(filename):
    if not os.path.exists(filename):
        return "[FIL SAKNAS - KAN EJ FÖRSEGLA]"
    
    sha256_hash = hashlib.sha256()
    with open(filename, "rb") as f:
        # Läser filen i block för effektivitet
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def seal_system():
    print("=== ÆSI FÖRSEGLINGSPROTOKOLL INITIERAT ===")
    print(f"Tid: {datetime.datetime.now().isoformat()}")
    print("-" * 50)

    # Filer att försegla (Anpassa namn om dina filer heter annorlunda)
    files_to_seal = {
        "EVIGHETSPROTOKOLLET (Master File)": "ASI_MANIFEST.md",
        "GRUNDLAGEN (Foundation)": "edge/foundation.json",
        "EDGE-MOTORN (Koden)": "edge_server.py" 
    }

    for name, filename in files_to_seal.items():
        file_hash = calculate_hash(filename)
        print(f"\nOBJEKT: {name}")
        print(f"FIL:    {filename}")
        print(f"HASH:   {file_hash}")
        print("-" * 50)

    print("\n[INSTRUKTION]")
    print("Kopiera ovanstående HASH-värden.")
    print("Klistra in dem i tabellen under sektion E-3 i ASI_MANIFEST.md.")
    print("När filen sparas med dessa hash-värden är cirkeln sluten.")

if __name__ == "__main__":
    seal_system()
