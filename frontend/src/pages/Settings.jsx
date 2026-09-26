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
} from "lucide-react";

function Settings() {
  // =========================================================
  // CONFIGURAÇÕES PADRÃO
  // =========================================================

  const defaultSettings = {
    name: "Everton",
    email: "",
    theme: "light",
    notifications: true,
    deadlineAlerts: true,
    completedTasks: true,
  };

  // =========================================================
  // ESTADOS
  // =========================================================

  const [settings, setSettings] =
    useState(defaultSettings);

  const [saved, setSaved] =
    useState(false);

  // =========================================================
  // CARREGAR CONFIGURAÇÕES SALVAS
  // =========================================================

  useEffect(() => {
    const storedSettings =
      localStorage.getItem(
        "taskflow-settings"
      );

    if (!storedSettings) {
      return;
    }

    try {
      const parsedSettings =
        JSON.parse(
          storedSettings
        );

      setSettings({
        ...defaultSettings,
        ...parsedSettings,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar configurações:",
        error
      );
    }
  }, []);

  // =========================================================
  // ALTERAR CONFIGURAÇÃO
  // =========================================================

  function updateSetting(
    field,
    value
  ) {
    setSettings(
      (currentSettings) => ({
        ...currentSettings,
        [field]: value,
      })
    );

    setSaved(false);
  }

  // =========================================================
  // SALVAR CONFIGURAÇÕES
  // =========================================================

  function saveSettings() {
    localStorage.setItem(
      "taskflow-settings",
      JSON.stringify(settings)
    );

    // Avisa o App.jsx que as configurações mudaram
    window.dispatchEvent(
      new Event(
        "taskflow-settings-changed"
      )
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  // =========================================================
  // RESTAURAR CONFIGURAÇÕES
  // =========================================================

  function resetSettings() {
    const confirmReset =
      window.confirm(
        "Deseja restaurar as configurações padrão?"
      );

    if (!confirmReset) {
      return;
    }

    setSettings(
      defaultSettings
    );

    localStorage.setItem(
      "taskflow-settings",
      JSON.stringify(
        defaultSettings
      )
    );

    // Atualiza o tema imediatamente
    window.dispatchEvent(
      new Event(
        "taskflow-settings-changed"
      )
    );

    setSaved(false);
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <section className="settings-page">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="settings-page-header">

        <div>

          <p className="eyebrow">
            PREFERÊNCIAS
          </p>

          <h1>
            Configurações
          </h1>

          <p className="subtitle">
            Personalize sua experiência no TaskFlow.
          </p>

        </div>

        <button
          type="button"
          className={`settings-save-button ${
            saved
              ? "saved"
              : ""
          }`}
          onClick={
            saveSettings
          }
        >

          {saved ? (
            <>
              <Check
                size={18}
              />

              Salvo
            </>
          ) : (
            <>
              <Save
                size={18}
              />

              Salvar alterações
            </>
          )}

        </button>

      </div>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      <div className="settings-layout">

        {/* ===================================================
            PERFIL
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <UserRound
                size={20}
              />
            </div>

            <div>

              <h2>
                Perfil
              </h2>

              <p>
                Informações exibidas no TaskFlow.
              </p>

            </div>

          </div>

          <div className="settings-form">

            {/* NOME */}

            <label>

              Nome

              <input
                type="text"
                value={
                  settings.name
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Seu nome"
              />

            </label>

            {/* E-MAIL */}

            <label>

              E-mail

              <input
                type="email"
                value={
                  settings.email
                }
                onChange={(
                  event
                ) =>
                  updateSetting(
                    "email",
                    event.target.value
                  )
                }
                placeholder="seuemail@exemplo.com"
              />

            </label>

          </div>

        </section>

        {/* ===================================================
            APARÊNCIA
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Palette
                size={20}
              />
            </div>

            <div>

              <h2>
                Aparência
              </h2>

              <p>
                Escolha como o TaskFlow deve aparecer.
              </p>

            </div>

          </div>

          <div className="theme-options">

            {/* =================================================
                TEMA CLARO
            ================================================= */}

            <button
              type="button"
              className={`theme-option ${
                settings.theme ===
                "light"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateSetting(
                  "theme",
                  "light"
                )
              }
            >

              <div className="theme-icon">
                <Sun
                  size={21}
                />
              </div>

              <div>

                <strong>
                  Claro
                </strong>

                <span>
                  Tema claro padrão
                </span>

              </div>

              <div className="theme-radio">

                {settings.theme ===
                  "light" && (
                  <span />
                )}

              </div>

            </button>

            {/* =================================================
                TEMA ESCURO
            ================================================= */}

            <button
              type="button"
              className={`theme-option ${
                settings.theme ===
                "dark"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateSetting(
                  "theme",
                  "dark"
                )
              }
            >

              <div className="theme-icon">
                <Moon
                  size={21}
                />
              </div>

              <div>

                <strong>
                  Escuro
                </strong>

                <span>
                  Menos brilho na tela
                </span>

              </div>

              <div className="theme-radio">

                {settings.theme ===
                  "dark" && (
                  <span />
                )}

              </div>

            </button>

            {/* =================================================
                TEMA DO SISTEMA
            ================================================= */}

            <button
              type="button"
              className={`theme-option ${
                settings.theme ===
                "system"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                updateSetting(
                  "theme",
                  "system"
                )
              }
            >

              <div className="theme-icon">
                <Monitor
                  size={21}
                />
              </div>

              <div>

                <strong>
                  Sistema
                </strong>

                <span>
                  Seguir dispositivo
                </span>

              </div>

              <div className="theme-radio">

                {settings.theme ===
                  "system" && (
                  <span />
                )}

              </div>

            </button>

          </div>

          <p className="theme-note">
            A preferência de aparência é salva no seu navegador e aplicada automaticamente ao TaskFlow.
          </p>

        </section>

        {/* ===================================================
            PREFERÊNCIAS
        =================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Bell
                size={20}
              />
            </div>

            <div>

              <h2>
                Preferências
              </h2>

              <p>
                Defina os alertas e comportamentos do sistema.
              </p>

            </div>

          </div>

          <div className="settings-switch-list">

            {/* NOTIFICAÇÕES */}

            <div className="setting-switch-item">

              <div>

                <strong>
                  Notificações
                </strong>

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

            {/* ALERTAS DE PRAZO */}

            <div className="setting-switch-item">

              <div>

                <strong>
                  Alertas de prazo
                </strong>

                <span>
                  Receber avisos sobre tarefas próximas do prazo.
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

            {/* TAREFAS CONCLUÍDAS */}

            <div className="setting-switch-item">

              <div>

                <strong>
                  Tarefas concluídas
                </strong>

                <span>
                  Manter tarefas concluídas visíveis nas listas.
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
              <Database
                size={20}
              />
            </div>

            <div>

              <h2>
                TaskFlow
              </h2>

              <p>
                Informações e configurações locais.
              </p>

            </div>

          </div>

          {/* =================================================
              INFORMAÇÕES
          ================================================= */}

          <div className="system-info">

            <div>

              <span>
                Aplicação
              </span>

              <strong>
                TaskFlow
              </strong>

            </div>

            <div>

              <span>
                Versão
              </span>

              <strong>
                1.0.0
              </strong>

            </div>

            <div>

              <span>
                Frontend
              </span>

              <strong>
                React + Vite
              </strong>

            </div>

            <div>

              <span>
                Backend
              </span>

              <strong>
                Flask
              </strong>

            </div>

            <div>

              <span>
                Banco de dados
              </span>

              <strong>
                SQLite
              </strong>

            </div>

            <div>

              <span>
                Armazenamento de preferências
              </span>

              <strong>
                LocalStorage
              </strong>

            </div>

          </div>

          {/* =================================================
              RESTAURAR
          ================================================= */}

          <div className="settings-reset-area">

            <div>

              <strong>
                Restaurar preferências
              </strong>

              <p>
                Volta as configurações desta página para o padrão.
              </p>

            </div>

            <button
              type="button"
              className="reset-settings-button"
              onClick={
                resetSettings
              }
            >

              <RotateCcw
                size={16}
              />

              Restaurar

            </button>

          </div>

        </section>

      </div>

    </section>
  );
}

export default Settings;