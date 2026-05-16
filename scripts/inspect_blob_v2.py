import os

FILE = r'video/public/assets/chapter1/ch1_sc01.png'
# Also try test_output.png
FILE2 = r'test_output.png'

def inspect(path):
    if not os.path.exists(path):
        print(f"{path} not found.")
        return
    
    with open(path, 'rb') as f:
        data = f.read()
    
    print(f"--- {path} ---")
    print(f"Size: {len(data)}")
    print(f"Repr: {repr(data)}")

if __name__ == "__main__":
    inspect(FILE)
    inspect(FILE2)
