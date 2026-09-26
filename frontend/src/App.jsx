import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";

import "./App.css";

function App() {
  const [theme, setTheme] = useState("light");

  // =========================================================
  // DESCOBRIR TEMA
  // =========================================================

  function getSavedTheme() {
    const storedSettings =
      localStorage.getItem("taskflow-settings");

    if (!storedSettings) {
      return "light";
    }

    try {
      const settings =
        JSON.parse(storedSettings);

      return settings.theme || "light";
    } catch (error) {
      console.error(
        "Erro ao carregar tema:",
        error
      );

      return "light";
    }
  }

  // =========================================================
  // APLICAR TEMA
  // =========================================================

  function applyTheme(selectedTheme) {
    let finalTheme = selectedTheme;

    if (selectedTheme === "system") {
      const prefersDark =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      finalTheme =
        prefersDark
          ? "dark"
          : "light";
    }

    setTheme(finalTheme);

    document.documentElement.setAttribute(
      "data-theme",
      finalTheme
    );
  }

  // =========================================================
  // CARREGAR TEMA INICIAL
  // =========================================================

  useEffect(() => {
    const savedTheme =
      getSavedTheme();

    applyTheme(savedTheme);

    // -------------------------------------------------------
    // ESCUTAR ALTERAÇÕES NAS CONFIGURAÇÕES
    // -------------------------------------------------------

    function handleSettingsChanged() {
      const updatedTheme =
        getSavedTheme();

      applyTheme(updatedTheme);
    }

    // -------------------------------------------------------
    // ESCUTAR MUDANÇA DO TEMA DO SISTEMA
    // -------------------------------------------------------

    const systemTheme =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    function handleSystemThemeChange() {
      const currentTheme =
        getSavedTheme();

      if (currentTheme === "system") {
        applyTheme("system");
      }
    }

    // Evento personalizado do TaskFlow
    window.addEventListener(
      "taskflow-settings-changed",
      handleSettingsChanged
    );

    // Evento do navegador
    systemTheme.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      window.removeEventListener(
        "taskflow-settings-changed",
        handleSettingsChanged
      );

      systemTheme.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  return (
    <div
      className="app-layout"
      data-theme={theme}
    >
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/calendar"
            element={<Calendar />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;