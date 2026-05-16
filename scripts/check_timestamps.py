import os
import time

DIR = r'video/public/assets/chapter1'
now = time.time()

print("Checking recent updates (threshold: 300 seconds ago):")

for i in range(1, 33):
    fname = f"ch1_sc{i:02d}.png"
    path = os.path.join(DIR, fname)
    if os.path.exists(path):
        mtime = os.path.getmtime(path)
        diff = now - mtime
        if diff < 1000: # 10 mins
            # Recent
            pass
        else:
             print(f"WARNING: {fname} is OLD! (Age: {diff:.1f}s)")
    else:
        print(f"MISSING: {fname}")
