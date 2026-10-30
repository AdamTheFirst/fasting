"""Generate tokens.css and tailwind.config.js from tokens.json.

Usage: python3 build_tokens.py replica/design/tokens.json
Never edit the generated files by hand; change tokens.json and rerun.
"""
import json
import os
import sys


def css(tokens):
    def block(colours):
        return "\n".join(f"  --color-{k}: {v};" for k, v in colours.items())

    scale = []
    for k, v in tokens["font"]["size"].items():
        scale.append(f"  --font-size-{k}: {v}px;")
        scale.append(f"  --line-height-{k}: {tokens['font']['lineHeight'][k]}px;")
    scale += [f"  --space-{k}: {v}px;" for k, v in tokens["space"].items()]
    scale += [f"  --radius-{k}: {v}px;" for k, v in tokens["radius"].items()]
    scale += [f"  --shadow-{k}: {v};" for k, v in tokens["shadow"].items()]
    scale += [f"  --motion-{k}: {v};" for k, v in tokens["motion"].items() if not k.startswith("_")]
    light, dark = block(tokens["color"]["light"]), block(tokens["color"]["dark"])
    return f"""/* Generated from tokens.json by build_tokens.py. Do not edit. */
:root {{
{light}
{chr(10).join(scale)}
  color-scheme: light dark;
}}

@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
{dark}
  }}
}}

:root[data-theme="dark"] {{
{dark}
}}

@media (prefers-reduced-motion: reduce) {{
  :root {{ --motion-fast: 0ms linear; --motion-base: 0ms linear; --motion-sheet: 0ms linear; }}
}}
"""


def tailwind(tokens):
    colours = {k: f"var(--color-{k})" for k in tokens["color"]["light"]}
    sizes = {k: [f"var(--font-size-{k})", {"lineHeight": f"var(--line-height-{k})"}] for k in tokens["font"]["size"]}
    theme = {
        "colors": {"transparent": "transparent", "current": "currentColor", **colours},
        "fontSize": sizes,
        "spacing": {k: f"var(--space-{k})" for k in tokens["space"]},
        "borderRadius": {k: f"var(--radius-{k})" for k in tokens["radius"]},
        "boxShadow": {k: f"var(--shadow-{k})" for k in tokens["shadow"]},
    }
    return ("// Generated from tokens.json by build_tokens.py. Do not edit.\n"
            "// Components use role classes only (bg-surface text-muted), never raw hex.\n"
            "// Works with Tailwind on web and NativeWind on React Native.\n"
            f"module.exports = {{\n  darkMode: ['selector', '[data-theme=\"dark\"]'],\n  theme: {json.dumps(theme, indent=2)},\n}};\n")


if __name__ == "__main__":
    path = sys.argv[1]
    tokens = json.load(open(path))
    out = os.path.dirname(path)
    open(os.path.join(out, "tokens.css"), "w").write(css(tokens))
    open(os.path.join(out, "tailwind.config.js"), "w").write(tailwind(tokens))
    print("wrote tokens.css and tailwind.config.js")
