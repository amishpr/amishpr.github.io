/* Used only at build time by scripts/prerender.mjs. */
import { renderToString } from "react-dom/server";
import App from "./App.tsx";

export const render = () => renderToString(<App />);
