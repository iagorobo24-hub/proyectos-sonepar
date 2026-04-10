"""
Procesa los logos de marcas: elimina fondo blanco, redimensiona y guarda como PNG transparente
"""
import os
from PIL import Image

INPUT_DIR = "app/public/logos"
OUTPUT_DIR = "app/public/logos-processed"
TARGET_SIZE = (120, 120)  # Tamaño del cuadrado del logo
MARGIN = 12  # Margen interno

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mapeo de archivos originales a nombres limpios
FILES = {
    "schneider.png": "schneider.png",
    "abb.png": "abb.png",
    "siemens.jpg": "siemens.png",
    "mitsubishi.png": "mitsubishi.png",
    "ifm.jpg": "ifm.png",
    "pepperl.png": "pepperl.png",
    "philips.jpg": "philips.png",
    "ledvance.jpg": "ledvance.png",
    "zemper.png": "zemper.png",
    "wallbox.png": "wallbox.png",
    "hager.png": "hager.png",
    "fronius.png": "fronius.png",
    "sma.png": "sma.png",
    "pylontech.png": "pylontech.png",
}

def remove_white_background(img):
    """Elimina fondo blanco/gris claro y lo hace transparente"""
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        # Si el pixel es blanco o casi blanco (gris claro), hacerlo transparente
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def process_logo(input_path, output_path):
    """Procesa un logo: elimina fondo, redimensiona, centra"""
    img = Image.open(input_path)
    
    # Eliminar fondo blanco
    img = remove_white_background(img)
    
    # Calcular dimensiones manteniendo aspect ratio con margen
    w, h = img.size
    aspect = w / h
    
    if aspect > 1:
        new_w = TARGET_SIZE[0] - MARGIN * 2
        new_h = int(new_w / aspect)
    else:
        new_h = TARGET_SIZE[1] - MARGIN * 2
        new_w = int(new_h * aspect)
    
    img = img.resize((new_w, new_h), Image.LANCZOS)
    
    # Crear canvas transparente y centrar el logo
    canvas = Image.new("RGBA", TARGET_SIZE, (255, 255, 255, 0))
    offset_x = (TARGET_SIZE[0] - new_w) // 2
    offset_y = (TARGET_SIZE[1] - new_h) // 2
    canvas.paste(img, (offset_x, offset_y), img)
    
    canvas.save(output_path, "PNG")
    print(f"  ✓ {os.path.basename(output_path)} ({new_w}x{new_h})")

print("Procesando logos...\n")
for original, clean_name in FILES.items():
    input_path = os.path.join(INPUT_DIR, original)
    output_path = os.path.join(OUTPUT_DIR, clean_name)
    
    if os.path.exists(input_path):
        process_logo(input_path, output_path)
    else:
        print(f"  ✗ No encontrado: {original}")

print(f"\nLogos procesados en: {OUTPUT_DIR}")
