import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Sidebar
  from "./components/Sidebar";

import ProtectedRoute
  from "./components/ProtectedRoute";

import {
  AuthProvider,
} from "./context/AuthContext";

import Dashboard
  from "./pages/Dashboard";

import Tasks
  from "./pages/Tasks";

import Calendar
  from "./pages/Calendar";

import Categories
  from "./pages/Categories";

import Settings
  from "./pages/Settings";

import Login
  from "./pages/Login";

import Register
  from "./pages/Register";

import "./App.css";


function PrivateLayout({
  theme,
}) {
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
            element={
              <Dashboard />
            }
          />

          <Route
            path="/tasks"
            element={
              <Tasks />
            }
          />

          <Route
            path="/calendar"
            element={
              <Calendar />
            }
          />

          <Route
            path="/categories"
            element={
              <Categories />
            }
          />

          <Route
            path="/settings"
            element={
              <Settings />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </main>

    </div>
  );
}


function AppContent() {
  const [
    theme,
    setTheme,
  ] = useState("light");


  function getSavedTheme() {
    const storedSettings =
      localStorage.getItem(
        "taskflow-settings"
      );

    if (!storedSettings) {
      return "light";
    }

    try {
      const settings =
        JSON.parse(
          storedSettings
        );

      return (
        settings.theme ||
        "light"
      );
    } catch {
      return "light";
    }
  }


  function applyTheme(
    selectedTheme
  ) {
    let finalTheme =
      selectedTheme;

    if (
      selectedTheme ===
      "system"
    ) {
      finalTheme =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches
          ? "dark"
          : "light";
    }

    setTheme(
      finalTheme
    );

    document.documentElement
      .setAttribute(
        "data-theme",
        finalTheme
      );
  }


  useEffect(() => {
    applyTheme(
      getSavedTheme()
    );

    function handleSettingsChanged() {
      applyTheme(
        getSavedTheme()
      );
    }

    const systemTheme =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    function handleSystemThemeChange() {
      if (
        getSavedTheme() ===
        "system"
      ) {
        applyTheme(
          "system"
        );
      }
    }

    window.addEventListener(
      "taskflow-settings-changed",
      handleSettingsChanged
    );

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
    <Routes>

      <Route
        path="/login"
        element={
          <Login />
        }
      />

      <Route
        path="/register"
        element={
          <Register />
        }
      />

      <Route
        element={
          <ProtectedRoute />
        }
      >

        <Route
          path="/*"
          element={
            <PrivateLayout
              theme={theme}
            />
          }
        />

      </Route>

    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;