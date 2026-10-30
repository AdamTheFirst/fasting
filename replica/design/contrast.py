"""WCAG contrast check for every pair in tokens.json, in every theme.

Usage: python3 contrast.py replica/design/tokens.json
A pair is [fg, bg] (needs 4.5:1) or [fg, bg, min] (e.g. 3 for borders, focus rings, large text).
Exits 1 if any pair fails.
"""
import json
import sys


def luminance(hex_colour):
    h = hex_colour.lstrip("#")
    channels = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def main(path):
    tokens = json.load(open(path))
    failures = 0
    for theme, colours in tokens["color"].items():
        print(f"\n{theme}")
        for pair in tokens["pairs"]:
            fg, bg = pair[0], pair[1]
            need = pair[2] if len(pair) > 2 else 4.5
            r = ratio(colours[fg], colours[bg])
            ok = r >= need
            failures += not ok
            print(f"  {'ok  ' if ok else 'FAIL'} {fg:>13} on {bg:<13} {r:5.2f}:1 (needs {need})")
    print(f"\n{failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
