/* `npm run check-links`: tries every http(s) link in content.ts (projects, repos, profiles, certifications)
   and lists each one as ok, moved (redirects somewhere else), blocked (the site refuses automated checks;
   open it by hand), or broken. Exits with an error if anything is broken. */
import content from "../src/content.ts";

const urls = [...new Set(JSON.stringify(content).match(/https?:\/\/[^"\s)]+/g) ?? [])];
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const same = (a, b) => a.replace(/^http:/, "https:").replace(/\/$/, "") === b.replace(/^http:/, "https:").replace(/\/$/, "");

async function probe(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    await res.body?.cancel();
    if ([401, 403, 429, 999].includes(res.status)) return ["blocked", url, `HTTP ${res.status}`]; // LinkedIn answers 999
    if (!res.ok) return ["broken", url, `HTTP ${res.status}`];
    if (res.redirected && !same(res.url, url)) return ["moved", url, `now ${res.url}`];
    return ["ok", url, `HTTP ${res.status}`];
  } catch (e) {
    return ["broken", url, e.name === "TimeoutError" ? "no answer in 20 s" : (e.cause?.code ?? e.message)];
  }
}

console.log(`Checking ${urls.length} links from src/content.ts...\n`);
const results = await Promise.all(urls.map(probe));
const ORDER = ["broken", "moved", "blocked", "ok"];
results.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
for (const [status, url, detail] of results) console.log(`${status.padEnd(7)} ${url}  ${detail}`);

const count = (s) => results.filter((r) => r[0] === s).length;
console.log(`\n${count("ok")} ok, ${count("moved")} moved, ${count("blocked")} blocked, ${count("broken")} broken.`);
if (count("moved")) console.log("Moved: update the link in src/content.ts to the new address.");
if (count("blocked")) console.log("Blocked: the site refuses automated checks. Open those links in a browser to confirm.");
if (count("broken")) { console.log("Broken: fix or remove those links in src/content.ts."); process.exitCode = 1; }
