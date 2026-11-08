"""Generate simple radar-themed PNG icons for the extension (no external assets needed)."""
from PIL import Image, ImageDraw
import math
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "extension", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

SIZES = [16, 32, 48, 128]

BG = (17, 24, 39, 255)       # slate-900
RING = (56, 189, 248, 255)   # sky-400
SWEEP = (248, 113, 113, 200) # red-400 translucent
DOT = (248, 113, 113, 255)

for size in SIZES:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    r = size * 0.46

    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BG)

    for frac in (1.0, 0.66, 0.33):
        rr = r * frac
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=RING, width=max(1, size // 32))

    d.line([cx, cy - r, cx, cy + r], fill=RING, width=max(1, size // 32))
    d.line([cx - r, cy, cx + r, cy], fill=RING, width=max(1, size // 32))

    sweep_angle = -40
    d.pieslice([cx - r, cy - r, cx + r, cy + r], start=sweep_angle - 35, end=sweep_angle, fill=SWEEP)

    dot_r = max(1.5, size * 0.06)
    dx = cx + r * 0.45 * math.cos(math.radians(-70))
    dy = cy + r * 0.45 * math.sin(math.radians(-70))
    d.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=DOT)

    img.save(os.path.join(OUT_DIR, f"icon{size}.png"))

print("icons written to", OUT_DIR)
