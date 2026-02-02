import os
import shutil

# Source directory
src_dir = r"C:\Users\26320\Desktop\女神异闻录project\phantom-lib\public\tarot"

# Get all files sorted
files = sorted([f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))])

print(f"Found {len(files)} files")

# Tarot arcana names (0-XXI, 22 major arcana)
arcana_numbers = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"]

# Only use first 22 files for the 22 major arcana
files_to_use = files[:22]

print("\nRenaming files:")
for i, (arcana, old_file) in enumerate(zip(arcana_numbers, files_to_use)):
    old_path = os.path.join(src_dir, old_file)
    
    # Determine file extension
    if old_file.endswith('.avif'):
        ext = '.avif'
    elif old_file.endswith('.webp'):
        ext = '.webp'
    else:
        ext = '.jpg'
    
    new_file = f"arcana_{arcana}{ext}"
    new_path = os.path.join(src_dir, new_file)
    
    # Create a temp name first to avoid conflicts
    temp_path = os.path.join(src_dir, f"temp_{i}{ext}")
    
    try:
        shutil.copy2(old_path, temp_path)
        print(f"{i}: {old_file} -> temp_{i}{ext}")
    except Exception as e:
        print(f"Error copying {old_file}: {e}")

print("\nRenaming temp files to final names:")
for i, arcana in enumerate(arcana_numbers):
    # Find temp file
    temp_files = [f for f in os.listdir(src_dir) if f.startswith(f"temp_{i}")]
    if temp_files:
        temp_file = temp_files[0]
        ext = os.path.splitext(temp_file)[1]
        
        temp_path = os.path.join(src_dir, temp_file)
        new_file = f"arcana_{arcana}{ext}"
        new_path = os.path.join(src_dir, new_file)
        
        try:
            shutil.move(temp_path, new_path)
            print(f"{arcana}: {temp_file} -> {new_file}")
        except Exception as e:
            print(f"Error renaming {temp_file}: {e}")

print("\n✓ Renaming complete!")
