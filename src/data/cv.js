// Everything the site says about Satish, written from his CV
// (Satish_Kumar_CV.pdf). The page is meant to read AS the CV — profile,
// skills, projects, education, objective — so when the CV changes, this is
// the one file to update. The three flagship projects with screenshots and
// live links live in projects.js, because the Work ring is built from them.

// U+2011 keeps compound words ("full‑stack") from breaking across lines.
const nb = (s) => s.replace(/-/g, "‑");

export const person = {
  name: "Satish Kumar Ram",
  headline: ["MERN Stack Developer", "Frontend Developer", "Interactive Web Developer"],
  location: "India",
};

// (The hero's captions carry typographic emphasis, so they are written as
// JSX in Hero.jsx — from this same CV.)

// 01 — Profile. Resolved word by word beside the profile card.
export const profile = nb(
  "BCA student and developer building modern, interactive web applications " +
  "with the MERN stack — React, JavaScript and Tailwind CSS up front; Three.js, " +
  "React Three Fiber and GSAP when an experience should feel immersive. Drawn " +
  "to products where strong user experience, modern web technology, automation " +
  "and AI meet."
);

export const facts = [
  ["Based in", "India"],
  ["Studying", "BCA · Kazi Nazrul University"],
  ["Stack", "MERN · Three.js · GSAP"],
  ["Interests", "UX, automation & AI"],
  ["Languages", "English, Hindi"],
  ["Status", "Open to internships"],
];

// 02 — Skills: every skill on the CV, in five columns. The CV's long
// "Frontend" line is split in two — the 3D and motion libraries get a
// column of their own — which balances the table and puts one of his
// specialities in plain view. `core` marks the MERN stack the rest is built
// around. `logo` is optional: tools with an official mark summon it on
// hover; concepts stay plain text.
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@2.16.0/icons";
const dev = (icon, variant = "original") => `${DEVICON}/${icon}/${icon}-${variant}.svg`;
const si = (slug) => `https://cdn.simpleicons.org/${slug}`;

export const skills = [
  {
    label: "Frontend",
    tools: [
      { name: "HTML5", logo: dev("html5") },
      { name: "CSS3", logo: dev("css3") },
      { name: "JavaScript", logo: dev("javascript") },
      { name: "React.js", logo: dev("react"), core: true },
      { name: "React Router", logo: dev("reactrouter") },
      { name: "Tailwind CSS", logo: dev("tailwindcss") },
    ],
  },
  {
    label: "3D & motion",
    tools: [
      { name: "Three.js", logo: dev("threejs") },
      { name: "React Three Fiber" },
      { name: "Drei" },
      { name: "GSAP", logo: si("gsap") },
      { name: "ScrollTrigger" },
      { name: "Lenis" },
    ],
  },
  {
    label: "Backend & data",
    tools: [
      { name: "Node.js", logo: dev("nodejs"), core: true },
      { name: "Express.js", logo: dev("express"), core: true },
      { name: "MongoDB", logo: dev("mongodb"), core: true },
      { name: "Supabase", logo: dev("supabase") },
      { name: "REST APIs" },
      { name: "Authentication" },
    ],
  },
  {
    label: "Tools",
    tools: [
      { name: "Git", logo: dev("git") },
      { name: "GitHub", logo: dev("github") },
      { name: "Vite", logo: dev("vitejs") },
      { name: "NPM", logo: dev("npm", "original-wordmark") },
      { name: "VS Code", logo: dev("vscode") },
      { name: "Netlify", logo: dev("netlify") },
      { name: "Vercel", logo: dev("vercel") },
    ],
  },
  {
    label: "AI",
    tools: [
      { name: "Claude Code", logo: si("claude") },
      { name: "Ollama", logo: si("ollama") },
      { name: nb("AI-assisted development") },
      { name: "Prompt engineering" },
      { name: "AI application architecture" },
    ],
  },
];

// 04 — the rest of the CV's selected projects (the flagship three are the
// Work ring). Numbered on from the ring's 01–03.
//
// `status` marks a build that is still under way. `private` is for a
// project Satish is not showing yet: the page names it and says what it is,
// and nothing more — no stack, no feature list (see Projects.jsx).
export const moreProjects = [
  {
    no: "04",
    name: "Roadmap",
    kind: "Interactive learning platform",
    stack: ["React", "Node.js", "MongoDB", "Tailwind CSS", nb("AI-assisted development")],
    summary: nb("Game-inspired learning platform that takes people from learning web-development skills to practical projects and real-world opportunities."),
    points: [
      "11‑step skill roadmap with XP and rank progression",
      "Task and project submissions with an admin approval workflow",
      "Dynamic content, authentication and a responsive, modern UI",
    ],
  },
  {
    no: "05",
    name: "K",
    kind: "Personal AI assistant",
    status: "In progress",
    private: true,
    summary: "Kept private while it is being built — more when it ships.",
  },
  {
    no: "06",
    name: "K Chat",
    kind: "Username-based chat",
    status: "In progress",
    stack: ["React", "Supabase", "Socket.IO", "Real-time"],
    summary: nb("A chat app being built around username identity instead of phone-number sign-up."),
    points: [
      "Username profiles, QR sharing and real‑time messaging",
      "Reply, copy, delete, emoji and delivered / read indicators",
      "Supabase auth and database with socket‑based communication",
    ],
  },
  {
    no: "07",
    name: "Interactive 3D Web",
    kind: "Experiments",
    stack: ["React", "Three.js", "React Three Fiber", "GSAP"],
    summary: nb("Experimental websites that combine frontend development with 3D graphics, animation and smooth scrolling — this portfolio among them."),
    points: [
      "Three.js and React Three Fiber scenes with interactive elements",
      "GSAP and ScrollTrigger animation workflows",
      "Smooth scrolling and animation‑driven interfaces",
    ],
  },
];

export const education = {
  degree: "Bachelor of Computer Applications (BCA)",
  years: "2025 — 2028",
  note: "expected",
  school: "Raniganj Institute of Information Technology (RIIT)",
  university: "Kazi Nazrul University (KNU)",
  areas: [
    nb("Object-Oriented Programming"),
    "DBMS",
    "Operating Systems",
    "Digital Logic & Computer Organization",
    "Mathematics",
    "Web Development",
  ],
};

export const objective = nb(
  "To grow as a full-stack developer by building real-world products, " +
  "strengthening software-engineering fundamentals, and creating applications " +
  "that bring modern web technology, interactive experiences and AI together."
);
