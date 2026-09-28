import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "bookreading-theme";
const ThemeContext = createContext({ theme: "light", setTheme: () => {}, toggle: () => {} });

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches;

// localStorage wins; otherwise follow the OS.
const readTheme = () => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : prefersDark() ? "dark" : "light";
};

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Follow the OS only while the reader has not made an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => {
      if (!window.localStorage.getItem(STORAGE_KEY)) setThemeState(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = (next) => setThemeState(next === "dark" ? "dark" : "light");
  const toggle = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

const useTheme = () => useContext(ThemeContext);

export { ThemeProvider, useTheme, STORAGE_KEY };
