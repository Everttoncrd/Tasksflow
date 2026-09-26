import { useEffect, useState } from "react";
import {
  UserRound,
  Palette,
  Bell,
  Database,
  Sun,
  Moon,
  Monitor,
  Save,
  Check,
  RotateCcw,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { changePassword } from "../services/api";

function Settings() {
  const { user } = useAuth();

  // =========================================================
  // PREFERÊNCIAS LOCAIS
  // =========================================================

  const defaultSettings = {
    theme: "light",
    notifications: true,
    deadlineAlerts: true,
    completedTasks: true,
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  // =========================================================
  // ALTERAÇÃO DE SENHA
  // =========================================================

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // CARREGAR PREFERÊNCIAS
  // =========================================================

  useEffect(() => {
    const storedSettings = localStorage.getItem("taskflow-settings");

    if (!storedSettings) {
      return;
    }

    try {
      const parsedSettings = JSON.parse(storedSettings);

      setSettings({
        ...defaultSettings,
        ...parsedSettings,
      });
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }, []);

  // =========================================================
  // ALTERAR PREFERÊNCIA
  // =========================================================

  function updateSetting(field, value) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));

    setSaved(false);
  }

  // =========================================================
  // SALVAR PREFERÊNCIAS
  // =========================================================

  function saveSettings() {
    localStorage.setItem(
      "taskflow-settings",
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new Event("taskflow-settings-changed")
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  // =========================================================
  // RESTAURAR PREFERÊNCIAS
  // =========================================================

  function resetSettings() {
    const confirmReset = window.confirm(
      "Deseja restaurar as configurações padrão?"
    );

    if (!confirmReset) {
      return;
    }

    setSettings(defaultSettings);

    localStorage.setItem(
      "taskflow-settings",
      JSON.stringify(defaultSettings)
    );

    window.dispatchEvent(
      new Event("taskflow-settings-changed")
    );

    setSaved(false);
  }

  // =========================================================
  // SENHAS
  // =========================================================

  function updatePasswordField(field, value) {
    setPasswords((currentPasswords) => ({
      ...currentPasswords,
      [field]: value,
    }));

    setPasswordMessage({
      type: "",
      text: "",
    });
  }

  function togglePasswordVisibility(field) {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  function validateNewPassword(password) {
    if (password.length < 8) {
      return "A nova senha precisa ter pelo menos 8 caracteres.";
    }

    if (!/[A-Za-z]/.test(password)) {
      return "A nova senha precisa conter pelo menos uma letra.";
    }

    if (!/\d/.test(password)) {
      return "A nova senha precisa conter pelo menos um número.";
    }

    return "";
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setPasswordMessage({
      type: "",
      text: "",
    });

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwords;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: "Preencha todos os campos de senha.",
      });

      return;
    }

    const validationError =
      validateNewPassword(newPassword);

    if (validationError) {
      setPasswordMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "A nova senha deve ser diferente da senha atual.",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "A confirmação da nova senha não confere.",
      });

      return;
    }

    try {
      setPasswordLoading(true);

      await changePassword({
  current_password: currentPassword,
  new_password: newPassword,
});

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });

      setPasswordMessage({
        type: "success",
        text: "Senha alterada com sucesso.",
      });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text:
          error.message ||
          "Não foi possível alterar a senha.",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <section className="settings-page">
      <div className="settings-page-header">
        <div>
          <p className="eyebrow">PREFERÊNCIAS</p>

          <h1>Configurações</h1>

          <p className="subtitle">
            Gerencie sua conta e personalize sua experiência no
            TaskFlow.
          </p>
        </div>

        <button
          type="button"
          className={`settings-save-button ${
            saved ? "saved" : ""
          }`}
          onClick={saveSettings}
        >
          {saved ? (
            <>
              <Check size={18} />
              Salvo
            </>
          ) : (
            <>
              <Save size={18} />
              Salvar alterações
            </>
          )}
        </button>
      </div>

      <div className="settings-layout">
        {/* ===================================================
            PERFIL
        =================================================== */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h2>Minha conta</h2>

              <p>
                Informações da conta atualmente conectada.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <label>
              Nome

              <input
                type="text"
                value={user?.name || ""}
                readOnly
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                value={user?.email || ""}
                readOnly
              />
            </label>
          </div>

          <p className="account-data-note">
            Estes dados pertencem à sua conta e não são
            armazenados nas preferências locais do navegador.
          </p>
        </section>

        {/* ===================================================
            SEGURANÇA
        =================================================== */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2>Segurança da conta</h2>

              <p>
                Altere sua senha de acesso ao TaskFlow.
              </p>
            </div>
          </div>

          <form
            className="settings-form password-settings-form"
            onSubmit={handleChangePassword}
          >
            <label>
              Senha atual

              <div className="password-input-wrapper">
                <input
                  type={
                    showPasswords.currentPassword
                      ? "text"
                      : "password"
                  }
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    updatePasswordField(
                      "currentPassword",
                      event.target.value
                    )
                  }
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-visibility-button"
                  onClick={() =>
                    togglePasswordVisibility(
                      "currentPassword"
                    )
                  }
                  aria-label={
                    showPasswords.currentPassword
                      ? "Ocultar senha atual"
                      : "Mostrar senha atual"
                  }
                >
                  {showPasswords.currentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label>
              Nova senha

              <div className="password-input-wrapper">
                <input
                  type={
                    showPasswords.newPassword
                      ? "text"
                      : "password"
                  }
                  value={passwords.newPassword}
                  onChange={(event) =>
                    updatePasswordField(
                      "newPassword",
                      event.target.value
                    )
                  }
                  placeholder="Digite a nova senha"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-visibility-button"
                  onClick={() =>
                    togglePasswordVisibility(
                      "newPassword"
                    )
                  }
                  aria-label={
                    showPasswords.newPassword
                      ? "Ocultar nova senha"
                      : "Mostrar nova senha"
                  }
                >
                  {showPasswords.newPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <label>
              Confirmar nova senha

              <div className="password-input-wrapper">
                <input
                  type={
                    showPasswords.confirmPassword
                      ? "text"
                      : "password"
                  }
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    updatePasswordField(
                      "confirmPassword",
                      event.target.value
                    )
                  }
                  placeholder="Digite novamente a nova senha"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-visibility-button"
                  onClick={() =>
                    togglePasswordVisibility(
                      "confirmPassword"
                    )
                  }
                  aria-label={
                    showPasswords.confirmPassword
                      ? "Ocultar confirmação"
                      : "Mostrar confirmação"
                  }
                >
                  {showPasswords.confirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <div className="password-requirements">
              <LockKeyhole size={17} />

              <span>
                A senha deve possuir no mínimo 8 caracteres,
                uma letra e um número.
              </span>
            </div>

            {passwordMessage.text && (
              <div
                className={`password-message ${passwordMessage.type}`}
                role="status"
              >
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              className="change-password-button"
              disabled={passwordLoading}
            >
              <LockKeyhole size={17} />

              {passwordLoading
                ? "Alterando..."
                : "Alterar senha"}
            </button>
          </form>
        </section>

        {/* ===================================================
            APARÊNCIA
        =================================================== */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Palette size={20} />
            </div>

            <div>
              <h2>Aparência</h2>

              <p>
                Escolha como o TaskFlow deve aparecer.
              </p>
            </div>
          </div>

          <div className="theme-options">
            <button
              type="button"
              className={`theme-option ${
                settings.theme === "light"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateSetting("theme", "light")
              }
            >
              <div className="theme-icon">
                <Sun size={21} />
              </div>

              <div>
                <strong>Claro</strong>
                <span>Tema claro padrão</span>
              </div>

              <div className="theme-radio">
                {settings.theme === "light" && <span />}
              </div>
            </button>

            <button
              type="button"
              className={`theme-option ${
                settings.theme === "dark"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateSetting("theme", "dark")
              }
            >
              <div className="theme-icon">
                <Moon size={21} />
              </div>

              <div>
                <strong>Escuro</strong>
                <span>Menos brilho na tela</span>
              </div>

              <div className="theme-radio">
                {settings.theme === "dark" && <span />}
              </div>
            </button>

            <button
              type="button"
              className={`theme-option ${
                settings.theme === "system"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateSetting("theme", "system")
              }
            >
              <div className="theme-icon">
                <Monitor size={21} />
              </div>

              <div>
                <strong>Sistema</strong>
                <span>Seguir dispositivo</span>
              </div>

              <div className="theme-radio">
                {settings.theme === "system" && <span />}
              </div>
            </button>
          </div>

          <p className="theme-note">
            A preferência de aparência é salva no seu navegador
            e aplicada automaticamente ao TaskFlow.
          </p>
        </section>

        {/* ===================================================
            PREFERÊNCIAS
        =================================================== */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Bell size={20} />
            </div>

            <div>
              <h2>Preferências</h2>

              <p>
                Defina os alertas e comportamentos do sistema.
              </p>
            </div>
          </div>

          <div className="settings-switch-list">
            <div className="setting-switch-item">
              <div>
                <strong>Notificações</strong>

                <span>
                  Permitir notificações do TaskFlow.
                </span>
              </div>

              <button
                type="button"
                className={`switch ${
                  settings.notifications
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "notifications",
                    !settings.notifications
                  )
                }
                aria-label="Ativar ou desativar notificações"
              >
                <span />
              </button>
            </div>

            <div className="setting-switch-item">
              <div>
                <strong>Alertas de prazo</strong>

                <span>
                  Receber avisos sobre tarefas próximas do
                  prazo.
                </span>
              </div>

              <button
                type="button"
                className={`switch ${
                  settings.deadlineAlerts
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "deadlineAlerts",
                    !settings.deadlineAlerts
                  )
                }
                aria-label="Ativar ou desativar alertas de prazo"
              >
                <span />
              </button>
            </div>

            <div className="setting-switch-item">
              <div>
                <strong>Tarefas concluídas</strong>

                <span>
                  Manter tarefas concluídas visíveis nas
                  listas.
                </span>
              </div>

              <button
                type="button"
                className={`switch ${
                  settings.completedTasks
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "completedTasks",
                    !settings.completedTasks
                  )
                }
                aria-label="Mostrar ou ocultar tarefas concluídas"
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            SISTEMA
        =================================================== */}

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Database size={20} />
            </div>

            <div>
              <h2>TaskFlow</h2>

              <p>
                Informações e configurações locais.
              </p>
            </div>
          </div>

          <div className="system-info">
            <div>
              <span>Aplicação</span>
              <strong>TaskFlow</strong>
            </div>

            <div>
              <span>Versão</span>
              <strong>1.0.0</strong>
            </div>

            <div>
              <span>Frontend</span>
              <strong>React + Vite</strong>
            </div>

            <div>
              <span>Backend</span>
              <strong>Flask</strong>
            </div>

            <div>
              <span>Banco de dados</span>
              <strong>SQLite</strong>
            </div>

            <div>
              <span>Preferências locais</span>
              <strong>LocalStorage</strong>
            </div>

            <div>
              <span>Autenticação</span>
              <strong>Sessão protegida</strong>
            </div>
          </div>

          <div className="settings-reset-area">
            <div>
              <strong>Restaurar preferências</strong>

              <p>
                Volta as configurações locais desta página
                para o padrão.
              </p>
            </div>

            <button
              type="button"
              className="reset-settings-button"
              onClick={resetSettings}
            >
              <RotateCcw size={16} />
              Restaurar
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

export default Settings;