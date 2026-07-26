import { useCallback, useEffect, useState } from "react";

const read = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

/**
 * Theme follows the OS by default. Clicking the toggle stores an explicit
 * override that wins from then on; until then, live OS changes (the sunset
 * flip) are honoured. The inline <head> script already painted the correct
 * value, so this hook only keeps React state and the toggle in sync.
 */
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );

  const paint = useCallback((next) => {
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch { /* ignore */ }
    paint(next);
  }, [theme, paint]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!read("theme")) paint(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [paint]);

  return { theme, toggle };
}
