import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles/site.css";
import "./styles/demos.css";
import App from "./App.tsx";

/* The built page is prerendered, so React attaches to the existing HTML. The dev server has no prerender, so it renders fresh. */
const root = document.getElementById("root")!;
if (root.firstElementChild) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
