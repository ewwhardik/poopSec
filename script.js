/* ═══════════════════════════════════════════════════
   WeFixSec — script.js
   Globe · Scanner · Analysis · Render
   ═══════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────
   GLOBE — 3D with depth shading, attack effects, arcs
   ───────────────────────────────────────────────────── */
(function initGlobe() {
  const cv  = document.getElementById('globe-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 320, R = 130, cx = 160, cy = 160;
  let rot = 0;
  const TILT = 0.18;
  let nodes = [], conns = [], arcs = [], scanPulses = [];
  let frameCount = 0;

  // Generate nodes (city clusters)
  for (let i = 0; i < 160; i++) {
    const lat = (Math.random() - .5) * Math.PI;
    const lng = Math.random() * Math.PI * 2;
    nodes.push({
      lat, lng,
      size: Math.random() > .93 ? 3 : Math.random() > .75 ? 1.8 : 0.9,
      col:  Math.random() > .96 ? 'atk' : Math.random() > .82 ? 'hot' : 'dim',
      pulse: Math.random() > .9
        ? { t: Math.random() * Math.PI * 2, spd: .04 + Math.random() * .03 }
        : null
    });
  }

  // Fixed connection lines
  for (let i = 0; i < 22; i++) {
    const a = Math.floor(Math.random() * nodes.length);
    const b = Math.floor(Math.random() * nodes.length);
    const dist = Math.abs(nodes[a].lat - nodes[b].lat) + Math.abs(nodes[a].lng - nodes[b].lng);
    if (dist < 2.5) {
      conns.push({ a, b, alpha: .15 + Math.random() * .2, atk: Math.random() > .85 });
    }
  }

  function project(lat, lng) {
    const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
    const x0 = R * Math.cos(lat) * Math.sin(lng + rot);
    const y0 = R * Math.sin(lat);
    const z0 = R * Math.cos(lat) * Math.cos(lng + rot);
    const y1 = y0 * cosT - z0 * sinT;
    const z1 = y0 * sinT + z0 * cosT;
    const persp = 1 + z1 / (R * 3.5);
    return {
      x: cx + x0 * persp,
      y: cy - y1 * persp,
      z: z1,
      depth: (z1 + R) / (2 * R),
      visible: z1 > -R * .1
    };
  }

  function drawArc(a, b, color, progress, width) {
    const steps = 40;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= steps * progress; i++) {
      const t = i / steps;
      const lat  = a.lat + (b.lat - a.lat) * t;
      const lng  = a.lng + (b.lng - a.lng) * t;
      const lift = Math.sin(t * Math.PI) * .22;
      const liftedR = R * (1 + lift);
      const p = project(lat, lng);
      const lx = cx + (p.x - cx) * (liftedR / R);
      const ly = cy + (p.y - cy) * (liftedR / R);
      if (p.visible) {
        if (!started) { ctx.moveTo(lx, ly); started = true; }
        else ctx.lineTo(lx, ly);
      } else { started = false; }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 0.8;
    ctx.stroke();
  }

  function spawnAttack() {
    if (nodes.length < 2) return;
    const srcI = Math.floor(Math.random() * nodes.length);
    let dstI;
    do { dstI = Math.floor(Math.random() * nodes.length); } while (dstI === srcI);
    arcs.push({
      src: nodes[srcI],
      dst: nodes[dstI],
      progress: 0,
      spd: .004 + Math.random() * .006,
      color: Math.random() > .5 ? 'rgba(229,0,10,0.7)' : 'rgba(255,80,0,0.5)',
      width: .6 + Math.random() * .8,
      done: false
    });
  }

  function spawnAtkBadge() {
    const labels = ['SYN FLOOD','BRUTE FORCE','XSS PROBE','SQLI SCAN','PORT SCAN','DDOS','MITM','RECON','CVE PROBE','RCE TEST'];
    const wrap   = document.getElementById('globe-wrap');
    const badge  = document.createElement('div');
    badge.className = 'atk-badge';
    badge.textContent = labels[Math.floor(Math.random() * labels.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist  = 105 + Math.random() * 55;
    badge.style.left = (160 + Math.cos(angle) * dist) + 'px';
    badge.style.top  = (160 + Math.sin(angle) * dist) + 'px';
    wrap.appendChild(badge);
    requestAnimationFrame(() => {
      badge.style.opacity   = '1';
      badge.style.transform = 'scale(1)';
    });
    setTimeout(() => { badge.style.opacity = '0'; badge.style.transform = 'scale(.6)'; }, 1200);
    setTimeout(() => badge.remove(), 1600);
  }

  function spawnPulse(node) {
    scanPulses.push({ node, r: 0, maxR: 18, alpha: .7, done: false });
  }

  function draw() {
    ctx.clearRect(0, 0, W, W);
    frameCount++;

    // Base sphere gradient
    const grd = ctx.createRadialGradient(cx - R * .28, cy - R * .22, R * .05, cx, cy, R);
    grd.addColorStop(0,   'rgba(60,0,0,0.18)');
    grd.addColorStop(.35, 'rgba(15,0,0,0.35)');
    grd.addColorStop(.7,  'rgba(0,0,0,0.5)');
    grd.addColorStop(1,   'rgba(0,0,0,0.88)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();

    // Specular highlight
    const spec = ctx.createRadialGradient(cx - R * .38, cy - R * .32, 1, cx - R * .3, cy - R * .25, R * .55);
    spec.addColorStop(0,  'rgba(255,180,160,0.10)');
    spec.addColorStop(.4, 'rgba(229,0,10,0.04)');
    spec.addColorStop(1,  'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = spec; ctx.fill();

    // Latitude lines
    for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += Math.PI / 9) {
      ctx.beginPath();
      let first = true;
      for (let lng = 0; lng <= Math.PI * 2; lng += 0.04) {
        const p = project(lat, lng);
        if (p.visible) {
          if (first) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
          first = false;
        } else { first = true; }
      }
      ctx.strokeStyle = 'rgba(229,0,10,0.10)'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Longitude lines
    for (let lng = 0; lng < Math.PI * 2; lng += Math.PI / 9) {
      ctx.beginPath();
      let first = true;
      for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.04) {
        const p = project(lat, lng);
        if (p.visible) {
          if (first) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
          first = false;
        } else { first = true; }
      }
      ctx.strokeStyle = 'rgba(229,0,10,0.07)'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Connection lines
    conns.forEach(c => {
      const a = project(nodes[c.a].lat, nodes[c.a].lng);
      const b = project(nodes[c.b].lat, nodes[c.b].lng);
      if (a.visible && b.visible) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        const depthAlpha = ((a.depth + b.depth) / 2);
        ctx.strokeStyle = c.atk
          ? `rgba(229,0,10,${0.35 * depthAlpha})`
          : `rgba(180,180,255,${c.alpha * depthAlpha * .5})`;
        ctx.lineWidth = c.atk ? 0.8 : 0.5;
        ctx.stroke();
      }
    });

    // Attack arcs
    arcs = arcs.filter(arc => !arc.done);
    arcs.forEach(arc => {
      arc.progress = Math.min(1, arc.progress + arc.spd);
      if (arc.progress >= 1) { arc.done = true; return; }
      drawArc(arc.src, arc.dst, arc.color, arc.progress, arc.width);
      const t   = arc.progress;
      const lat = arc.src.lat + (arc.dst.lat - arc.src.lat) * t;
      const lng = arc.src.lng + (arc.dst.lng - arc.src.lng) * t;
      const lift = Math.sin(t * Math.PI) * .22;
      const p    = project(lat, lng);
      const lx   = cx + (p.x - cx) * (R * (1 + lift) / R);
      const ly   = cy + (p.y - cy) * (R * (1 + lift) / R);
      if (p.visible) {
        ctx.beginPath(); ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
        ctx.fillStyle  = arc.color.replace('0.7)', '1)').replace('0.5)', '1)');
        ctx.shadowColor = '#e5000a'; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    });

    // Scan ripple pulses
    scanPulses = scanPulses.filter(p => !p.done);
    scanPulses.forEach(p => {
      const pt = project(p.node.lat, p.node.lng);
      if (!pt.visible) return;
      p.r     += 0.5;
      p.alpha -= 0.022;
      if (p.alpha <= 0 || p.r >= p.maxR) { p.done = true; return; }
      ctx.beginPath(); ctx.arc(pt.x, pt.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(229,0,10,${p.alpha})`;
      ctx.lineWidth = 1; ctx.stroke();
    });

    // Nodes
    nodes.forEach(n => {
      const p = project(n.lat, n.lng);
      if (!p.visible) return;
      let r = n.size * (0.6 + p.depth * .7);
      if (n.pulse) { n.pulse.t += n.pulse.spd; r += Math.sin(n.pulse.t) * .4; }
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      if (n.col === 'atk') {
        ctx.fillStyle  = `rgba(229,0,10,${0.5 + p.depth * .5})`;
        ctx.shadowColor = '#ff0010'; ctx.shadowBlur = 10 * p.depth;
      } else if (n.col === 'hot') {
        ctx.fillStyle  = `rgba(220,180,180,${0.2 + p.depth * .5})`;
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle  = `rgba(140,140,160,${0.1 + p.depth * .35})`;
        ctx.shadowBlur = 0;
      }
      ctx.fill(); ctx.shadowBlur = 0;
    });

    // Rim shadow (depth illusion)
    const rimG = ctx.createRadialGradient(cx, cy, R * .72, cx, cy, R);
    rimG.addColorStop(0,   'rgba(0,0,0,0)');
    rimG.addColorStop(.75, 'rgba(0,0,0,.35)');
    rimG.addColorStop(1,   'rgba(0,0,0,.82)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = rimG; ctx.fill();

    // Atmosphere
    const atmo = ctx.createRadialGradient(cx, cy, R * .92, cx, cy, R * 1.08);
    atmo.addColorStop(0,  'rgba(229,0,10,0.05)');
    atmo.addColorStop(.5, 'rgba(229,0,10,0.02)');
    atmo.addColorStop(1,  'rgba(229,0,10,0)');
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = atmo; ctx.fill();

    rot += 0.0025;
    if (frameCount % 90 === 0) spawnAttack();
    if (frameCount % 70 === 1) {
      const rn = nodes[Math.floor(Math.random() * nodes.length)];
      if (rn) spawnPulse(rn);
    }
    if (frameCount % 180 === 0) spawnAtkBadge();

    requestAnimationFrame(draw);
  }

  for (let i = 0; i < 3; i++) setTimeout(spawnAttack, i * 400);
  draw();
})();


/* ─────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────── */
const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/'
];

const MSGS = [
  'initializing scanner...',
  'establishing connection...',
  'fetching response headers...',
  'analyzing security config...',
  'checking for info leaks...',
  'fingerprinting tech stack...',
  'auditing cookies...',
  'querying DNS records...',
  'probing exposed subdomains...',
  'calculating risk score...',
  'building your report...'
];

const STEPS = [
  { id: 'st1', t: 'Connection & Fetch' },
  { id: 'st2', t: 'Header Retrieval' },
  { id: 'st3', t: 'Security Analysis' },
  { id: 'st4', t: 'Tech Fingerprint' },
  { id: 'st5', t: 'DNS & Subdomains' },
  { id: 'st6', t: 'Score Calculation' }
];


/* ─────────────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────────────── */
let msgI = 0, msgTmr = null;
let scanHistory = [];
let lastReport  = null;


/* ─────────────────────────────────────────────────────
   UTILITIES
   ───────────────────────────────────────────────────── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function tog(el) { el.classList.toggle('on'); }

/** Escape HTML entities */
function eh(s) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setProgress(pct) {
  document.getElementById('prog').style.width = pct + '%';
}

function setStep(i, state) {
  const el = document.getElementById('st' + (i + 1));
  if (!el) return;
  el.className = 'ls ' + state;
  el.querySelector('.ls-ic').textContent =
    state === 'done' ? '✓' : state === 'act' ? '▶' : '○';
}

function flashScan() {
  const f = document.getElementById('scan-flash');
  f.classList.add('on');
  setTimeout(() => f.classList.remove('on'), 200);
}

function isOptOn(id) {
  const el = document.getElementById(id);
  return el ? el.classList.contains('on') : true;
}

function showErr(msg) {
  document.getElementById('err-wrap').innerHTML =
    `<div class="err-box"><span style="color:var(--red);flex-shrink:0">⚠</span><span>${eh(msg)}</span></div>`;
}

function clearErr() {
  document.getElementById('err-wrap').innerHTML = '';
}

function animNum(id, from, to, dur) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function step(ts) {
    const p = Math.min((ts - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

function dl(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}


/* ─────────────────────────────────────────────────────
   NETWORK
   ───────────────────────────────────────────────────── */
async function fetchHP(url) {
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy + encodeURIComponent(url), {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      if (r.status < 500) return r;
    } catch (e) { /* try next proxy */ }
  }
  throw new Error("couldn't reach the site — it might be blocking proxies or is currently down");
}

async function dnsLookup(hostname, type) {
  try {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,
      { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.Answer || [];
  } catch (e) { return null; }
}


/* ─────────────────────────────────────────────────────
   REDIRECT CHECKER
   ───────────────────────────────────────────────────── */
async function checkRedirects(url) {
  const findings = [];
  try {
    const httpUrl  = url.replace(/^https?:\/\//i, 'http://');
    const r        = await fetch(PROXIES[0] + encodeURIComponent(httpUrl), { signal: AbortSignal.timeout(7000) });
    if (url.startsWith('https://')) {
      findings.push({
        sev: 'pass', cat: 'redirect',
        title: 'HTTPS URL directly accessible', value: url,
        desc: 'the URL provided is already HTTPS and responded successfully.', fix: ''
      });
    }
    const hn      = new URL(url).hostname;
    const wwwOther = hn.startsWith('www.') ? hn.slice(4) : 'www.' + hn;
    try {
      const ar = await fetch(PROXIES[0] + encodeURIComponent(url.replace(hn, wwwOther)), { signal: AbortSignal.timeout(6000) });
      if (ar.ok) {
        const aloc = ar.headers.get('location') || '';
        if (!aloc.includes(hn)) {
          findings.push({
            sev: 'low', cat: 'redirect',
            title: 'www/non-www not canonicalized',
            value: wwwOther + ' → no redirect to canonical',
            desc: 'both www and non-www versions serve content independently. pick one and 301-redirect the other — this matters for SEO and can cause session issues.',
            fix: 'Add a 301 redirect from one variant to the other in your server config.'
          });
        } else {
          findings.push({
            sev: 'pass', cat: 'redirect',
            title: 'www canonicalization configured',
            value: 'redirects to: ' + aloc.substring(0, 60),
            desc: 'one www variant redirects to the canonical URL correctly.', fix: ''
          });
        }
      }
    } catch (e) {}
  } catch (e) {}
  if (!findings.length) {
    findings.push({
      sev: 'info', cat: 'redirect',
      title: 'Redirect check inconclusive', value: 'proxy limitation',
      desc: `could not fully trace redirect chain via proxy. run <code>curl -IL ${url}</code> locally for accurate results.`, fix: ''
    });
  }
  return findings;
}


/* ─────────────────────────────────────────────────────
   SRI CHECKER
   ───────────────────────────────────────────────────── */
async function checkSRI(html) {
  const findings = [];
  if (!html) return findings;

  const scriptRe    = /<script[^>]+src=["']?(https?:\/\/[^"'\s>]+)["']?[^>]*>/gi;
  const linkRe      = /<link[^>]+href=["']?(https?:\/\/[^"'\s>]+\.css[^"'\s>]*)["']?[^>]*>/gi;
  const integrityRe = /integrity=["'][^"']+["']/i;
  const externalScripts = [], externalStyles = [];
  let m;

  while ((m = scriptRe.exec(html)) !== null) {
    externalScripts.push({ src: m[1], hasSRI: integrityRe.test(m[0]) });
  }
  while ((m = linkRe.exec(html)) !== null) {
    externalStyles.push({ href: m[1], hasSRI: integrityRe.test(m[0]) });
  }

  const noSRIScripts = externalScripts.filter(s => !s.hasSRI);
  const noSRIStyles  = externalStyles.filter(s => !s.hasSRI);

  if (noSRIScripts.length === 0 && externalScripts.length > 0) {
    findings.push({ sev:'pass', cat:'sri', title:`All ${externalScripts.length} external script(s) have SRI hashes`, value:`${externalScripts.length} scripts verified`, desc:'subresource integrity enforced — CDN tampering would be blocked by the browser.', fix:'' });
  } else if (noSRIScripts.length > 0) {
    findings.push({ sev:'high', cat:'sri', title:`${noSRIScripts.length} external script(s) missing SRI`, value:noSRIScripts.slice(0,3).map(s=>s.src).join(', '), desc:'if a CDN or third-party host is compromised, malicious code can be silently injected into your page. SRI prevents this.', fix:'Generate hashes at <code>srihash.org</code> and add <code>integrity="sha384-..."</code> + <code>crossorigin="anonymous"</code> to each script tag.' });
  }
  if (noSRIStyles.length > 0) {
    findings.push({ sev:'medium', cat:'sri', title:`${noSRIStyles.length} external stylesheet(s) missing SRI`, value:noSRIStyles.slice(0,3).map(s=>s.href).join(', '), desc:'external CSS without SRI can be modified by a CDN to exfiltrate data via CSS selectors.', fix:'Add integrity hash to your link tags. Use <code>srihash.org</code> to generate SHA-384 hashes.' });
  }
  if (externalScripts.length === 0 && externalStyles.length === 0) {
    findings.push({ sev:'pass', cat:'sri', title:'No external CDN scripts or stylesheets detected', value:'all resources appear local/inline', desc:'no CDN-hosted assets found — no SRI required.', fix:'' });
  }

  // Mixed content
  const mixedRe = /(?:src|href|action)=["'](http:\/\/[^"']+)["']/gi;
  const mixed   = [];
  while ((m = mixedRe.exec(html)) !== null) mixed.push(m[1]);
  if (mixed.length > 0) {
    findings.push({ sev:'high', cat:'sri', title:`Mixed content: ${mixed.length} HTTP resource(s) on HTTPS page`, value:mixed.slice(0,3).join(', '), desc:'loading HTTP resources on an HTTPS page can be blocked by browsers and weakens your security posture.', fix:'Change all resource URLs to https:// or use protocol-relative // URLs.' });
  } else {
    findings.push({ sev:'pass', cat:'sri', title:'No mixed content detected', value:'all scanned resources use HTTPS', desc:'no HTTP resources found on this HTTPS page.', fix:'' });
  }
  return findings;
}


/* ─────────────────────────────────────────────────────
   EXPOSED SERVICES / SUBDOMAIN CHECKER
   ───────────────────────────────────────────────────── */
async function checkExposedServices(hn) {
  const findings = [];
  const sensitiveSubs = ['admin','jenkins','jira','kibana','grafana','phpmyadmin','adminer','portainer','traefik','prometheus','gitlab','sonar','staging','dev','test','beta','api','internal','vpn','mail','webmail','cpanel','whm','ftp'];
  const found = [];

  await Promise.all(sensitiveSubs.slice(0, 10).map(async sub => {
    try {
      const res = await dnsLookup(sub + '.' + hn, 'A');
      if (res && res.length > 0) found.push({ sub: sub + '.' + hn, ip: res[0].data });
    } catch (e) {}
  }));

  if (found.length > 0) {
    findings.push({ sev:'medium', cat:'ports', title:`${found.length} exposed subdomain(s) detected`, value:found.map(f=>f.sub+' ('+f.ip+')').join(', '), desc:'these subdomains resolve to real IPs and may expose admin panels or internal services publicly.', fix:'Ensure these subdomains require strong authentication. Consider IP allowlisting or VPN gating.' });
  } else {
    findings.push({ sev:'pass', cat:'ports', title:'No sensitive exposed subdomains found', value:'checked: '+sensitiveSubs.slice(0,10).join(', '), desc:'common admin/internal subdomains are not publicly resolving — good hygiene.', fix:'' });
  }

  try {
    const mx = await dnsLookup(hn, 'MX');
    if (mx && mx.length > 0) {
      findings.push({ sev:'pass', cat:'ports', title:'MX records configured', value:mx.slice(0,2).map(r=>r.data).join(', '), desc:'email is properly configured for this domain.', fix:'' });
    } else {
      findings.push({ sev:'info', cat:'ports', title:'No MX records — email not configured', value:'no MX found', desc:'this domain does not receive email. Still add SPF and DMARC to block spoofing.', fix:'Add: <code>v=spf1 ~all</code> TXT record and a DMARC policy to prevent spoofing.' });
    }
  } catch (e) {}
  return findings;
}


/* ─────────────────────────────────────────────────────
   HEADER ANALYSIS
   ───────────────────────────────────────────────────── */
function analyzeHeaders(url, hn, h) {
  const F = [];
  const https = url.startsWith('https://');

  // HTTPS
  if (!https) {
    F.push({ sev:'critical', cat:'https', title:'No HTTPS — plain HTTP in 2026 is unacceptable', value:url, desc:"everything your users send is cleartext. passwords, session tokens, credit card data — readable by anyone on the network path.", fix:'Get a free SSL cert from <code>letsencrypt.org</code> and redirect all HTTP → HTTPS.' });
  } else {
    F.push({ sev:'pass', cat:'https', title:'HTTPS enabled', value:'https://', desc:'encrypted transport is active.', fix:'' });
  }

  // HSTS
  const hsts = h['strict-transport-security'];
  if (!hsts) {
    F.push({ sev:'high', cat:'headers', title:'No HSTS header', value:'MISSING', desc:"without HSTS, browsers may connect over HTTP first, enabling SSL stripping attacks.", fix:'Add: <code>Strict-Transport-Security: max-age=31536000; includeSubDomains; preload</code>' });
  } else {
    const ma = parseInt((hsts.match(/max-age=(\d+)/) || [])[1] || 0);
    if (ma < 15552000) {
      F.push({ sev:'medium', cat:'headers', title:'HSTS max-age too short (' + ma + 's)', value:hsts, desc:'less than 6 months — browsers forget quickly, leaving windows for downgrade attacks.', fix:'Set max-age=31536000 (1 year) minimum. Add includeSubDomains and preload.' });
    } else if (!/includeSubDomains/i.test(hsts) || !/preload/i.test(hsts)) {
      F.push({ sev:'low', cat:'headers', title:'HSTS missing includeSubDomains or preload', value:hsts, desc:'good but not fully hardened.', fix:'Add includeSubDomains and preload flags.' });
    } else {
      F.push({ sev:'pass', cat:'headers', title:'HSTS fully configured', value:hsts, desc:'max-age, includeSubDomains, and preload — all present.', fix:'' });
    }
  }

  // CSP
  const csp = h['content-security-policy'];
  if (!csp) {
    F.push({ sev:'critical', cat:'headers', title:'Missing Content-Security-Policy', value:'MISSING', desc:"no CSP means XSS attacks can execute arbitrary JavaScript on your page.", fix:"Start with: <code>Content-Security-Policy: default-src 'self'</code> then expand per resource type." });
  } else {
    const weak = [/unsafe-inline/i.test(csp) && "unsafe-inline", /unsafe-eval/i.test(csp) && "unsafe-eval", /(?:^|[\s;])\*(?:[\s;]|$)/.test(csp) && "wildcard *"].filter(Boolean);
    if (weak.length) {
      F.push({ sev:'medium', cat:'headers', title:'CSP present but weak: ' + weak.join(', '), value:csp.length>180?csp.substring(0,180)+'...':csp, desc:"CSP exists but "+weak.join(', ')+" weakens it significantly.", fix:"Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts." });
    } else {
      F.push({ sev:'pass', cat:'headers', title:'CSP looks solid', value:csp.length>180?csp.substring(0,180)+'...':csp, desc:'no obvious weak directives.', fix:'' });
    }
  }

  // X-Frame-Options
  const xfo = h['x-frame-options'];
  if (!xfo && (!csp || !csp.includes('frame-ancestors'))) {
    F.push({ sev:'high', cat:'headers', title:'No X-Frame-Options — clickjacking risk', value:'MISSING', desc:"your site can be loaded in an iframe on attacker-controlled pages.", fix:"Add: <code>X-Frame-Options: DENY</code> or use CSP <code>frame-ancestors 'none'</code>" });
  } else if (xfo) {
    if (['deny','sameorigin'].includes(xfo.toLowerCase())) {
      F.push({ sev:'pass', cat:'headers', title:'X-Frame-Options set correctly', value:xfo, desc:'clickjacking protection in place.', fix:'' });
    } else {
      F.push({ sev:'medium', cat:'headers', title:'X-Frame-Options has non-standard value', value:xfo, desc:'non-standard value may not be honored by all browsers.', fix:'Use DENY or SAMEORIGIN.' });
    }
  } else {
    F.push({ sev:'pass', cat:'headers', title:'Frame protection via CSP frame-ancestors', value:'via CSP', desc:'clickjacking covered by CSP frame-ancestors directive.', fix:'' });
  }

  // X-Content-Type-Options
  const xcto = h['x-content-type-options'];
  if (!xcto) {
    F.push({ sev:'medium', cat:'headers', title:'No X-Content-Type-Options', value:'MISSING', desc:"browsers may sniff content types, enabling MIME confusion attacks.", fix:'Add: <code>X-Content-Type-Options: nosniff</code>' });
  } else if (xcto.toLowerCase() === 'nosniff') {
    F.push({ sev:'pass', cat:'headers', title:'X-Content-Type-Options: nosniff ✓', value:xcto, desc:'MIME type sniffing disabled.', fix:'' });
  } else {
    F.push({ sev:'low', cat:'headers', title:'X-Content-Type-Options unusual value', value:xcto, desc:'expected "nosniff".', fix:'Set to: nosniff' });
  }

  // Referrer-Policy
  const rp = h['referrer-policy'];
  const goodRPs = ['no-referrer','no-referrer-when-downgrade','same-origin','strict-origin','strict-origin-when-cross-origin','origin-when-cross-origin'];
  if (!rp) {
    F.push({ sev:'low', cat:'headers', title:'No Referrer-Policy', value:'MISSING', desc:"full URLs get sent to third-party sites in the Referer header — can leak sensitive paths.", fix:'Add: <code>Referrer-Policy: strict-origin-when-cross-origin</code>' });
  } else if (goodRPs.includes(rp.toLowerCase())) {
    F.push({ sev:'pass', cat:'headers', title:'Referrer-Policy configured', value:rp, desc:'referrer leakage controlled.', fix:'' });
  } else if (rp.toLowerCase() === 'unsafe-url') {
    F.push({ sev:'medium', cat:'headers', title:'Referrer-Policy: unsafe-url — maximally leaky', value:rp, desc:'sends full URL to all destinations including cross-origin.', fix:'Use: strict-origin-when-cross-origin' });
  } else {
    F.push({ sev:'info', cat:'headers', title:'Referrer-Policy set (unusual value)', value:rp, desc:'non-standard value. review whether it achieves intended behavior.', fix:'' });
  }

  // Permissions-Policy
  const pp = h['permissions-policy'] || h['feature-policy'];
  if (!pp) {
    F.push({ sev:'low', cat:'headers', title:'No Permissions-Policy', value:'MISSING', desc:"no control over browser APIs available to your page and embedded third-party scripts.", fix:'Add: <code>Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()</code>' });
  } else {
    F.push({ sev:'pass', cat:'headers', title:'Permissions-Policy configured', value:pp.length>120?pp.substring(0,120)+'...':pp, desc:'browser feature/API access restricted.', fix:'' });
  }

  // Server header
  const srv = h['server'];
  if (srv) {
    const hasVersion = /[\d.]{3,}/.test(srv);
    F.push({ sev:hasVersion?'medium':'low', cat:'info', title:(hasVersion?'Server header leaks version: ':'Server header exposed: ')+srv, value:srv, desc:hasVersion?'attackers see your exact software version and can look up CVEs.':'server software is exposed but version is hidden.', fix:'nginx: <code>server_tokens off;</code> &nbsp; Apache: <code>ServerSignature Off; ServerTokens Prod</code>' });
  } else {
    F.push({ sev:'pass', cat:'info', title:'Server header hidden', value:'absent', desc:'not advertising server software to attackers.', fix:'' });
  }

  // X-Powered-By
  const xpb = h['x-powered-by'];
  if (xpb) {
    F.push({ sev:'medium', cat:'info', title:'X-Powered-By leaking: ' + xpb, value:xpb, desc:"reveals exact framework/runtime — helps attackers narrow CVE lists.", fix:"Express: <code>app.disable('x-powered-by')</code> &nbsp; PHP: <code>expose_php = Off</code>" });
  } else {
    F.push({ sev:'pass', cat:'info', title:'X-Powered-By absent', value:'absent', desc:'framework fingerprinting blocked.', fix:'' });
  }

  // ASP.NET version
  const aspn = h['x-aspnet-version'] || h['x-aspnetmvc-version'];
  if (aspn) {
    F.push({ sev:'medium', cat:'info', title:'ASP.NET version exposed: ' + aspn, value:aspn, desc:'version disclosure lets attackers look up known ASP.NET CVEs.', fix:'web.config: <code>&lt;httpRuntime enableVersionHeader="false"/&gt;</code>' });
  }

  // Via header
  const via = h['via'];
  if (via) {
    F.push({ sev:'low', cat:'info', title:'Via header reveals proxy chain', value:via, desc:'reveals infrastructure hops — minor but useful for attacker recon.', fix:'Configure proxy/CDN to strip the Via header.' });
  }

  // CORS
  const acao = h['access-control-allow-origin'];
  if (acao === '*') {
    F.push({ sev:'medium', cat:'headers', title:'CORS wildcard — any origin can read responses', value:'*', desc:"any website can make cross-origin requests and read your responses.", fix:'Restrict to: <code>Access-Control-Allow-Origin: https://yourdomain.com</code>' });
  } else if (acao) {
    F.push({ sev:'pass', cat:'headers', title:'CORS restricted to specific origin', value:acao, desc:'CORS scoped to defined origin.', fix:'' });
  }

  // Cross-Origin headers
  const coep = h['cross-origin-embedder-policy'];
  F.push(!coep
    ? { sev:'info', cat:'headers', title:'No COEP header', value:'MISSING', desc:'required for cross-origin isolation.', fix:'Add: <code>Cross-Origin-Embedder-Policy: require-corp</code>' }
    : { sev:'pass', cat:'headers', title:'COEP configured', value:coep, desc:'cross-origin embedding policy in place.', fix:'' }
  );

  const coop = h['cross-origin-opener-policy'];
  F.push(!coop
    ? { sev:'info', cat:'headers', title:'No COOP header', value:'MISSING', desc:'prevents cross-origin window access — defends against XS-Leaks timing attacks.', fix:'Add: <code>Cross-Origin-Opener-Policy: same-origin</code>' }
    : { sev:'pass', cat:'headers', title:'COOP configured', value:coop, desc:'opener policy isolating window context.', fix:'' }
  );

  const corp = h['cross-origin-resource-policy'];
  F.push(!corp
    ? { sev:'low', cat:'headers', title:'No CORP header', value:'MISSING', desc:'your resources can be loaded cross-origin without explicit opt-in.', fix:'Add: <code>Cross-Origin-Resource-Policy: same-origin</code>' }
    : { sev:'pass', cat:'headers', title:'CORP configured', value:corp, desc:'resource cross-origin loading controlled.', fix:'' }
  );

  // Cache-Control
  const cc = h['cache-control'];
  if (!cc) {
    F.push({ sev:'info', cat:'headers', title:'No Cache-Control header', value:'MISSING', desc:'sensitive pages without cache directives may be cached by proxies or browsers.', fix:'Add: <code>Cache-Control: no-store, no-cache, must-revalidate</code> on authenticated endpoints.' });
  }

  return F;
}


/* ─────────────────────────────────────────────────────
   TECH FINGERPRINTING
   ───────────────────────────────────────────────────── */
function fingerprint(h, url, html) {
  const techs = [];
  const s    = h['server']         || '';
  const xpb  = h['x-powered-by']  || '';
  const co   = h['set-cookie']     || '';
  const via  = h['via']            || '';
  const cf   = h['cf-ray']         || h['cf-cache-status'] || '';
  const xvh  = h['x-varnish']     || '';
  const xc   = h['x-cache']       || '';
  const body = (html || '').toLowerCase();

  // Web Servers
  if (/nginx/i.test(s))                                         techs.push({ icon:'🟩', name:'nginx',            cat:'Web Server' });
  if (/apache/i.test(s))                                        techs.push({ icon:'🪶', name:'Apache',           cat:'Web Server' });
  if (/iis/i.test(s) || /asp\.net/i.test(xpb) || h['x-aspnet-version']) techs.push({ icon:'🪟', name:'IIS / ASP.NET', cat:'Web Server' });
  if (/caddy/i.test(s))                                         techs.push({ icon:'🔵', name:'Caddy',            cat:'Web Server' });
  if (/openresty/i.test(s))                                     techs.push({ icon:'🌊', name:'OpenResty',        cat:'Web Server' });
  if (/litespeed/i.test(s))                                     techs.push({ icon:'⚡', name:'LiteSpeed',        cat:'Web Server' });

  // Runtimes
  if (/express/i.test(xpb) || /node/i.test(xpb))               techs.push({ icon:'🟨', name:'Node.js / Express',cat:'Runtime' });
  if (/php/i.test(xpb) || /phpsessid/i.test(co.toLowerCase())) techs.push({ icon:'🐘', name:'PHP',              cat:'Language' });

  // Frameworks
  if (/laravel/i.test(co))                                      techs.push({ icon:'🔴', name:'Laravel',          cat:'Framework' });
  if (/django/i.test(co) || /csrftoken/i.test(co.toLowerCase())) techs.push({ icon:'🎸', name:'Django',         cat:'Framework' });
  if (/rails/i.test(co) || /_session/i.test(co))               techs.push({ icon:'💎', name:'Ruby on Rails',    cat:'Framework' });

  // CDN / Proxy / Cache
  if (cf)                                                        techs.push({ icon:'🌤', name:'Cloudflare',       cat:'CDN / Proxy' });
  if (xvh || /varnish/i.test(xc))                               techs.push({ icon:'🔷', name:'Varnish Cache',    cat:'Cache' });
  if (/akamai/i.test(via) || /akamai/i.test(xc))                techs.push({ icon:'🌐', name:'Akamai',           cat:'CDN' });
  if (/fastly/i.test(via) || /fastly/i.test(xc))                techs.push({ icon:'⚡', name:'Fastly',           cat:'CDN' });

  // Cloud
  if (h['x-amz-request-id'] || h['x-amz-cf-id'])               techs.push({ icon:'☁️', name:'AWS',              cat:'Cloud' });
  if (h['x-azure-ref'])                                          techs.push({ icon:'🔵', name:'Azure',            cat:'Cloud' });
  if (h['x-goog-generation'] || h['x-guploader-uploadid'])      techs.push({ icon:'🔶', name:'Google Cloud',     cat:'Cloud' });

  // CMS
  if (body.includes('wp-content') || /wordpress/i.test(h['link']||'')) techs.push({ icon:'🔵', name:'WordPress', cat:'CMS' });
  if (body.includes('drupal') || body.includes('sites/all'))    techs.push({ icon:'🌀', name:'Drupal',           cat:'CMS' });
  if (body.includes('joomla'))                                   techs.push({ icon:'🔶', name:'Joomla',           cat:'CMS' });
  if (body.includes('shopify'))                                  techs.push({ icon:'🟢', name:'Shopify',          cat:'E-commerce' });
  if (body.includes('woocommerce'))                              techs.push({ icon:'🟣', name:'WooCommerce',      cat:'E-commerce' });
  if (body.includes('magento'))                                  techs.push({ icon:'🟠', name:'Magento',          cat:'E-commerce' });

  // Frontend Frameworks
  if (body.includes('_next/') || body.includes('__next'))       techs.push({ icon:'⬛', name:'Next.js',          cat:'Framework' });
  if (body.includes('__nuxt') || body.includes('nuxt'))         techs.push({ icon:'🟢', name:'Nuxt.js',          cat:'Framework' });
  if (body.includes('react') || body.includes('__react'))       techs.push({ icon:'⚛️', name:'React',            cat:'Frontend' });
  if (body.includes('angular'))                                  techs.push({ icon:'🔴', name:'Angular',          cat:'Frontend' });
  if (body.includes('vue.js') || body.includes('data-v-'))      techs.push({ icon:'💚', name:'Vue.js',           cat:'Frontend' });
  if (body.includes('svelte'))                                   techs.push({ icon:'🔥', name:'Svelte',           cat:'Frontend' });
  if (body.includes('jquery'))                                   techs.push({ icon:'🔵', name:'jQuery',           cat:'Library' });
  if (body.includes('bootstrap'))                                techs.push({ icon:'💜', name:'Bootstrap',        cat:'CSS Framework' });
  if (body.includes('tailwind'))                                 techs.push({ icon:'🌊', name:'Tailwind CSS',     cat:'CSS Framework' });

  // Analytics
  if (body.includes('gtag(') || body.includes('ga.js'))         techs.push({ icon:'📊', name:'Google Analytics', cat:'Analytics' });
  if (body.includes('segment.com'))                              techs.push({ icon:'📈', name:'Segment',          cat:'Analytics' });
  if (body.includes('intercom'))                                 techs.push({ icon:'💬', name:'Intercom',         cat:'Support' });

  if (!techs.length) techs.push({ icon:'❓', name:'Unknown stack', cat:'Could not detect from headers/body' });
  return techs;
}


/* ─────────────────────────────────────────────────────
   COOKIE PARSER
   ───────────────────────────────────────────────────── */
function parseCookies(h) {
  const raw = h['set-cookie'] || '';
  if (!raw) return [];
  const lines = raw.includes('\n') ? raw.split('\n') : [raw];
  return lines.filter(Boolean).map(line => {
    const parts = line.split(';').map(s => s.trim());
    const lp    = parts.map(p => p.toLowerCase());
    const ss    = lp.find(p => p.startsWith('samesite=')) || '';
    return {
      name:     (parts[0] || '').split('=')[0] || '?',
      secure:   lp.some(p => p === 'secure'),
      httponly: lp.some(p => p === 'httponly'),
      samesite: ss,
      raw:      line.length > 100 ? line.substring(0, 100) + '...' : line
    };
  });
}


/* ─────────────────────────────────────────────────────
   SCORE BUILDER
   ───────────────────────────────────────────────────── */
function buildScore(url, hn, hdrs, findings, tech, cookies, dns) {
  const sevW = { critical:-25, high:-15, medium:-8, low:-3, info:-1, pass:4 };
  let sc = 100, crit = 0, high = 0, med = 0, low = 0, info = 0, pass = 0;

  findings.forEach(f => {
    sc += (sevW[f.sev] || 0);
    if      (f.sev === 'critical') crit++;
    else if (f.sev === 'high')     high++;
    else if (f.sev === 'medium')   med++;
    else if (f.sev === 'low')      low++;
    else if (f.sev === 'info')     info++;
    else if (f.sev === 'pass')     pass++;
  });

  sc = Math.max(0, Math.min(100, sc));
  const grade   = sc>=90?'A':sc>=75?'B':sc>=60?'C':sc>=40?'D':'F';
  const gColor  = sc>=90?'#00c864':sc>=75?'#00a050':sc>=60?'#ffc400':sc>=40?'#ff6600':'#e5000a';
  const summary = sc>=90
    ? 'well hardened — solid security posture'
    : sc>=75 ? 'decent config, a few things to tighten'
    : sc>=60 ? 'average — needs attention on critical gaps'
    : sc>=40 ? 'multiple significant issues — prioritize fixes now'
    : 'severe vulnerabilities present — fix immediately';

  return { url, hn, score:sc, grade, gradeColor:gColor, summary, findings, tech, cookies, dns, allHdrs:hdrs, crit, high, med, low, info, pass, ts: new Date().toISOString() };
}


/* ─────────────────────────────────────────────────────
   MAIN SCAN
   ───────────────────────────────────────────────────── */
async function startScan() {
  let raw = document.getElementById('url-in').value.trim();
  if (!raw) { showErr('enter a URL first — try https://example.com'); return; }
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  document.getElementById('url-in').value = raw;

  let hn;
  try { hn = new URL(raw).hostname; } catch (e) { showErr('that URL looks broken'); return; }
  if (!hn || hn.length < 3) { showErr('hostname looks invalid — check your URL'); return; }

  clearErr();
  document.getElementById('scan-btn').disabled = true;

  const res = document.getElementById('res');
  res.style.display = 'none'; res.innerHTML = '';

  const ld = document.getElementById('load');
  ld.style.display = 'block';
  document.getElementById('lsteps').innerHTML = STEPS.map(s =>
    `<div class="ls" id="${s.id}"><span class="ls-ic">○</span>${s.t}</div>`
  ).join('');

  msgI = 0;
  document.getElementById('lmsg').textContent = MSGS[0];
  msgTmr = setInterval(() => {
    msgI = (msgI + 1) % MSGS.length;
    document.getElementById('lmsg').textContent = MSGS[msgI];
  }, 900);
  setProgress(3);

  try {
    setStep(0, 'act'); await sleep(200); setProgress(8);
    let hdrs = {}, rawHtml = '';

    try {
      const resp = await fetchHP(raw);
      resp.headers.forEach((v, k) => { hdrs[k.toLowerCase()] = v; });
      try { rawHtml = await resp.clone().text(); } catch (e) { rawHtml = ''; }
      setStep(0, 'done'); setStep(1, 'act'); setProgress(22); await sleep(200);
      setStep(1, 'done'); setProgress(38);
    } catch (e) {
      throw new Error(e.message);
    }

    flashScan();
    setStep(2, 'act'); await sleep(350); setProgress(50);

    let findings = analyzeHeaders(raw, hn, hdrs);

    if (isOptOn('opt-redirect')) {
      findings = findings.concat(await checkRedirects(raw));
    }
    if (isOptOn('opt-sri') && rawHtml) {
      findings = findings.concat(await checkSRI(rawHtml));
    }

    setStep(2, 'done'); setStep(3, 'act'); setProgress(62); await sleep(250);
    const tech = fingerprint(hdrs, raw, rawHtml);
    setStep(3, 'done'); setStep(4, 'act'); setProgress(73); await sleep(250);

    const cookies = parseCookies(hdrs);
    setProgress(80);

    let dns = { spf: null, dmarc: null, extra: [] };
    try {
      const [spfR, dmarcR] = await Promise.all([
        dnsLookup(hn, 'TXT'),
        dnsLookup('_dmarc.' + hn, 'TXT')
      ]);
      if (spfR) {
        const s = spfR.find(r => r.data && r.data.includes('v=spf1'));
        dns.spf = s ? s.data : '';
      }
      if (dmarcR) {
        const d = dmarcR.find(r => r.data && r.data.includes('v=DMARC1'));
        dns.dmarc = d ? d.data : '';
      }
    } catch (e) {}

    if (isOptOn('opt-ports')) {
      const portFindings = await checkExposedServices(hn);
      dns.extra = portFindings;
      findings  = findings.concat(portFindings);
    }

    // DNS findings → security findings
    if (dns.spf !== null) {
      if (dns.spf === '') {
        findings.push({ sev:'high', cat:'dns', title:'No SPF record — email spoofing risk', value:'missing', desc:'anyone can send email pretending to be from your domain.', fix:'Add TXT record: <code>v=spf1 include:your-mail-provider.com ~all</code>' });
      } else {
        findings.push({ sev:'pass', cat:'dns', title:'SPF record found', value:dns.spf.length>80?dns.spf.substring(0,80)+'...':dns.spf, desc:'SPF configured — unauthorized senders can be rejected.', fix:'' });
      }
    }
    if (dns.dmarc !== null) {
      if (dns.dmarc === '') {
        findings.push({ sev:'high', cat:'dns', title:'No DMARC record — phishing risk', value:'missing', desc:'without DMARC, phishing emails spoofing your domain can reach inboxes.', fix:'Add TXT on <code>_dmarc.yourdomain.com</code>: <code>v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com</code>' });
      } else {
        const policy = (dns.dmarc.match(/p=([^;]+)/) || [])[1] || 'none';
        const sev    = policy === 'reject' ? 'pass' : policy === 'quarantine' ? 'low' : 'medium';
        findings.push({ sev, cat:'dns', title:`DMARC found — policy: ${policy}`, value:dns.dmarc.length>80?dns.dmarc.substring(0,80)+'...':dns.dmarc, desc:policy==='reject'?'strong DMARC — unauthorized emails are rejected outright.':policy==='quarantine'?'DMARC set to quarantine. Consider upgrading to p=reject.':'DMARC policy is "none" — monitoring only, no enforcement.', fix:policy!=='reject'?"Change p=none to p=reject once you've verified your legitimate mail streams.":'' });
      }
    }

    setStep(4, 'done'); setStep(5, 'act'); setProgress(90); await sleep(200);
    const report = buildScore(raw, hn, hdrs, findings, tech, cookies, dns);
    setStep(5, 'done'); setProgress(100); await sleep(250);

    clearInterval(msgTmr);
    ld.style.display = 'none';
    flashScan();
    renderResults(report);
    saveHistory(report);
    renderHistory();

  } catch (e) {
    clearInterval(msgTmr);
    document.getElementById('load').style.display = 'none';
    showErr(e.message + '. Try a different URL or check your network.');
    document.getElementById('scan-btn').disabled = false;
  }
}


/* ─────────────────────────────────────────────────────
   RENDER RESULTS
   ───────────────────────────────────────────────────── */
function renderResults(r) {
  lastReport = r;
  const el      = document.getElementById('res');
  el.style.display = 'block';
  const nonPass = r.findings.filter(f => f.sev !== 'pass');
  const passing = r.findings.filter(f => f.sev === 'pass');
  const C       = 2 * Math.PI * 52;

  el.innerHTML = `
<div class="score-hero fade">
  <div class="ring-wrap">
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle class="rb" cx="60" cy="60" r="52"/>
      <circle class="rf" id="rfl" cx="60" cy="60" r="52" stroke="${r.gradeColor}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
    </svg>
    <div class="rn">
      <div class="rn-big" id="scnt" style="color:${r.gradeColor}">0</div>
      <div class="rn-lbl">/ 100</div>
    </div>
  </div>
  <div class="grade" style="color:${r.gradeColor};text-shadow:0 0 40px ${r.gradeColor}88">${r.grade}</div>
  <div class="score-info">
    <h2>${eh(r.hn)}</h2>
    <p>${r.summary}</p>
    <div class="pills">
      ${r.crit ? `<span class="pill p-c">${r.crit} Critical</span>` : ''}
      ${r.high ? `<span class="pill p-h">${r.high} High</span>`     : ''}
      ${r.med  ? `<span class="pill p-m">${r.med} Medium</span>`    : ''}
      ${r.low  ? `<span class="pill p-l">${r.low} Low</span>`       : ''}
      <span class="pill p-p">${r.pass} Passing</span>
    </div>
  </div>
</div>

<div class="action-row fade">
  <button class="btn-sec" onclick="exportJSON()">⬇ Export JSON</button>
  <button class="btn-sec" onclick="exportText()">📄 Export Report</button>
  <button class="btn-sec" onclick="copyURL()">🔗 Copy URL</button>
  <button class="btn-sec" onclick="scrollTo('scan-sec');setTimeout(startScan,300)">🔄 Re-scan</button>
</div>

<div class="sum-grid fade">
  <div class="sum-c rc"><div class="sum-n" style="color:#e5000a">${r.crit}</div><div class="sum-d">Critical</div></div>
  <div class="sum-c oc"><div class="sum-n" style="color:#ff6600">${r.high}</div><div class="sum-d">High</div></div>
  <div class="sum-c yc"><div class="sum-n" style="color:#ffc400">${r.med}</div><div class="sum-d">Medium</div></div>
  <div class="sum-c gc"><div class="sum-n" style="color:#00c864">${r.pass}</div><div class="sum-d">Passing</div></div>
</div>

<div class="chart-wrap fade">
  <div class="chart-title">// severity breakdown</div>
  <div class="bar-chart">
    ${buildBar('Critical', r.crit, '#e5000a')}
    ${buildBar('High',     r.high, '#ff6600')}
    ${buildBar('Medium',   r.med,  '#ffc400')}
    ${buildBar('Low',      r.low,  '#00c864')}
    ${buildBar('Passing',  r.pass, '#00b450')}
  </div>
</div>

<div class="tabs fade">
  <button class="tab act" onclick="switchTab(this,'ti')">Issues (${nonPass.length})</button>
  <button class="tab"     onclick="switchTab(this,'tp')">Passing (${passing.length})</button>
  <button class="tab"     onclick="switchTab(this,'ttech')">Tech Stack (${r.tech.length})</button>
  <button class="tab"     onclick="switchTab(this,'tcook')">Cookies (${r.cookies.length})</button>
  <button class="tab"     onclick="switchTab(this,'tdns')">DNS Security</button>
  <button class="tab"     onclick="switchTab(this,'tsri')">SRI & Redirects</button>
  <button class="tab"     onclick="switchTab(this,'tfix')">Auto-Fix Config</button>
  <button class="tab"     onclick="switchTab(this,'thdr')">Raw Headers (${Object.keys(r.allHdrs).length})</button>
</div>

<div id="ti" class="tc act fade">
  <div class="findings">
    ${nonPass.sort((a, b) => {
      const o = { critical:0, high:1, medium:2, low:3, info:4 };
      return (o[a.sev] ?? 5) - (o[b.sev] ?? 5);
    }).map(f => fcard(f)).join('') || '<p style="color:var(--gray);text-align:center;padding:2rem">🎉 all clear — nothing to fix!</p>'}
  </div>
</div>

<div id="tp" class="tc">
  <div class="findings">
    ${passing.map(f => fcard(f)).join('') || '<p style="color:var(--gray);text-align:center;padding:2rem">nothing passing yet.</p>'}
  </div>
</div>

<div id="ttech" class="tc">
  <div class="tech-grid">
    ${r.tech.map(t => `
      <div class="tech-item">
        <div class="tech-icon">${t.icon}</div>
        <div><div class="tech-name">${eh(t.name)}</div><div class="tech-cat">${eh(t.cat)}</div></div>
      </div>`).join('')}
  </div>
</div>

<div id="tcook" class="tc">
  ${r.cookies.length === 0
    ? '<p style="color:var(--gray);padding:1rem">no Set-Cookie headers found — either no cookies set or the proxy stripped them. check with browser devtools directly.</p>'
    : `<div class="card" style="overflow:auto"><table class="ctable">
        <thead><tr><th>Name</th><th>Secure</th><th>HttpOnly</th><th>SameSite</th></tr></thead>
        <tbody>${r.cookies.map(c => `<tr>
          <td class="ct-n">${eh(c.name)}</td>
          <td class="${c.secure   ? 'ct-ok' : 'ct-bad'}">${c.secure   ? '✓ yes' : '✗ missing'}</td>
          <td class="${c.httponly ? 'ct-ok' : 'ct-bad'}">${c.httponly ? '✓ yes' : '✗ missing'}</td>
          <td class="${c.samesite ? 'ct-ok' : 'ct-miss'}">${c.samesite ? eh(c.samesite.replace('samesite=','')) : 'not set'}</td>
        </tr>`).join('')}</tbody>
      </table></div>`}
</div>

<div id="tdns" class="tc">
  <div class="card card-pad">
    ${dnsRow('SPF',   r.dns.spf)}
    ${dnsRow('DMARC', r.dns.dmarc)}
    <div class="dns-row">
      <div class="dns-name">DKIM</div>
      <div class="dns-val" style="font-size:.72rem">requires known selector — check manually: <code>nslookup -type=TXT default._domainkey.${eh(r.hn)}</code></div>
      <div class="dns-stat ds-na">manual</div>
    </div>
    ${r.dns.extra && r.dns.extra.length > 0
      ? '<div style="margin-top:1rem;font-size:.72rem;color:var(--dg);font-family:monospace;letter-spacing:.05em;">// subdomain scan</div>'
        + r.dns.extra.map(f => `
          <div class="dns-row">
            <div class="dns-name" style="width:auto;flex:1">${eh(f.title)}</div>
            <div class="dns-stat ${f.sev==='pass'?'ds-ok':f.sev==='info'?'ds-na':'ds-bad'}">${f.sev.toUpperCase()}</div>
          </div>`).join('')
      : ''}
  </div>
</div>

<div id="tsri" class="tc">
  <div class="findings">
    ${(() => {
      const sriFindings = r.findings.filter(f => ['sri','redirect','ports'].includes(f.cat));
      return sriFindings.length
        ? sriFindings.map(f => fcard(f)).join('')
        : '<p style="color:var(--gray);padding:1rem">SRI, redirect, and subdomain findings will appear here when those options are enabled.</p>';
    })()}
  </div>
</div>

<div id="tfix" class="tc">
  ${buildAutoFix(r)}
</div>

<div id="thdr" class="tc">
  <div class="card" style="overflow:auto">
    <table class="ctable">
      <thead><tr><th>Header</th><th>Value</th></tr></thead>
      <tbody>${Object.keys(r.allHdrs).length
        ? Object.entries(r.allHdrs).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) =>
            `<tr><td class="ct-n">${eh(k)}</td><td>${eh(v.length>200?v.substring(0,200)+'...':v)}</td></tr>`
          ).join('')
        : '<tr><td colspan="2" style="text-align:center;color:var(--gray);padding:1.5rem">proxy may have stripped headers — use curl or browser devtools for full header list</td></tr>'
      }</tbody>
    </table>
  </div>
</div>`;

  document.getElementById('scan-btn').disabled = false;

  setTimeout(() => {
    document.getElementById('rfl').style.strokeDashoffset = C * (1 - r.score / 100);
    animNum('scnt', 0, r.score, 1300);
  }, 200);

  setTimeout(() => {
    document.querySelectorAll('.bc-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
  }, 350);
}


/* ─────────────────────────────────────────────────────
   RENDER HELPERS
   ───────────────────────────────────────────────────── */
function buildBar(lbl, val, color) {
  const pct = Math.min(100, Math.round((val / 20) * 100));
  return `<div class="bc-row">
    <div class="bc-label">${lbl}</div>
    <div class="bc-track">
      <div class="bc-fill" data-w="${pct}" style="background:${color};width:0%;box-shadow:0 0 6px ${color}66"></div>
    </div>
    <div class="bc-val">${val}</div>
  </div>`;
}

function dnsRow(name, val) {
  let status, cls, display;
  if (val === null)  { status = 'lookup error'; cls = 'ds-bad'; display = 'DNS lookup failed'; }
  else if (val === '') { status = 'MISSING'; cls = 'ds-bad'; display = 'not found — ' + (name==='SPF'?'email spoofing risk!':'phishing risk!'); }
  else               { status = 'found ✓'; cls = 'ds-ok'; display = val.length>80?val.substring(0,80)+'...':val; }
  return `<div class="dns-row">
    <div class="dns-name">${name}</div>
    <div class="dns-val">${eh(display)}</div>
    <div class="dns-stat ${cls}">${status}</div>
  </div>`;
}

function fcard(f) {
  const smap = { critical:'sc', high:'sh', medium:'sm', low:'sl', info:'si', pass:'sp' };
  const lmap = { critical:'lc', high:'lh', medium:'lm', low:'ll', info:'li', pass:'lp' };
  return `<div class="fnd" onclick="this.classList.toggle('open')">
    <div class="fh">
      <div class="sb ${smap[f.sev]}"></div>
      <div class="ft">${eh(f.title)}</div>
      <span class="sl2 ${lmap[f.sev]}">${f.sev.toUpperCase()}</span>
      <span class="chev">▾</span>
    </div>
    ${f.desc ? `<div class="fb">
      <p class="fd">${eh(f.desc)}</p>
      ${f.value && !['MISSING','absent','missing'].includes(f.value)
        ? `<div class="fl">current value</div><div class="fv">${eh(f.value)}</div>` : ''}
      ${f.fix && f.sev !== 'pass'
        ? `<div class="fl">how to fix</div><div class="ff"><strong>fix:</strong> ${f.fix}</div>` : ''}
    </div>` : ''}
  </div>`;
}

function switchTab(btn, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('act'));
  document.querySelectorAll('.tc').forEach(t => t.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById(id).classList.add('act');
}

function buildAutoFix(r) {
  const nginx = [], apache = [], express = [];
  const hasPass = str => r.findings.some(f => f.sev === 'pass' && f.title.toLowerCase().includes(str.toLowerCase()));

  if (!hasPass('HSTS')) {
    nginx.push('add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;');
    apache.push('Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"');
    express.push("app.use(helmet.hsts({maxAge:31536000,includeSubDomains:true,preload:true}));");
  }
  if (!hasPass('CSP') && !hasPass('Content-Security')) {
    nginx.push("add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none';\" always;");
    apache.push("Header always set Content-Security-Policy \"default-src 'self'; frame-ancestors 'none'\"");
    express.push("app.use(helmet.contentSecurityPolicy({directives:{defaultSrc:[\"'self'\"],frameAncestors:[\"'none'\"]}}));");
  }
  if (!hasPass('X-Frame') && !hasPass('frame')) {
    nginx.push('add_header X-Frame-Options "DENY" always;');
    apache.push('Header always set X-Frame-Options "DENY"');
    express.push("app.use(helmet.frameguard({action:'deny'}));");
  }
  if (!hasPass('X-Content-Type') && !hasPass('nosniff')) {
    nginx.push('add_header X-Content-Type-Options "nosniff" always;');
    apache.push('Header always set X-Content-Type-Options "nosniff"');
    express.push("app.use(helmet.noSniff());");
  }
  if (!hasPass('Referrer')) {
    nginx.push('add_header Referrer-Policy "strict-origin-when-cross-origin" always;');
    apache.push('Header always set Referrer-Policy "strict-origin-when-cross-origin"');
    express.push("app.use(helmet.referrerPolicy({policy:'strict-origin-when-cross-origin'}));");
  }
  if (!hasPass('Permissions')) {
    nginx.push('add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;');
    apache.push('Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"');
    express.push("res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');");
  }
  if (!hasPass('COEP')) {
    nginx.push('add_header Cross-Origin-Embedder-Policy "require-corp" always;');
    apache.push('Header always set Cross-Origin-Embedder-Policy "require-corp"');
    express.push("app.use((req,res,next)=>{res.setHeader('Cross-Origin-Embedder-Policy','require-corp');next();});");
  }
  if (!hasPass('COOP')) {
    nginx.push('add_header Cross-Origin-Opener-Policy "same-origin" always;');
    apache.push('Header always set Cross-Origin-Opener-Policy "same-origin"');
    express.push("app.use((req,res,next)=>{res.setHeader('Cross-Origin-Opener-Policy','same-origin');next();});");
  }
  nginx.push('server_tokens off;');

  if (!nginx.length && !express.length) {
    return '<p style="color:#00c864;padding:1.5rem;text-align:center">🎉 your config looks solid! nothing critical to auto-fix.</p>';
  }

  return `
<div class="fix-section">
  <div class="fix-header"><div class="fix-title">nginx.conf</div><button class="btn-sec" onclick="copyFixBlock('fix-ng')">copy</button></div>
  <div class="fix-code" id="fix-ng">${eh(nginx.join('\n'))}</div>
</div>
<div class="fix-section">
  <div class="fix-header"><div class="fix-title">.htaccess (Apache)</div><button class="btn-sec" onclick="copyFixBlock('fix-ap')">copy</button></div>
  <div class="fix-code" id="fix-ap">${eh(['<IfModule mod_headers.c>', ...apache, '</IfModule>'].join('\n'))}</div>
</div>
<div class="fix-section">
  <div class="fix-header"><div class="fix-title">Express.js (Node)</div><button class="btn-sec" onclick="copyFixBlock('fix-ex')">copy</button></div>
  <div class="fix-code" id="fix-ex">${eh(["// npm install helmet", "const helmet = require('helmet');", '', ...express].join('\n'))}</div>
</div>`;
}


/* ─────────────────────────────────────────────────────
   HISTORY
   ───────────────────────────────────────────────────── */
function saveHistory(r) {
  scanHistory.unshift({
    url: r.url, hn: r.hn, score: r.score, grade: r.grade,
    gradeColor: r.gradeColor, ts: r.ts, crit: r.crit, high: r.high
  });
  if (scanHistory.length > 10) scanHistory.pop();
}

function renderHistory() {
  const el = document.getElementById('hist-wrap');
  if (!scanHistory.length) {
    el.innerHTML = '<p class="empty-msg">No scans yet.</p>';
    return;
  }
  el.innerHTML = `<div class="hist-list">
    ${scanHistory.map(h => `
      <div class="hist-item" onclick="reScanURL('${eh(h.url)}')">
        <div class="hist-grade" style="background:${h.gradeColor}22;color:${h.gradeColor}">${h.grade}</div>
        <div class="hist-info">
          <div class="hist-url">${eh(h.hn)}</div>
          <div class="hist-time">${new Date(h.ts).toLocaleString()} · ${h.crit} critical, ${h.high} high</div>
        </div>
        <div class="hist-score" style="color:${h.gradeColor}">${h.score}</div>
      </div>`).join('')}
  </div>`;
}

function reScanURL(url) {
  document.getElementById('url-in').value = url;
  scrollTo('scan-sec');
  setTimeout(startScan, 300);
}


/* ─────────────────────────────────────────────────────
   EXPORT / COPY
   ───────────────────────────────────────────────────── */
function exportJSON() {
  if (!lastReport) return;
  const d = JSON.stringify({
    url:      lastReport.url,
    score:    lastReport.score,
    grade:    lastReport.grade,
    scannedAt: lastReport.ts,
    summary:  lastReport.summary,
    counts:   { critical:lastReport.crit, high:lastReport.high, medium:lastReport.med, low:lastReport.low, passing:lastReport.pass },
    findings: lastReport.findings.map(f => ({
      title: f.title, severity: f.sev, category: f.cat,
      description: f.desc, fix: f.fix ? f.fix.replace(/<[^>]+>/g,'') : ''
    })),
    tech: lastReport.tech,
    dns:  { spf: lastReport.dns.spf, dmarc: lastReport.dns.dmarc }
  }, null, 2);
  dl('wefixsec-report.json', d, 'application/json');
}

function exportText() {
  if (!lastReport) return;
  const r = lastReport;
  let t = `WeFixSec Security Report\n${'═'.repeat(50)}\nURL: ${r.url}\nScore: ${r.score}/100  Grade: ${r.grade}\nScanned: ${new Date(r.ts).toLocaleString()}\nSummary: ${r.summary}\n\nFINDING COUNTS\n${'─'.repeat(30)}\nCritical: ${r.crit}  |  High: ${r.high}  |  Medium: ${r.med}  |  Low: ${r.low}  |  Passing: ${r.pass}\n\nISSUES\n${'─'.repeat(30)}\n`;
  r.findings.filter(f => f.sev !== 'pass').forEach(f => {
    t += `\n[${f.sev.toUpperCase()}] ${f.title}\n  ${f.desc}\n${f.fix ? '  Fix: ' + f.fix.replace(/<[^>]+>/g,'') + '\n' : ''}`;
  });
  t += `\n\nPASSING CHECKS\n${'─'.repeat(30)}\n`;
  r.findings.filter(f => f.sev === 'pass').forEach(f => { t += `[PASS] ${f.title}\n`; });
  t += `\n\nTECH STACK\n${'─'.repeat(30)}\n`;
  r.tech.forEach(tech => { t += `${tech.name} (${tech.cat})\n`; });
  dl('wefixsec-report.txt', t, 'text/plain');
}

function copyURL() {
  if (!lastReport) return;
  navigator.clipboard.writeText(lastReport.url).then(() => {
    document.querySelectorAll('.action-row .btn-sec').forEach(b => {
      if (b.textContent.includes('Copy URL')) {
        b.textContent = '✓ Copied!';
        setTimeout(() => { b.textContent = '🔗 Copy URL'; }, 2000);
      }
    });
  });
}

function copyFixBlock(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = el.previousElementSibling?.querySelector('button');
    if (btn) { btn.textContent = '✓ copied'; setTimeout(() => { btn.textContent = 'copy'; }, 1800); }
  });
}


/* ─────────────────────────────────────────────────────
   EVENT LISTENERS
   ───────────────────────────────────────────────────── */
document.getElementById('url-in').addEventListener('keydown', e => {
  if (e.key === 'Enter') startScan();
});