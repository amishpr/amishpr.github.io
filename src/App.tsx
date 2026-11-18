/* The page. Every string, link, and image comes from content.ts; layout and classes follow mockup 21f. */
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Briefcase, Envelope, GithubLogo, Globe, LinkedinLogo, Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import content from "./content.ts";
import { palettes } from "./palettes.ts";
import type { Experience, IconName } from "./types.ts";
import DemoApp from "./demos/index.tsx";
import Results from "./Results.tsx";
import { fmt, usePageMotion } from "./lib/motion.ts";

const C = content, P = C.person, ui = C.ui, S = C.sections;
const mailto = `mailto:${P.email}`;
const current = C.experience[0];
const ICONS = { "github-logo": GithubLogo, "linkedin-logo": LinkedinLogo, globe: Globe, envelope: Envelope } satisfies Record<IconName, unknown>;
/* Roles show start dates only ("Since Aug 2024" for the current one). `end` is kept in content but never rendered. */
const dates = (x: Experience) => (/present/i.test(x.end) ? `${ui.since} ${x.start}` : x.start);
const vars = (v: Record<string, string | number>) => v as CSSProperties;
const Ico = ({ I }: { I: typeof ArrowRight }) => <i className="ico" aria-hidden="true"><I /></i>;

function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch { /* private mode: the choice lasts for this page view */ }
  const paper = palettes[C.site.palette][next].paper;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = paper));
}

function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <a className="brand" href="#top">{P.name}</a>
        <nav aria-label="Primary">
          {(["results", "work", "projects", "about"] as const).filter((k) => S[k].nav).map((k) => <a key={k} href={`#${k}`}>{S[k].nav}</a>)}
        </nav>
        <button className="btn theme-btn" type="button" aria-label={ui.theme} title={ui.theme} onClick={toggleTheme}>
          <Moon className="moon" size={18} aria-hidden="true" /><Sun className="sun" size={18} aria-hidden="true" />
        </button>
        <a className="btn btn-primary btn-sm" href={mailto}>{ui.email}</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero wrap" id="top">
      <div className="hero-grid">
        <div>
          <p className="now" data-reveal><Ico I={Briefcase} />{P.role} {ui.at} {current.short} {ui.since.toLowerCase()} {current.start}</p>
          <h1 data-reveal style={vars({ "--i": 1 })}>{P.headline}</h1>
          <p className="hero-sub" data-reveal style={vars({ "--i": 2 })}>{P.intro}</p>
          <div className="hero-cta" data-reveal style={vars({ "--i": 3 })}>
            <a className="btn btn-primary" href={mailto}>{ui.email} <Ico I={ArrowRight} /></a>
          </div>
        </div>
        <figure className="portrait" data-reveal style={vars({ "--i": 2, margin: 0 })}>
          <img src={P.photo} alt={`Portrait of ${P.name}`} width={500} height={500} fetchPriority="high" />
          <figcaption><b>{P.location}</b><span>{P.workAuth}</span></figcaption>
        </figure>
      </div>
      <div className="figs" data-reveal>
        {C.stats.map((s, i) => (
          <div className="fig" key={s.label}>
            <span className="fig-n"><span data-count={s.value} data-suffix={s.suffix}>{fmt(s.value)}{s.suffix}</span><sup>{i + 1}</sup></span>
            <span className="fig-l">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="notes" data-reveal>{C.stats.map((s, i) => <span key={i}><b>{i + 1}</b>{s.note}</span>)}</p>
    </section>
  );
}

const Head = ({ s }: { s: { heading: string; intro?: string } }) => (
  <div className="sec-head" data-reveal><h2>{s.heading}</h2>{s.intro && <p>{s.intro}</p>}</div>
);

function Work() {
  return (
    <section className="sec wrap" id="work">
      <Head s={S.work} />
      {C.experience.map((x, n) => (
        <article className="role" id={`role-${x.id}`} key={x.id}>
          <div className="role-copy">
            <div className="role-meta" data-reveal><span className={n ? undefined : "cur"}>{dates(x)}</span><span>{x.location}</span></div>
            <h3 data-reveal>{x.company}</h3>
            <p className="role-title" data-reveal>{x.title}</p>
            <p className="pull" data-reveal>{x.keyFigure}</p>
            <p className="role-sum" data-reveal>{x.summary}</p>
            <ul>{x.bullets.map((b, i) => <li key={i} data-reveal style={vars({ "--i": i + 1 })}>{b}</li>)}</ul>
            <div className="stack" data-reveal>{x.stack.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
          <figure className="app" data-reveal style={vars({ "--i": 1, margin: 0 })}>
            <DemoApp d={x.demo} />
            <figcaption>{x.demo.title}. {ui.demoCaption}</figcaption>
          </figure>
        </article>
      ))}
    </section>
  );
}

function Projects() {
  return (
    <section className="sec wrap" id="projects">
      <Head s={S.projects} />
      <div className="bento">
        {C.projects.map((p, i) => (
          <article className="proj" data-reveal style={vars({ "--i": i })} key={p.name}>
            {p.image && <div className="proj-shot"><img src={p.image} alt={`Screenshot of ${p.name}`} width={1280} height={800} loading="lazy" decoding="async" /></div>}
            <div className="proj-body">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
              {(p.url || p.repo) && (
                <div className="proj-links">
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer">{ui.live} <Ico I={ArrowUpRight} /></a>}
                  {p.repo && <a href={p.repo} target="_blank" rel="noreferrer">{ui.code} <Ico I={ArrowUpRight} /></a>}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className="sec wrap" id="skills">
      <Head s={S.skills} />
      <div className="cols4">
        {C.skills.map((g, i) => <div key={g.group} data-reveal style={vars({ "--i": i })}><h3>{g.group}</h3><p>{g.items.join(", ")}</p></div>)}
      </div>
    </section>
  );
}

function About() {
  const certs = C.certifications ?? [];
  return (
    <section className="sec wrap" id="about">
      <Head s={S.about} />
      <div className="about">
        <div className="bio" data-reveal>{C.about.bio.map((b, i) => <p key={i}>{b}</p>)}</div>
        <div data-reveal style={vars({ "--i": 1 })}>
          <h3>{C.about.education}</h3>
          <ul>{C.education.map((e) => <li key={e.degree}>{e.degree}<span>{e.school}, {e.date}</span></li>)}</ul>
          {certs.length > 0 && <>
            <h3>{C.about.certifications}</h3>
            <ul>{certs.map((c) => <li key={c.name}><a href={c.url} target="_blank" rel="noreferrer">{c.name}</a></li>)}</ul>
          </>}
          <h3>{C.about.interests}</h3>
          <ul>{C.interests.map((x) => <li key={x.title}>{x.title}<span>{x.body}</span></li>)}</ul>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="sec wrap close" id="contact">
      <h2 data-reveal>{C.contact.heading}</h2>
      <p data-reveal style={vars({ "--i": 1 })}>{C.contact.body}</p>
      <a className="mail" data-reveal style={vars({ "--i": 2 })} href={mailto}>{P.email}</a>
      <div className="row" data-reveal style={vars({ "--i": 3 })}>
        {P.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer"><Ico I={ICONS[l.icon]} />{l.label}</a>)}
        <span>{P.location}</span><span>{P.workAuth}</span>
      </div>
    </section>
  );
}

export default function App() {
  usePageMotion();
  return (
    <>
      <a className="skip" href="#main">{ui.skip}</a>
      <Nav />
      <main id="main">
        <Hero />
        <Results />
        <Work />
        <Projects />
        <Skills />
        <About />
        <Contact />
      </main>
      <footer>
        <div className="wrap">
          <span suppressHydrationWarning>© {new Date().getFullYear()} {P.name}</span>
          <span>{C.footer.note}</span>
          <a href="#top">{ui.backToTop}</a>
        </div>
      </footer>
    </>
  );
}
