"""Collect new review rows and append them to reviews.csv. Stdlib only.

Usage: python3 scout.py reviews.csv [--apps apps.json] [--dry-run]

Sources: Apple's customer-reviews RSS (per app, per country) and Reddit search
JSON (per subreddit and query). Both need open network access; this repo's cloud
sandbox blocks them, so run it on a laptop or in an environment that allows
itunes.apple.com and www.reddit.com. Rows already in the CSV (same url + text) are skipped.
"""
import argparse, csv, json, os, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "fasting-scout/0.1 (research; contact via repo)"}

def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        return json.load(r)

def apple_rows(app, app_id, country, pages=3):
    for page in range(1, pages + 1):
        url = f"https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id={app_id}/sortby=mostrecent/json"
        entries = get_json(url).get("feed", {}).get("entry", [])
        if isinstance(entries, dict):
            entries = [entries]
        for e in entries:
            if "im:rating" not in e:  # first entry on page 1 is the app itself
                continue
            text = (e["title"]["label"] + ". " + e["content"]["label"]).strip()
            yield {"source": "app-store", "url": f"https://apps.apple.com/{country}/app/id{app_id}",
                   "date": e["updated"]["label"][:10], "rating": e["im:rating"]["label"],
                   "app": app, "text": " ".join(text.split())}
        time.sleep(1)

def reddit_rows(sub, query, limit=50):
    url = f"https://www.reddit.com/r/{sub}/search.json?q={urllib.parse.quote(query)}&restrict_sr=1&sort=new&limit={limit}"
    for c in get_json(url)["data"]["children"]:
        d = c["data"]
        text = " ".join((d.get("title", "") + ". " + d.get("selftext", "")).split())
        yield {"source": "reddit", "url": "https://www.reddit.com" + d["permalink"],
               "date": time.strftime("%Y-%m-%d", time.gmtime(d["created_utc"])), "rating": "",
               "app": f"r/{sub}", "text": text[:600]}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("csv")
    p.add_argument("--apps", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "apps.json"))
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    cfg = json.load(open(a.apps))
    fields = ["source", "url", "date", "rating", "app", "text"]
    seen = {(r["url"], r["text"]) for r in csv.DictReader(open(a.csv))} if os.path.exists(a.csv) else set()
    new, failed = [], []
    jobs = [(f"apple:{app}:{c}", lambda app=app, i=i, c=c: apple_rows(app, i, c))
            for app, i in cfg["apple"].items() for c in cfg["countries"]]
    jobs += [(f"reddit:{s}:{q}", lambda s=s, q=q: reddit_rows(s, q)) for s in cfg["subreddits"] for q in cfg["queries"]]
    for name, job in jobs:
        try:
            for r in job():
                if (r["url"], r["text"]) not in seen:
                    seen.add((r["url"], r["text"])); new.append(r)
        except Exception as e:  # keep going; report at the end
            failed.append(f"{name}: {e}")
    if not a.dry_run and new:
        exists = os.path.exists(a.csv)
        with open(a.csv, "a", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            if not exists:
                w.writeheader()
            w.writerows(new)
    print(f"{len(new)} new rows{' (dry run)' if a.dry_run else ''}, {len(failed)} failed sources")
    for f in failed:
        print("  failed", f, file=sys.stderr)

if __name__ == "__main__":
    main()
