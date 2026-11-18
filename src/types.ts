/* Shape of content.ts. You only need this file to add a new kind of field;
   editing text, links, and images happens in content.ts. */
import type { PaletteName } from "./palettes.ts";

export type IconName = "github-logo" | "linkedin-logo" | "globe" | "envelope";

export type Link = { label: string; url: string; handle: string; icon: IconName };

export type Section = { nav?: string; heading: string; intro?: string };

export type PayrollDemo = {
  type: "payroll";
  title: string;
  paychecks: number;
  jobs: number;
  stages: [string, string, string];
  reviewBefore: string;
  reviewAfter: string;
  labels: {
    pay: string; jobs: string; paychecks: string; cycle: string; window: string; ofJobs: string;
    payNote: string; payDone: string; legend: [string, string, string];
    report: string; reportReady: string; stats: [string, string, string, string];
  };
};

type Option = { id: string; label: string };
type Score = Record<string, number>;
export type AdsDemo = {
  type: "ads";
  title: string;
  client: string;
  goals: Option[];
  budgets: Option[];
  reach: Option[];
  /* Each ad type scores 0 to 3 for every goal, budget, and reach id above. */
  adTypes: { id: string; name: string; why: string; goals: Score; budget: Score; reach: Score }[];
  deck: [string, string, string, string];
  audience: string;
  flight: string;
  /* Goals the app selects by itself when it first scrolls into view. */
  introGoals: string[];
  labels: {
    goals: string; goalsHelp: string; budget: string; reach: string; results: string; empty: string; split: string;
    deckButton: string; deckNote: string; deckBuilding: string; deckDone: string;
  };
};

export type MazeDemo = {
  type: "maze";
  title: string;
  wide: { cols: number; rows: number };
  narrow: { cols: number; rows: number };
  labels: { route: string; steps: string; checked: string; replay: string; newLayout: string; legend: [string, string, string, string]; note: string };
};

type Account = { name: string; last4: string; balance: number };
export type BankDemo = {
  type: "bank";
  title: string;
  checking: Account;
  ira: Account & { apy: number };
  dailyLimit: number;
  quick: number[];
  activity: { label: string; account: string; amount: number }[];
  labels: { deposit: string; withdraw: string; toIra: string; activity: string };
};

export type E2EDemo = {
  type: "e2e";
  title: string;
  total: number;
  failures: number;
  containers: string[];
  scenarios: string[];
  labels: { running: string; again: string; containers: string; stats: [string, string, string, string]; note: string };
};

export type Demo = PayrollDemo | AdsDemo | MazeDemo | BankDemo | E2EDemo;

export type Experience = {
  id: string;
  company: string;
  short: string;
  title: string;
  location: string;
  start: string;
  end: string;
  keyFigure: string;
  summary: string;
  bullets: string[];
  stack: string[];
  demo: Demo;
};

export type Content = {
  site: {
    url: string;
    title: string;
    description: string;
    ogImage: string;
    ogImageAlt: string;
    palette: PaletteName;
  };
  person: {
    name: string;
    role: string;
    location: string;
    workAuth: string;
    email: string;
    photo: string;
    headline: string;
    intro: string;
    links: Link[];
  };
  ui: {
    skip: string; email: string; live: string; code: string; since: string; at: string;
    simulation: string; demoCaption: string; theme: string; backToTop: string; sources: string; showTable: string; hideTable: string;
  };
  sections: { results: Section; work: Section; projects: Section; skills: Section; about: Section };
  stats: { value: number; suffix: string; label: string; note: string }[];
  results: {
    time: { title: string; sub: string; legend: [string, string]; columns: [string, string, string, string] };
    hours: { title: string; sub: string; unit: string; columns: [string, string, string] };
    downFrom: string;
  };
  experience: Experience[];
  outcomes: {
    time: { label: string; role: string; before: number; after: number; beforeText: string; afterText: string }[];
    hoursSaved: { label: string; detail: string; role: string; hours: number }[];
    changes: { label: string; role: string; value: number }[];
    other: { label: string; role: string; figure: string; beforeText: string; afterText: string }[];
  };
  projects: { name: string; url: string; repo: string; image: string; featured: boolean; description: string; tags: string[] }[];
  skills: { group: string; items: string[] }[];
  about: { bio: string[]; education: string; certifications: string; interests: string };
  education: { degree: string; school: string; date: string }[];
  certifications?: { name: string; url: string }[];
  interests: { title: string; body: string }[];
  contact: { heading: string; body: string };
  footer: { note: string };
};
