import blockshield from "../assets/images/blockshield.jpg";
import o2fitness from "../assets/images/o2fitness.jpg";
import powerlifter from "../assets/images/powerlifter.jpg";

// Vite fingerprints these imports, so the browser can cache them forever.
// One source of truth for the work section: the flip deck renders the front
// (a slice of the panorama, addressed by `id`) and the back from this.
export const projects = [
  {
    no: "01",
    id: "pillar-1",
    tag: "Full-stack · AI",
    title: "Transaction Fraud Detection System",
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
    tag: "React · Tailwind",
    title: "Powerlifter Portfolio Website",
    image: powerlifter,
    alt: "Prashant Singh powerlifter portfolio home page with a medal-count summary.",
    repo: "https://github.com/Satish01-oss/powerlifter-portfolio",
    live: "https://powerlifter-portfolio.vercel.app/",
    points: [
      "Modern, responsive portfolio for a professional powerlifter.",
      "Achievements, records, image gallery and contact.",
      "Optimised for responsiveness and performance across devices.",
    ],
  },
];
