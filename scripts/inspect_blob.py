import os

FILE = r'video/public/assets/chapter1/ch1_sc01.png'

def inspect():
    if not os.path.exists(FILE):
        print("File not found.")
        return
    
    with open(FILE, 'rb') as f:
        data = f.read()
    
    print(f"Size: {len(data)}")
    print(f"First 100 bytes (hex): {data[:100].hex()}")
    try:
        print(f"As text: {data.decode('utf-8')}")
    except:
        print("Not valid utf-8")

if __name__ == "__main__":
    inspect()
