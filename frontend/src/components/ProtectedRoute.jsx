import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from
  "../context/AuthContext";

function ProtectedRoute() {
  const {
    user,
    loadingAuth,
  } = useAuth();

  if (loadingAuth) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />

        <p>
          Carregando TaskFlow...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;