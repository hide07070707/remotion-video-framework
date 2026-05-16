import os
import glob

BASE_DIR = r'c:\Users\suppo\OneDrive\デスクトップ\my-new-app\video\public\assets'

def cleanup():
    # Find all PNGs in chapter folders
    patterns = [
        os.path.join(BASE_DIR, 'chapter*', '*.png'),
    ]
    
    count = 0
    for pat in patterns:
        files = glob.glob(pat)
        for f in files:
            # Check size. If small text file, delete.
            # Real images are usually > 100KB. 
            # Error files are < 1KB.
            size = os.path.getsize(f)
            if size < 20000: # 20KB
                print(f"Deleting invalid image: {f} ({size} bytes)")
                try:
                    os.remove(f)
                    count += 1
                except Exception as e:
                    print(f"Error deleting {f}: {e}")
            else:
                print(f"Keeping valid image: {f} ({size} bytes)")

    print(f"Cleanup complete. Deleted {count} files.")

if __name__ == "__main__":
    cleanup()
