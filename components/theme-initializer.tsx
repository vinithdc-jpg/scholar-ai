"use client";

import { useLayoutEffect } from "react";

export default function ThemeInitializer() {
  useLayoutEffect(() => {
    const savedMode = localStorage.getItem("scholarai-theme");
    const darkMode = savedMode
      ? savedMode === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    document.documentElement.classList.toggle("dark", darkMode);
  }, []);

  return null;
}
