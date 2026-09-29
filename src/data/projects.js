import blockshield from "../assets/images/blockshield.jpg";
import o2fitness from "../assets/images/o2fitness.jpg";
import powerlifter from "../assets/images/powerlifter.jpg";

// Vite fingerprints these imports, so the browser can cache them forever.
// One source of truth for the work section: the ring and the card fronts
// wear src/assets/images/work-strip.webp in this order (see
// scripts/build-work-strip.mjs); the card backs render from this.
export const projects = [
  {
    no: "01",
    id: "pillar-1",
    tag: "Full-stack · AI",
    title: "Transaction Fraud Detection System",
    name: "BlockShield AI",
    image: blockshield,
    alt: "BlockShield AI home page: a fraud-monitoring panel showing wallet risk and AI confidence.",
    repo: "https://github.com/Satish01-oss/BlockShield-AI",
    live: "https://block-shield-ai.vercel.app/",
    points: [
      "Full-stack app in React.js, Node.js, Express.js and MongoDB.",
      "Integrated a Python machine-learning model for fraud detection.",
      "Authentication, transaction monitoring and reporting dashboards.",
    ],
  },
  {
    no: "02",
    id: "pillar-2",
    tag: "MERN · Dashboards",
    title: "Gym Management Website",
    name: "O2 Fitness Gym",
    image: o2fitness,
    alt: "O2 Fitness Gym home page: a full-bleed training photo with the headline Train Hard, Breathe Strong.",
    repo: "https://github.com/Satish01-oss/O2FitnessGym",
    live: "https://o2-fitness-gym.vercel.app/",
    points: [
      "Responsive MERN-based gym management platform.",
      "User authentication and protected routes.",
      "Dashboards and management features for users and admins.",
    ],
  },
  {
    no: "03",
    id: "pillar-3",
    tag: "React · Tailwind · GSAP",
    title: "Athlete / Powerlifting Portfolio",
    name: "Powerlifting Portfolio",
    image: powerlifter,
    alt: "Prashant Singh powerlifter portfolio home page with a medal-count summary.",
    repo: "https://github.com/Satish01-oss/powerlifter-portfolio",
    live: "https://powerlifter-portfolio.vercel.app/",
    // From the CV (React · Tailwind CSS · React Router · GSAP).
    points: [
      "Professional portfolio for a competitive powerlifting athlete.",
      "Achievements, records, journey, gallery and Instagram sections.",
      "Responsive navigation, tuned for mobile and tablet, with athletic branding.",
    ],
  },
];
