#!/usr/bin/env python3
"""
Remove outer white matte from the ByMed logo WebP.

Clears neutral matte-white pixels only inside **tight rectangles** at the four
canvas corners (not “top strip ∩ right strip”, which can erase the wordmark).

If you already ran an older version that cleared too much, replace
`public/images/bymed-logo.webp` with the original asset, then run this again.

Usage:
  python scripts/remove-logo-matte.py
  python scripts/remove-logo-matte.py path/to/source.webp   # read source, write default out path
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "public" / "images" / "bymed-logo.webp"


def is_outer_matte_white(r: int, g: int, b: int, a: int) -> bool:
    if a < 200:
        return False
    max_c, min_c = max(r, g, b), min(r, g, b)
    if max_c < 245:
        return False
    if max_c - min_c > 22:
        return False
    return True


def corner_rects(w: int, h: int) -> list[tuple[int, int, int, int]]:
    """
    Return inclusive-exclusive rects (x0, y0, x1, y1) for TL, TR, BL, BR.
    Sized from image dimensions so they stay small vs. the wordmark.
    """
    # Horizontal depth from left/right edges (~7.4% of width, min 96px).
    mx = max(96, int(0.074 * w))
    # Vertical depth from top/bottom (~14% of height, min 72px).
    my = max(72, int(0.14 * h))
    return [
        (0, 0, mx, my),  # TL
        (w - mx, 0, w, my),  # TR
        (0, h - my, mx, h),  # BL
        (w - mx, h - my, w, h),  # BR
    ]


def main() -> None:
    src = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUT
    out = DEFAULT_OUT

    if not src.is_file():
        raise SystemExit(f"Missing source file: {src}")

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    px = img.load()

    rects = corner_rects(w, h)
    cleared = 0
    for x0, y0, x1, y1 in rects:
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b, a = px[x, y]
                if is_outer_matte_white(r, g, b, a):
                    px[x, y] = (0, 0, 0, 0)
                    cleared += 1

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "WEBP", lossless=True, method=6)
    print(
        f"Wrote {out} ({w}x{h}) from {src.name}, "
        f"cleared {cleared} opaque matte pixels in corner rects"
    )


if __name__ == "__main__":
    main()
