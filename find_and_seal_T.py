import hashlib
import glob
import os

def get_hash(filepath):
    sha = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            sha.update(chunk)
    return sha.hexdigest()

def find_t_track():
    print("--- SÖKER EFTER T-SPÅRET ---")
    # Försök först i arbetsmappen, sedan i Dropbox
    search_paths = [
        '.',
        'C:\\Users\\jaenr\\Dropbox\\Min PC (MSI)\\Downloads'
    ]
    t_file = None
    
    for search_path in search_paths:
        if os.path.isdir(search_path):
            print(f"Söker i: {search_path}")
            pdfs = glob.glob(os.path.join(search_path, '*.pdf'))
            for pdf in pdfs:
                if 'TIDENS' in os.path.basename(pdf).upper():
                    t_file = pdf
                    break
        if t_file:
            break

    if t_file:
        print(f"✅ FIL HITTAD: {t_file}")
        t_hash = get_hash(t_file)
        print(f"🔒 T-HASH: {t_hash}")
        return t_file, t_hash
    else:
        print("❌ KAN INTE HITTA NÅGON PDF SOM HETER 'TIDENS...'.")
        return None, None

if __name__ == '__main__':
    find_and = find_and_seal_T = find_t_track()
    if find_and[1]:
        # Update ASI_MANIFEST.md if placeholder present
        manifest = 'ASI_MANIFEST.md'
        try:
            with open(manifest, 'r', encoding='utf-8') as f:
                content = f.read()
            if '⚠️ FIL SAKNAS - KONTROLLERA NAMN' in content:
                content = content.replace('`⚠️ FIL SAKNAS - KONTROLLERA NAMN`', f'`{find_and[1]}`')
                with open(manifest, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Manifest uppdaterad med T-hash: {find_and[1]}")
            else:
                print('Placeholder för T-spåret inte funnen i manifestet.')
        except Exception as e:
            print(f"Kunde inte uppdatera manifest: {e}")
