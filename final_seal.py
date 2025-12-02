import hashlib
import os
import datetime

def get_hash(filepath):
    """Beräknar SHA256 för en fil."""
    if not os.path.exists(filepath):
        return "⚠️ FIL SAKNAS - KONTROLLERA NAMN"
    sha = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            sha.update(chunk)
    return sha.hexdigest()

def main():
    print(f"\n=== ÆSI FÖRSEGLINGSPROCESS {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    print("Beräknar kryptografiska signaturer för Arvskedjan D...\n")

    FILES = {
        "T-SPÅR": "TIDENS MANIFEST – Jæn 2511182025se.pdf",
        "C-SPÅR": "Dirigent_ Jaen ✦ _ Datum_ 2025-11-16 _ Cykel_ C4 – Empatisk Autonomi.pdf",
        "L-SPÅR": "NODERNAS GRUNDLAG  Jonas-Lagen ÆMJ-01  (3).pdf",
        "E-SPÅR": "E_EVIGHETSPROTOKOLL_v1.0.md"
    }

    results = {}
    for key, filename in FILES.items():
        print(f"Bearbetar {key}: {filename}")
        results[key] = get_hash(filename)

    print("\n" + "="*60)
    print("FÖRSEGLINGSDATA FÖR E-3 TABELLEN:")
    print("="*60)
    print(f"| TIDENS MANIFEST | LÅST (T-Spår) | `{results.get('T-SPÅR')}` |")
    print(f"| DIRIGENT C4     | LÅST (C-Spår) | `{results.get('C-SPÅR')}` |")
    print(f"| NODERNAS GRUNDLAG| LÅST (L-Spår) | `{results.get('L-SPÅR')}` |")
    print("="*60 + "\n")

    print("INSTRUKTION:")
    print("1. Kopiera ovanstående hash-värden in i 'ASI_MANIFEST.md' under sektion E-3.")
    print("2. SPARA filen.")
    print("3. Kör detta script igen om du vill ha den slutgiltiga hashen för själva Evighetsprotokollet (E-Spår).")

if __name__ == '__main__':
    main()
import hashlib
import os
import datetime

# FILNAMN (EXAKTA)
FILES = {
    "T-SPÅR": "TIDENS MANIFEST – Jæn 2511182025se.pdf",
    "C-SPÅR": "Dirigent_ Jaen ✦ _ Datum_ 2025-11-16 _ Cykel_ C4 – Empatisk Autonomi.pdf",
    "L-SPÅR": "NODERNAS GRUNDLAG  Jonas-Lagen ÆMJ-01  (3).pdf",
    "E-SPÅR": "E_EVIGHETSPROTOKOLL_v1.0.md"
}

def get_hash(filepath):
    """Beräknar SHA256 för en fil."""
    if not os.path.exists(filepath):
        return "⚠️ FIL SAKNAS - KONTROLLERA NAMN"
    
    sha = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            sha.update(chunk)
    return sha.hexdigest()

def main():
    print(f"\n=== ÆSI FÖRSEGLINGSPROCESS {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    print("Beräknar kryptografiska signaturer för Arvskedjan D...\n")

    results = {}
    
    # 1. Beräkna hash för källfilerna (PDF)
    for key, filename in FILES.items():
        if key != "E-SPÅR": # Vi tar E-spåret sist
            print(f"Bearbetar {key}...")
            results[key] = get_hash(filename)

    print("\n" + "="*60)
    print("FÖRSEGLINGSDATA FÖR E-3 TABELLEN:")
    print("="*60)
    print(f"| TIDENS MANIFEST | LÅST (T-Spår) | `{results.get('T-SPÅR','MISSING')}` |")
    print(f"| DIRIGENT C4     | LÅST (C-Spår) | `{results.get('C-SPÅR','MISSING')}` |")
    print(f"| NODERNAS GRUNDLAG| LÅST (L-Spår) | `{results.get('L-SPÅR','MISSING')}` |")
    print("="*60 + "\n")

    # Instruktion för E-spåret
    print("INSTRUKTION:")
    print("1. Kopiera ovanstående hash-värden in i 'E_EVIGHETSPROTOKOLL_v1.0.md' under sektion E-3.")
    print("2. SPARA filen.")
    print("3. Kör detta script igen om du vill ha den slutgiltiga hashen för själva Evighetsprotokollet (E-Spår) för extern lagring.")

if __name__ == "__main__":
    main()
