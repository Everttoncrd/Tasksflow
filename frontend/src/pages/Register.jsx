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
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

function Register() {
  const {
    user,
    register,
    loadingAuth,
  } = useAuth();

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
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

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "As senhas não coincidem."
      );

      return;
    }

    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(
        form.password
      ) ||
      !/\d/.test(
        form.password
      )
    ) {
      setError(
        "A senha deve ter pelo menos 8 caracteres, uma letra e um número."
      );

      return;
    }

    setSubmitting(true);

    try {
      await register(
        form.name.trim(),
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
        "Não foi possível criar a conta."
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
              Sua área privada
              de tarefas.
            </p>
          </div>

        </div>

        <div className="auth-heading">

          <h2>
            Criar conta
          </h2>

          <p>
            Seus dados serão separados
            dos demais usuários.
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
            Nome

            <input
              name="name"
              type="text"
              value={form.name}
              onChange={updateField}
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>

          <label>
            E-mail

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha

            <div className="password-field">

              <input
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={form.password}
                onChange={updateField}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
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

          <label>
            Confirmar senha

            <input
              name="confirmPassword"
              type="password"
              value={
                form.confirmPassword
              }
              onChange={updateField}
              autoComplete="new-password"
              required
            />
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting}
          >

            <UserPlus size={18} />

            {submitting
              ? "Criando..."
              : "Criar conta"}

          </button>

        </form>

        <p className="auth-switch">

          Já possui conta?{" "}

          <Link to="/login">
            Entrar
          </Link>

        </p>

      </section>

    </main>
  );
}

export default Register;