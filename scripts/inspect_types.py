from google.genai import types
import inspect

print("Attributes of types.GenerateContentConfig:")
for name in dir(types.GenerateContentConfig):
    if not name.startswith('_'):
        print(name)

print("\nAttributes of types.ImageGenerationConfig (if exists):")
if hasattr(types, 'ImageGenerationConfig'):
    for name in dir(types.ImageGenerationConfig):
         if not name.startswith('_'):
            print(name)
else:
    print("types.ImageGenerationConfig not found.")
