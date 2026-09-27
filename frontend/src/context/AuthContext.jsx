import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] =
    useState(true);

  useEffect(() => {
    async function restoreSession() {
      // A sessão só é restaurada se o login/cadastro aconteceu
      // nesta mesma aba. Assim, quem abre o link público do
      // portfólio não entra automaticamente em uma conta que
      // tenha ficado autenticada anteriormente no navegador.
      const authenticatedInThisTab =
        sessionStorage.getItem("taskflow-authenticated") === "true";

      if (!authenticatedInThisTab) {
        setUser(null);
        setLoadingAuth(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch {
        sessionStorage.removeItem("taskflow-authenticated");
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    }

    restoreSession();
  }, []);

  async function login(
    email,
    password
  ) {
    const data = await loginUser({
      email,
      password,
    });

    sessionStorage.setItem("taskflow-authenticated", "true");
    setUser(data.user);

    return data.user;
  }

  async function register(
    name,
    email,
    password
  ) {
    const data = await registerUser({
      name,
      email,
      password,
    });

    sessionStorage.setItem("taskflow-authenticated", "true");
    setUser(data.user);

    return data.user;
  }

  async function logout() {
    try {
      await logoutUser();
    } finally {
      sessionStorage.removeItem("taskflow-authenticated");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loadingAuth,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth precisa estar dentro de AuthProvider."
    );
  }

  return context;
}