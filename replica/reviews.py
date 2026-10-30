"""Rank review rows into themes. Usage: python3 reviews.py reviews.csv --out feedback.md"""
import csv, json, re, sys, argparse, datetime, os
from collections import defaultdict

p = argparse.ArgumentParser()
p.add_argument("csv"); p.add_argument("--out", default="feedback.md")
p.add_argument("--themes", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "themes.json"))
a = p.parse_args()
themes = json.load(open(a.themes))
rows = [r for r in csv.DictReader(open(a.csv)) if r.get("url", "").startswith("http")]
year = datetime.date.today().year

def weight(r):
    w = 1.0
    if r["rating"]:
        w += {1: 1.0, 2: 0.75, 3: 0.5}.get(int(r["rating"]), 0)
    y = int(r["date"][:4])
    w *= 1.0 if year - y <= 2 else 0.6
    return w

hits, unmatched = defaultdict(list), []
for r in rows:
    t = r["text"].lower(); matched = False
    for name, kws in themes.items():
        if any(re.search(k, t) for k in kws):
            hits[name].append(r); matched = True
    if not matched:
        unmatched.append(r)

ranked = sorted(hits.items(), key=lambda kv: -sum(weight(r) for r in kv[1]))
out = [f"# Feedback ranking\n\n{len(rows)} rows from {len({r['source'] for r in rows})} source types, "
       f"{len({r['url'] for r in rows})} pages, {len({r['app'] for r in rows})} apps.\n"]
for name, rs in ranked:
    srcs = {r["source"] for r in rs}; urls = {r["url"] for r in rs}
    thin = " (THIN)" if len(rs) < 3 or len(srcs) < 2 else ""
    out.append(f"\n## {name}{thin}\n\nscore {sum(weight(r) for r in rs):.1f}, {len(rs)} rows, "
               f"{len(srcs)} source types ({', '.join(sorted(srcs))}), {len(urls)} pages\n")
    for r in sorted(rs, key=weight, reverse=True):
        out.append(f"- [{r['app']}, {r['date']}{', ' + r['rating'] + '★' if r['rating'] else ''}]({r['url']}): \"{r['text']}\"")
out.append("\n## Matched no theme (read by hand)\n")
for r in unmatched:
    out.append(f"- [{r['app']}, {r['date']}]({r['url']}): \"{r['text']}\"")
open(a.out, "w").write("\n".join(out) + "\n")
print("\n".join(f"{n}: {len(rs)}" for n, rs in ranked), "\nunmatched:", len(unmatched))
