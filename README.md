# dr.clinic — Care Navigator

An independent care-navigation site with clinic lead generation, built with Jekyll and hosted free on GitHub Pages (`main` branch, root).

The site includes:
- a care navigator;
- 34-specialty and 17-clinic-type finders;
- 15 private health tools;
- 22 sourced health guides;
- a video library and an auto-refreshing news pulse;
- a patient match funnel and a clinic partner funnel;
- support, contests, careers and advertising pages;
- full legal and trust pages.

## Go-live checklist
1. **Pages:** Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `/ (root)` → Save.
2. **Custom domain:** `CNAME` already contains `dr.clinic`. At your DNS host, add:
   - `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`;
   - `AAAA` records for `@` pointing to `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and `2606:50c0:8003::153`;
   - `CNAME` `www` pointing to `webworksa1.github.io`.

   Then tick **Enforce HTTPS** in Settings → Pages.
3. **Forms:** submit any form once on the live site, then click FormSubmit's *Activate* email. All forms deliver to the private inbox. The address is assembled in `assets/js/main.js` and never appears in the HTML.
4. **AdSense:**
   - Add the site `dr.clinic`. `ads.txt` and the head script are already in place.
   - Turn on **Auto ads**.
   - In **Privacy & messaging**, publish the *European regulations* and *US state regulations* messages.
   - Request review.
5. **Search Console:** verify the domain and submit `https://dr.clinic/sitemap.xml`.
6. **Donations (optional):** paste PayPal / Stripe / Buy Me a Coffee links into `donate:` in `_config.yml`. The buttons appear automatically.
7. **Daily news automation:** in GitHub, choose *Add file → Create new file*, name it `.github/workflows/update-news.yml`, and paste the contents of `scripts/update-news.yml`. It then refreshes `_data/news.json` every day from NIH, FDA and ScienceDaily via `scripts/update_news.py`, and commits only when headlines change.

## Editing content
- **New guide:** add `_health/your-slug.md` with front matter: `title`, `description`, `category` (`Care navigation` / `Conditions` / `Everyday health`), `updated`, `reading`, `need`, `takeaways`, `sources`. It appears in the library, search, sitemap and RSS automatically.
- **Specialties, clinic types, tools, videos, tips and monthly observances:** edit the YAML files in `_data/`.
- **Ads on or off per page:** front matter `ads: false`. Ads are off on the funnel pages, contact, search and 404.

## Self-updating features
- **Tip of the day and this month's health observance:** rotate automatically in the browser.
- **Copyright year, sitemap, RSS feed and search index:** regenerate on every commit.
- **News headlines:** refreshed daily once the workflow above is active.

## Docs
- `BUILD-PROMPTS.md`: strategy and the phase-wise build prompts.
- `RESEARCH.md`: benchmark of 37 sites, revenue benchmarks, trademark check and verified videos.

© dr.clinic. "dr.clinic" is used as a domain name only. See `/trademark/`.
