"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", onStoreChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onStoreChange);
  };
}

function snapshot(): Theme {
  const value = document.documentElement.dataset.theme;
  if (value === "dark" || value === "light") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => "light" as Theme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  const dark = theme === "dark";
  return (
    <button type="button" className="theme-toggle" aria-label={dark ? "Light theme" : "Dark theme"} onClick={toggle}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {dark ? (
          <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <path
            fill="currentColor"
            d="M8 1.2a.75.75 0 0 1 .75.75v1.1a.75.75 0 0 1-1.5 0v-1.1A.75.75 0 0 1 8 1.2Zm0 10a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.05-3.95a.75.75 0 0 1-.75.75h-1.1a.75.75 0 0 1 0-1.5h1.1a.75.75 0 0 1 .75.75ZM4.8 8a.75.75 0 0 1-.75.75H2.95a.75.75 0 0 1 0-1.5h1.1A.75.75 0 0 1 4.8 8Zm6.84-4.39a.75.75 0 0 1 0 1.06l-.78.78a.75.75 0 1 1-1.06-1.06l.78-.78a.75.75 0 0 1 1.06 0ZM6.2 10.44a.75.75 0 0 1 0 1.06l-.78.78a.75.75 0 1 1-1.06-1.06l.78-.78a.75.75 0 0 1 1.06 0Zm5.44 1.84a.75.75 0 0 1-1.06 0l-.78-.78a.75.75 0 1 1 1.06-1.06l.78.78a.75.75 0 0 1 0 1.06ZM6.2 5.56a.75.75 0 0 1-1.06 0l-.78-.78A.75.75 0 0 1 5.42 3.72l.78.78a.75.75 0 0 1 0 1.06ZM8 12.2a.75.75 0 0 1 .75.75v1.1a.75.75 0 0 1-1.5 0v-1.1a.75.75 0 0 1 .75-.75Z"
          />
        )}
      </svg>
    </button>
  );
}
