# Ishitechno Projects — Multi-Service Platform Migration Plan

This document explains how the existing **IshiTrackers** project (uploaded ZIP) was inspected and
turned into the multi-service **ishitechnoprojects.in** platform, and how to deploy/maintain it.

---

## A. Current Architecture (before this change)

- Single GitHub Pages site, deployed from repo root.
- `index.html` at the root **was** the IshiTrackers marketing/login landing page.
- Pages: `index.html`, `login.html`, `register.html`, `dashboard.html`, `map.html`,
  `history.html`, `profile.html`, `admin.html`, `about.html`.
- Shared `css/style.css` (dark enterprise theme) and `js/firebase-config.js`
  (Firebase compat SDK, project `ishitrackers`).
- `functions/` — Cloud Functions for GPS device ingestion (`ingestLocation`, offline checker).
- `database.rules.json` — Realtime Database security rules for `users`, `devices`,
  `locations`, `history`, `alerts`, `geofences`.
- `CNAME` → `ishitechnoprojects.in` at repo root.
- All internal links/paths are **relative** (no absolute `/...` paths), which made this
  migration safe.

## B. Proposed Architecture (implemented)

- **Path-based sections under one GitHub Pages repo + one custom domain** (recommended
  over subdomains — see Section F below for why).
- The entire original app was moved **verbatim** into `/trackers/` (only a single
  cosmetic "← Ishitechno Projects" back-link was added to its public landing page nav;
  every internal route, filename, and Firebase call is untouched).
- A new company-wide homepage, About, Contact, Schools, Colleges, Business, IoT and
  Robotics sections were added at the root, sharing a new `css/site.css` design system
  that is completely separate from the tracker app's `css/style.css` (no class-name or
  variable collisions).
- Same Firebase project (`ishitrackers`) is reused for the new **enquiries** feature
  (Business + Contact forms), writing only to a new top-level `/enquiries` node —
  never touching `users/devices/locations/history/alerts/geofences`.

## C. Folder Structure

```
/ (repo root)
├── index.html                 # NEW — main company homepage
├── about.html                 # UPDATED — company About page (re-themed, same content)
├── contact.html                # NEW — contact page + general enquiry form
├── CNAME                        # unchanged — ishitechnoprojects.in
├── robots.txt                    # NEW
├── sitemap.xml                    # NEW
├── MIGRATION_PLAN.md               # this file
├── css/
│   └── site.css                     # NEW — company design system (navy/blue/green/orange)
├── js/
│   ├── site.js                       # NEW — nav toggle, WhatsApp link helper
│   └── firebase-company.js            # NEW — Firebase init, writes only to /enquiries
├── schools/
│   └── index.html                      # NEW — School Projects section
├── colleges/
│   └── index.html                       # NEW — College Projects section
├── business/
│   └── index.html                        # NEW — Business Solutions + enquiry form
├── iot/
│   └── index.html                         # NEW — IoT Projects showcase
├── robotics/
│   └── index.html                          # NEW — Robotics Projects showcase
└── trackers/                                # MOVED — the entire original project, untouched
    ├── index.html   (public landing — added 1 back-link only)
    ├── login.html, register.html, dashboard.html, map.html, history.html, profile.html
    ├── admin.html                             # UPDATED — added "Company Enquiries" tab only
    ├── css/style.css                           # unchanged
    ├── js/firebase-config.js, login.js, register.js, dashboard.js, map.js
    ├── js/admin.js                              # UPDATED — added enquiries tab logic only
    ├── functions/                                # unchanged (Cloud Functions)
    ├── firebase-schema.json, DEPLOYMENT_GUIDE.md, AUDIT_REPORT.md  # unchanged
    └── database.rules.json                        # UPDATED — added `enquiries` node rules only
```

## D. URL Structure

| URL | Purpose |
|---|---|
| `https://ishitechnoprojects.in/` | Main company homepage |
| `https://ishitechnoprojects.in/schools/` | School Projects |
| `https://ishitechnoprojects.in/colleges/` | College Projects |
| `https://ishitechnoprojects.in/business/` | Business / Industrial Solutions |
| `https://ishitechnoprojects.in/iot/` | IoT Projects |
| `https://ishitechnoprojects.in/robotics/` | Robotics Projects |
| `https://ishitechnoprojects.in/trackers/` | **Existing IshiTrackers app (unchanged)** |
| `https://ishitechnoprojects.in/about.html` | About |
| `https://ishitechnoprojects.in/contact.html` | Contact |

## E. GitHub Pages Strategy — Path-based vs Subdomains

**Recommendation: path-based folders under one repo (implemented), not subdomains.**

| | Path-based (`/trackers/`) | Subdomains (`trackers.ishitechnoprojects.in`) |
|---|---|---|
| GitHub Pages cost | Free, single repo, single Pages deployment | Needs either multiple repos (each with its own Pages site) or a Pages "monorepo" trick; more DNS records |
| DNS | One `A`/`ALIAS` record (root) + one `CNAME` (www) — already set up | One `CNAME` record per subdomain, pointing each to its own GitHub Pages target |
| Firebase Auth "Authorized domains" | Add **one** domain (`ishitechnoprojects.in`) — trackers under `/trackers/` inherit it automatically | Must add **every subdomain** separately |
| SSL | One certificate (GitHub Pages auto-provisions via Let's Encrypt) | One certificate per subdomain (still automatic, but more to keep track of) |
| Independence of failure | A broken build to `/schools/` cannot break `/trackers/` — they're just different folders served statically | Same isolation, but at the cost of the DNS/Firebase overhead above |
| Best fit for a free/no-server setup | ✅ Yes | Works, but adds operational overhead for no real benefit here |

Since you're on GitHub Pages with **no paid server**, path-based folders give you the same
"independent sections" behaviour (a bad file in `/schools/` cannot break `/trackers/`)
without the extra DNS records and extra Firebase-authorized-domain entries that subdomains
would require. This is why the implementation above uses folders, not subdomains.

## F. Firebase Strategy

- **Do not create a second Firebase project.** The existing `ishitrackers` project is reused.
- Tracker data (`users`, `devices`, `locations`, `history`, `alerts`, `geofences`) is
  untouched — same schema, same rules, same Cloud Functions.
- One new top-level node, `enquiries`, was added for the company site's forms
  (Business page + Contact page). It is written by **anyone** (no login required, since
  a prospective customer isn't a registered tracker user) but can only be **read** by an
  authenticated tracker admin — see `trackers/database.rules.json`.
- School/College project catalogues are currently **static JS data arrays** embedded in
  `schools/index.html` and `colleges/index.html` (no database needed to display them).
  This keeps the initial launch simple; see Section G below for how to move them into
  Firebase later without breaking anything.

## G. DNS Strategy

No DNS changes are required for this migration — the same `CNAME` (`ishitechnoprojects.in`
→ `<username>.github.io`) already in the repo continues to work, because path-based routing
doesn't need new DNS records. Keep the existing setup:

1. Registrar → `A` records for the apex domain pointing at GitHub Pages IPs
   (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), **or** an `ALIAS`/`ANAME` record
   to `<username>.github.io` if your DNS provider supports it.
2. Optional `www` → `CNAME` → `<username>.github.io`.
3. GitHub repo → Settings → Pages → Custom domain → `ishitechnoprojects.in` → Enforce HTTPS.

(If you later decide you *do* want a subdomain for Trackers instead of `/trackers/`, add a
`CNAME` record for `trackers` → `<username>.github.io`, create a second repo with its own
`CNAME` file containing `trackers.ishitechnoprojects.in`, and add that subdomain to Firebase
Authorized Domains.)

## H. Security Considerations

- No Firebase Admin SDK credentials exist anywhere in this frontend code (only the public
  web `apiKey`/config, which is expected to be public for Firebase web apps and is already
  restricted by the Realtime Database security rules).
- `trackers/database.rules.json` was extended, not replaced:
  - Existing rules for `users`, `devices`, `locations`, `history`, `alerts`, `geofences`
    are byte-for-byte the same.
  - New `enquiries` rule: public **create-only** write (`!data.exists()` prevents anyone
    from overwriting or deleting another person's enquiry), admin-only read.
- The company site's enquiry forms only ever call `submitEnquiry()`
  (`js/firebase-company.js`), which writes exclusively to `/enquiries` — it has no
  reference to any tracker node.
- Remember to **publish** the updated `trackers/database.rules.json` to the Firebase
  Console (Realtime Database → Rules) — copying the file into the repo alone does not
  change the live rules.
- Tracker device secret keys, Cloud Function internals, and admin-only screens remain
  exactly as they were — the audit already performed in `AUDIT_REPORT.md` (in `/trackers/`)
  still applies.

## I. Migration Steps (already performed)

1. Inspected every existing file, Firebase config, database schema, rules and Cloud
   Functions (see `trackers/DEPLOYMENT_GUIDE.md`, `trackers/firebase-schema.json`,
   `trackers/AUDIT_REPORT.md`).
2. Confirmed all internal links use relative paths (no absolute `/...` paths) — this
   made a verbatim folder move safe.
3. Copied the entire original project into `/trackers/`.
4. Removed the now-duplicated root-only files from that copy (`CNAME`, and the old
   `about.html`, since it's re-themed and promoted to the site-wide About page).
5. Added a single back-link in `trackers/index.html`'s nav bar for cross-navigation.
6. Built the new root company site (`index.html`, `about.html`, `contact.html`,
   `schools/`, `colleges/`, `business/`, `iot/`, `robotics/`) on a brand-new,
   independent `css/site.css` design system.
7. Wired the Business and Contact enquiry forms to Firebase (`/enquiries` node only).
8. Extended `trackers/database.rules.json` with rules for `/enquiries` (additive only).
9. Added an additive "Company Enquiries" tab to `trackers/admin.html` /
   `trackers/js/admin.js` so admins can view and update enquiry status from the same
   admin panel they already use — the Devices/Users/Alerts tabs are untouched.
10. Added `robots.txt`, `sitemap.xml`, per-page meta descriptions/titles and Open Graph
    tags, and JSON-LD Organization structured data on the homepage.

## J. Files Created / Modified

**New files:** `index.html`, `contact.html`, `css/site.css`, `js/site.js`,
`js/firebase-company.js`, `schools/index.html`, `colleges/index.html`,
`business/index.html`, `iot/index.html`, `robotics/index.html`, `robots.txt`,
`sitemap.xml`, `MIGRATION_PLAN.md`.

**Modified (content re-themed, functionality identical or additive):**
`about.html` (re-styled with the new design system; same information),
`trackers/index.html` (added one nav back-link),
`trackers/admin.html` (added one new tab),
`trackers/js/admin.js` (added one new, self-contained function block),
`trackers/database.rules.json` (added one new top-level `enquiries` rule block).

**Moved, otherwise byte-for-byte unchanged:** `login.html`, `register.html`,
`dashboard.html`, `map.html`, `history.html`, `profile.html`, `css/style.css`,
`js/firebase-config.js`, `js/login.js`, `js/register.js`, `js/dashboard.js`, `js/map.js`,
`functions/`, `firebase-schema.json`, `DEPLOYMENT_GUIDE.md`, `AUDIT_REPORT.md` — all now
live under `/trackers/`.

## Deployment Instructions

```bash
# from inside the new site folder (repo root)
git init                       # if starting a fresh repo, otherwise skip
git add .
git commit -m "Launch Ishitechno Projects multi-service platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Then:
1. GitHub repo → **Settings → Pages** → Source: `Deploy from a branch` → `main` → `/ (root)`.
2. Confirm **Custom domain** still shows `ishitechnoprojects.in` (from the `CNAME` file) and
   **Enforce HTTPS** is checked.
3. Firebase Console → **Realtime Database → Rules** → paste the updated
   `trackers/database.rules.json` → Publish.
4. Firebase Console → **Authentication → Settings → Authorized domains** → confirm
   `ishitechnoprojects.in` is present (path-based routing means no new domains needed).
5. Cloud Functions, if you ever redeploy them, are unaffected — they live in
   `trackers/functions/` and are deployed independently of GitHub Pages
   (`firebase deploy --only functions`), exactly as documented in
   `trackers/DEPLOYMENT_GUIDE.md`.

## Testing Checklist

- [ ] `/` loads the new homepage with all 4 service cards linking correctly.
- [ ] `/schools/`, `/colleges/` filter buttons work and each "Request" button opens
      WhatsApp with the correct pre-filled message.
- [ ] `/business/` enquiry form submits successfully and a new record appears under
      `/enquiries` in the Firebase Console.
- [ ] `/contact.html` form submits successfully.
- [ ] `/trackers/` loads exactly as before: login, register, dashboard, map, history,
      profile and admin all work unchanged.
- [ ] `/trackers/admin.html` → **Company Enquiries** tab shows submitted enquiries and
      status can be updated.
- [ ] All nav links (desktop) and the hamburger menu (mobile) work on every page.
- [ ] Floating WhatsApp button appears on every company page.

## Mobile Testing Checklist

- [ ] Nav collapses into a hamburger menu below ~720px on every company page.
- [ ] Service/project cards stack into a single column on small screens.
- [ ] Enquiry/contact forms remain usable (inputs full-width, no horizontal scroll).
- [ ] Tracker app's existing mobile behaviour (sidebar toggle, responsive tables) is
      unaffected, since none of its CSS/JS was modified beyond the two additive pieces
      noted above.

## Security Checklist

- [ ] Updated `database.rules.json` published to Firebase Console.
- [ ] No Firebase Admin SDK key anywhere in any HTML/JS file (only the public web config).
- [ ] `/enquiries` confirmed create-only for the public, read-only for admins.
- [ ] Existing tracker rules re-verified unchanged after publishing.
- [ ] HTTPS enforced on the custom domain.

## SEO Checklist

- [ ] Each page has a unique `<title>` and meta description (done — see each file's `<head>`).
- [ ] Open Graph tags present on homepage; extend to other pages as needed.
- [ ] `sitemap.xml` and `robots.txt` deployed at the domain root.
- [ ] JSON-LD Organization schema present on homepage.
- [ ] Submit `https://ishitechnoprojects.in/sitemap.xml` in Google Search Console after deployment.
