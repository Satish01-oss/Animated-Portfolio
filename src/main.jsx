import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import "./styles/global.css";
import "./styles/hero.css";
import "./styles/about.css";
import "./styles/showreel.css";
import "./styles/pillars.css";
import "./styles/contact.css";

// NOTE: intentionally NOT wrapped in <StrictMode>. StrictMode double-invokes
// effects in dev (mount → unmount → mount), and the imperative GSAP /
// ScrollTrigger / Lenis / SplitType setup does not survive that cycle cleanly
// — it left the dev build with dead animations while production was fine.
// Removing it makes dev behave like the production build we ship.
createRoot(document.getElementById("root")).render(<App />);
