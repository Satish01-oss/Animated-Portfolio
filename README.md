# 🎬 Animated Portfolio

A cinematic, scroll-driven personal portfolio built with **React**, **Vite**, and modern **CSS**. Inspired by premium interactive websites, it combines smooth scrolling, a canvas image-sequence hero, and a minimalist UI for an immersive browsing experience.

![Portfolio Preview](assets/images/preview.jpg)

---

## ✨ Features

- 🎥 Scroll-controlled canvas animation (300-frame hero sequence)
- ⚡ Lenis smooth scrolling, synced with GSAP ScrollTrigger
- 🎨 Modern minimalist UI with a system-aware light/dark theme
- 📱 Responsive design — fewer hero frames on mobile for faster loads
- 🖱️ Custom cursor + cursor-reactive parallax on the hero character
- 🧩 Hover-to-preview official brand logos in the Skills section
- 🚀 WebP image sequence (~71 MB → ~21 MB) and code-split motion libraries
- ♿ Respects `prefers-reduced-motion` throughout

---

## 🛠️ Built With

- React 18 + Vite
- JavaScript (ES6+)
- GSAP + ScrollTrigger
- Lenis Smooth Scroll
- SplitType

---

## 📂 Project Structure

```
Animated/
│
├── index.html              # Vite entry
├── src/
│   ├── main.jsx            # mounts <App>, imports styles
│   ├── App.jsx             # orchestrates load → reveal → animate
│   ├── components/         # Hero, About, Skills, Work, Education, Contact, …
│   ├── hooks/              # useLenis, useImageSequence, useScrollAnimations, …
│   ├── data/               # project cards
│   ├── styles/             # global / hero / about / projects / contact
│   └── assets/images/      # project screenshots (bundled)
│
├── public/assets/sequence/ # WebP hero frames (served at runtime)
├── scripts/                # PNG → WebP conversion
├── assets/                 # original PNG frames (source, not shipped)
├── legacy/                 # previous static HTML/CSS/JS version
└── Skill.md
```

---

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/Satish01-oss/Animated-Portfolio.git
cd Animated-Portfolio
```

Install dependencies and run the dev server:

```bash
npm install
npm run dev        # http://localhost:5173
```

Build for production:

```bash
npm run build      # output in dist/
npm run preview    # serve the production build locally
```

> The hero frames ship as WebP in `public/assets/sequence/`. To regenerate them
> from the PNG originals in `assets/sequence/`, run `npm run frames`.

---

## 📸 Highlights

- Smooth scroll-driven storytelling
- Canvas-based frame animation
- Responsive layout
- Performance-focused rendering
- Premium portfolio experience

---

## 📬 Contact

Feel free to connect with me.

- GitHub: https://github.com/Satish01-oss
- LinkedIn: *https://www.linkedin.com/in/satish-kumar-ram-468a5b321/*
- Email: *ss7233563@gmail.com*

---

## 📄 License

This project is open source and available under the **MIT License**.

---

### ⭐ If you like this project, consider giving it a star!
