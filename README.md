# poopSec 💩🔒

> a free, no-bs web security scanner that runs entirely in your browser and actually tells you what's wrong in plain english

---

## what is this

so basically i got tired of every security scanner being either:
- behind a $500/month paywall
- requiring you to sign up and give them your email and firstborn child
- giving you a 40 page PDF report that says "high risk" and then doesn't tell you what to actually do about it

so i built poopSec. it scans your site, tells you what's broken, and gives you the exact config lines to fix it. that's it.

---

## what it checks

- **security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORS, COEP, COOP, CORP, and more
- **HTTPS status** — is your site even encrypted? (you'd be surprised)
- **info leakage** — server header, X-Powered-By, ASP.NET version, Via header — all the stuff that tells attackers exactly what software you're running
- **tech fingerprinting** — detects your stack from headers and HTML body (nginx, Apache, PHP, Node, React, Next.js, WordPress, Shopify, Cloudflare, AWS, and like 30 more)
- **cookie flags** — Secure, HttpOnly, SameSite — audited for every cookie your site sets
- **DNS email security** — SPF and DMARC records checked and graded. missing these = anyone can spoof your domain in emails
- **SRI checks** — external scripts and stylesheets without integrity hashes are a supply chain risk waiting to happen
- **mixed content** — HTTP resources on HTTPS pages get flagged
- **redirect audit** — HTTP → HTTPS redirect check, www vs non-www canonicalization
- **subdomain exposure** — probes common admin/internal subdomains (jenkins, grafana, phpmyadmin, staging, etc.) to see what's publicly resolving

---

## what you get back

- a **score out of 100** with a letter grade (A through F)
- every finding sorted by severity — Critical → High → Medium → Low
- **plain english descriptions** of what's wrong and why it matters
- **exact fix instructions** with copy-paste config snippets
- an **auto-generated config** for nginx, Apache (.htaccess), and Express.js/helmet — just paste and you're done
- tech stack breakdown
- cookie audit table
- raw headers table (sorted alphabetically)
- export to JSON or text report

---

## how to use it

- drop the HTML file anywhere — no server needed, no install, just open it in a browser
- paste your URL into the box
- toggle the scan options you want (or leave them all on, recommended)
- hit ⚡ Scan
- read the results, fix your stuff

that's the whole thing. no accounts. no tracking. nothing leaves your browser.

---

## the globe is just vibes btw

yeah the spinning 3D globe with the attack arcs and SYN FLOOD badges is purely aesthetic. it serves zero functional purpose and i'm not even a little sorry about it. it does look sick though.

- real perspective projection (not flat sphere pretending to be 3D)
- depth-shaded nodes — closer ones are bigger and brighter
- specular highlight and atmospheric limb glow
- great-circle arcs that actually follow the sphere surface
- attack labels pop in around it every few seconds (SYN FLOOD, XSS PROBE, SQLI SCAN, etc.)
- three orbital rings at different speeds

---

## scan options

all toggleable from the UI before you scan:

- 🛡 **Headers** — the core security header checks
- 🔍 **Info Leak** — server/framework version disclosure
- 🍪 **Cookies** — cookie flag audit
- 🔒 **HTTPS** — basic encryption check
- 🧬 **Tech ID** — stack fingerprinting
- 🌐 **DNS** — SPF/DMARC/subdomain checks
- 🔄 **Redirects** — HTTP→HTTPS and www canonicalization
- 🔐 **SRI Check** — subresource integrity on external scripts/styles
- 🚪 **Open Ports** — sensitive subdomain probe

---

## scoring

starts at 100, deductions are:

| severity | points lost |
|----------|-------------|
| critical | −25 |
| high | −15 |
| medium | −8 |
| low | −3 |
| info | −1 |
| passing | +4 |

grade cutoffs: A = 90+, B = 75+, C = 60+, D = 40+, F = below 40

---

## limitations (be real about it)

- **it uses public CORS proxies** to fetch your site — some sites block these, some proxies strip certain headers, results might vary
- **can't scan localhost or internal IPs** — it needs a publicly reachable URL
- **cookie detection is limited** — proxies often strip Set-Cookie headers, so the cookie audit works best when you check directly in devtools
- **DNS subdomain probe** only checks the top 10 common sensitive subdomains — not a replacement for a full subdomain enumeration tool
- **SRI and redirect checks are best-effort** — proxy limitations mean some results may be inconclusive
- **no active vulnerability scanning** — this is a passive config auditor, not a pen testing tool. it doesn't probe for SQLi, XSS, RCE, etc.
- **if something's wrong with your results** run `curl -IL yoursite.com` locally for the ground truth on headers

---

## privacy

- everything runs locally in your browser
- no data is sent to any server i control
- scan history only lives in memory — cleared when you close the tab
- the only external calls are: the CORS proxies to fetch your target site, Cloudflare's DNS-over-HTTPS for DNS lookups, and Google Fonts for the typefaces

---

## tech used

- vanilla HTML/CSS/JS — zero dependencies, zero build step
- Canvas API for the globe (from scratch, no library)
- Cloudflare DoH (`1.1.1.1/dns-query`) for DNS lookups
- allorigins.win + corsproxy.io + thingproxy as CORS proxies (with fallback chain)
- JetBrains Mono + Inter from Google Fonts

---

## running it

just open the `.html` file in any modern browser. seriously that's it.

```
open index.html
or Go to the hosted website by poop Org India
```

or drag it into your browser. or host it on GitHub Pages. or put it on a USB stick and hand it to your coworker who thinks their site is secure because it has a padlock.

---

## made by

**Hardik** — [poop Organization](https://poop.org.in/), India 🇮🇳

built because security should be accessible to everyone, not just companies with security teams and money. free forever.

---

*v1.4.0 — if you find bugs, that's just a feature of the poopSec experience*
