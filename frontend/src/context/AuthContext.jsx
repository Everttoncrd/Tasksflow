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
      try {
        const data =
          await getCurrentUser();

        setUser(data.user);
      } catch {
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

    setUser(data.user);

    return data.user;
  }

  async function logout() {
    try {
      await logoutUser();
    } finally {
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