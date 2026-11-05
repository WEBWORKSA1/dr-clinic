"""Refresh _data/news.json from public health RSS feeds (run daily by GitHub Actions).
Standard library only. Writes the file only when the headline list changes."""
import json, re, sys, urllib.request, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

FEEDS = [
    ("NIH", "https://www.nih.gov/news-releases/feed.xml"),
    ("U.S. FDA", "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml"),
    ("ScienceDaily", "https://www.sciencedaily.com/rss/health_medicine.xml"),
]
OUT = Path(__file__).resolve().parent.parent / "_data" / "news.json"
MAX_ITEMS, PER_SOURCE = 15, 6

def parse_date(s):
    s = (s or "").strip()
    try:
        return parsedate_to_datetime(s).date()
    except Exception:
        pass
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", s)  # NIH style: Fri, 10/23/2026 - 13:00
    if m:
        return datetime.date(int(m.group(3)), int(m.group(1)), int(m.group(2)))
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return datetime.date(*map(int, m.groups()))
    return None

def parse(xml_bytes, source):
    root = ET.fromstring(xml_bytes)
    items = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip().replace("http://www.fda.gov", "https://www.fda.gov")
        d = parse_date(it.findtext("pubDate"))
        if title and link.startswith("https://") and d:
            items.append({"title": re.sub(r"\s+", " ", title), "link": link, "source": source, "date": d.isoformat()})
    items.sort(key=lambda x: x["date"], reverse=True)
    return items[:PER_SOURCE]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "drclinic-news-bot/1.0 (+https://dr.clinic)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def main():
    collected = []
    for source, url in FEEDS:
        try:
            collected += parse(fetch(url), source)
        except Exception as e:
            print(f"warn: {source}: {e}", file=sys.stderr)
    if not collected:
        print("No items fetched; keeping existing file.")
        return
    collected.sort(key=lambda x: x["date"], reverse=True)
    items = collected[:MAX_ITEMS]
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    if old.get("items") == items:
        print("Headlines unchanged.")
        return
    data = {"updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "items": items}
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(items)} headlines.")

if __name__ == "__main__":
    main()
