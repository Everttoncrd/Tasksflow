import {
  useState,
} from "react";

import {
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

function Login() {
  const {
    user,
    login,
    loadingAuth,
  } = useAuth();

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      email: "",
      password: "",
    });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  if (
    !loadingAuth &&
    user
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  function updateField(event) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setError("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(
        form.email.trim(),
        form.password
      );

      navigate(
        "/",
        {
          replace: true,
        }
      );
    } catch (error) {
      setError(
        error.message ||
        "Não foi possível entrar."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">

      <section className="auth-card">

        <div className="auth-brand">

          <div className="auth-logo">
            <CheckCircle2
              size={28}
            />
          </div>

          <div>
            <h1>
              TaskFlow
            </h1>

            <p>
              Organize suas tarefas
              com segurança.
            </p>
          </div>

        </div>

        <div className="auth-heading">

          <h2>
            Entrar
          </h2>

          <p>
            Acesse sua conta
            para continuar.
          </p>

        </div>

        {error && (
          <div
            className="auth-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <label>
            E-mail

            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              placeholder="seuemail@exemplo.com"
              required
            />
          </label>

          <label>
            Senha

            <div className="password-field">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                autoComplete="current-password"
                value={form.password}
                onChange={updateField}
                placeholder="Sua senha"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
              >

                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}

              </button>

            </div>
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >

            <LogIn size={18} />

            {submitting
              ? "Entrando..."
              : "Entrar"}

          </button>

        </form>

        <p className="auth-switch">

          Ainda não possui conta?{" "}

          <Link to="/register">
            Criar conta
          </Link>

        </p>

        <p className="auth-security-note">
          Após 5 tentativas incorretas,
          o acesso é bloqueado
          temporariamente.
        </p>

      </section>

    </main>
  );
}

export default Login;