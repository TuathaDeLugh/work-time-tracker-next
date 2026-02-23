"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const modes: Array<{ value: "light" | "dark" | "system"; icon: string; label: string }> = [
    { value: "light", icon: "ri-sun-line", label: "Light" },
    { value: "dark", icon: "ri-moon-clear-line", label: "Dark" },
    { value: "system", icon: "ri-computer-line", label: "System" },
  ];

  return (
    <div className="theme-toggle">
      {modes.map((mode) => (
        <button
          key={mode.value}
          className={`theme-btn ${theme === mode.value ? "active" : ""}`}
          onClick={() => setTheme(mode.value)}
          title={mode.label}
        >
          <i className={`theme-btn-icon ${mode.icon}`}></i>
          {/* <span className="theme-btn-label">{mode.label}</span> */}
        </button>
      ))}
    </div>
  );
}
