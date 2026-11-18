/* demo.type in content.ts picks the app. */
import type { Demo } from "../types.ts";
import Payroll from "./Payroll.tsx";
import Ads from "./Ads.tsx";
import Maze from "./Maze.tsx";
import Bank from "./Bank.tsx";
import E2E from "./E2E.tsx";

export default function DemoApp({ d }: { d: Demo }) {
  switch (d.type) {
    case "payroll": return <Payroll d={d} />;
    case "ads": return <Ads d={d} />;
    case "maze": return <Maze d={d} />;
    case "bank": return <Bank d={d} />;
    case "e2e": return <E2E d={d} />;
  }
}
