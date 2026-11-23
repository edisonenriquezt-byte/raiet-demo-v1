"""Valida los iconos originales de RAIET sin modificarlos. Edición DEMO PRO."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
for name, size in (("icon-192.png", (192, 192)), ("icon-512.png", (512, 512))):
    path = root / name
    assert path.exists(), f"Falta el logo original RAIET: {name}"
    with Image.open(path) as picture:
        assert picture.size == size and picture.format == "PNG", f"Formato incorrecto del logo: {name}"
    print("Logo original RAIET validado:", name)
