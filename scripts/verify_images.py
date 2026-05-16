import os

DIR = r'video/public/assets/chapter1'

def verify():
    if not os.path.exists(DIR):
        print("Directory not found.")
        return

    files = os.listdir(DIR)
    valid_count = 0
    invalid_count = 0
    
    for f in files:
        path = os.path.join(DIR, f)
        if os.path.isfile(path) and f.endswith('.png'):
            if os.path.getsize(path) > 1000:
                valid_count += 1
            else:
                invalid_count += 1
                
    print(f"Valid Images (>1KB): {valid_count}")
    print(f"Invalid Images (<=1KB): {invalid_count}")
    print(f"Total Files: {len(files)}")

if __name__ == "__main__":
    verify()
