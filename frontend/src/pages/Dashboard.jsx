import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Plus,
  CheckCircle2,
  Clock3,
  CircleDashed,
  ClipboardList,
  Trash2,
  X,
  ChevronRight,
  ListTodo,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

import {
  getTasks,
  getDashboard,
  getCategories,
  createTask,
  updateTask,
  deleteTask,
} from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Nome do usuário autenticado (somente o primeiro nome)
  const userName = user?.name?.trim()?.split(/\s+/)[0] || "Usuário";

  // =========================================================
  // TAREFAS
  // =========================================================

  const [tasks, setTasks] =
    useState([]);

  // =========================================================
  // CATEGORIAS
  // =========================================================

  const [categories, setCategories] =
    useState([]);

  // =========================================================
  // DASHBOARD
  // =========================================================

  const [dashboard, setDashboard] =
    useState({
      total: 0,
      pending: 0,
      progress: 0,
      completed: 0,
    });

  // =========================================================
  // PREFERÊNCIAS
  // =========================================================

  const [preferences, setPreferences] =
    useState({
      notifications: true,
      deadlineAlerts: true,
      completedTasks: true,
    });

  // =========================================================
  // MODAL / CARREGAMENTO
  // =========================================================

  const [modalOpen, setModalOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  const [form, setForm] =
    useState({
      title: "",
      description: "",
      category: "",
      priority: "Média",
      status: "Pendente",
      due_date: "",
    });

  // =========================================================
  // CARREGAR DADOS
  // =========================================================

  async function loadData() {
    try {
      setLoading(true);

      const [
        tasksData,
        dashboardData,
        categoriesData,
      ] = await Promise.all([
        getTasks(),
        getDashboard(),
        getCategories(),
      ]);

      setTasks(tasksData);

      setDashboard(
        dashboardData
      );

      setCategories(
        categoriesData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // CARREGAR CONFIGURAÇÕES
  // =========================================================

  function loadUserSettings() {
    const storedSettings =
      localStorage.getItem(
        "taskflow-settings"
      );

    if (!storedSettings) {
      return;
    }

    try {
      const settings =
        JSON.parse(
          storedSettings
        );

      // PREFERÊNCIAS

      setPreferences({
        notifications:
          settings.notifications ??
          true,

        deadlineAlerts:
          settings.deadlineAlerts ??
          true,

        completedTasks:
          settings.completedTasks ??
          true,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar configurações:",
        error
      );
    }
  }

  // =========================================================
  // INICIAR DASHBOARD
  // =========================================================

  useEffect(() => {
    loadData();
    loadUserSettings();

    function handleSettingsChanged() {
      loadUserSettings();
    }

    window.addEventListener(
      "taskflow-settings-changed",
      handleSettingsChanged
    );

    return () => {
      window.removeEventListener(
        "taskflow-settings-changed",
        handleSettingsChanged
      );
    };
  }, []);

  // =========================================================
  // ABRIR MODAL NOVA TAREFA
  // =========================================================

  function openCreateModal() {
    setForm({
      title: "",
      description: "",

      category:
        categories.length > 0
          ? categories[0].name
          : "",

      priority: "Média",
      status: "Pendente",
      due_date: "",
    });

    setModalOpen(true);
  }

  // =========================================================
  // FECHAR MODAL
  // =========================================================

  function closeModal() {
    setModalOpen(false);

    setForm({
      title: "",
      description: "",
      category: "",
      priority: "Média",
      status: "Pendente",
      due_date: "",
    });
  }

  // =========================================================
  // CRIAR TAREFA
  // =========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !form.title.trim()
    ) {
      return;
    }

    if (!form.category) {
      window.alert(
        "Selecione uma categoria."
      );

      return;
    }

    try {
      await createTask(
        form
      );

      closeModal();

      await loadData();
    } catch (error) {
      console.error(
        "Erro ao criar tarefa:",
        error
      );

      window.alert(
        error.message ||
          "Não foi possível criar a tarefa."
      );
    }
  }

  // =========================================================
  // EXCLUIR TAREFA
  // =========================================================

  async function handleDelete(
    id
  ) {
    const confirmDelete =
      window.confirm(
        "Deseja realmente excluir esta tarefa?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteTask(
        id
      );

      await loadData();
    } catch (error) {
      console.error(
        "Erro ao excluir tarefa:",
        error
      );

      window.alert(
        error.message ||
          "Não foi possível excluir a tarefa."
      );
    }
  }

  // =========================================================
  // ALTERAR STATUS
  // =========================================================

  async function changeStatus(
    task
  ) {
    let nextStatus =
      "Pendente";

    if (
      task.status ===
      "Pendente"
    ) {
      nextStatus =
        "Em andamento";
    } else if (
      task.status ===
      "Em andamento"
    ) {
      nextStatus =
        "Concluída";
    } else {
      nextStatus =
        "Pendente";
    }

    try {
      await updateTask(
        task.id,
        {
          ...task,
          status:
            nextStatus,
        }
      );

      await loadData();
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      window.alert(
        error.message ||
          "Não foi possível alterar o status."
      );
    }
  }

  // =========================================================
  // PROGRESSO
  // =========================================================

  const progressPercentage =
    dashboard.total > 0
      ? Math.round(
          (
            dashboard.completed /
            dashboard.total
          ) * 100
        )
      : 0;

  // =========================================================
  // FORMATAR DATA
  // =========================================================

  function formatDate(
    date
  ) {
    if (!date) {
      return "Sem prazo";
    }

    const [
      year,
      month,
      day,
    ] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  // =========================================================
  // CONVERTER DATA
  // =========================================================

  function parseTaskDate(
    date
  ) {
    if (!date) {
      return null;
    }

    const [
      year,
      month,
      day,
    ] = date
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    );
  }

  // =========================================================
  // CLASSE PRIORIDADE
  // =========================================================

  function priorityClass(
    priority
  ) {
    return priority
      ?.toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  }

  // =========================================================
  // ALERTAS DE PRAZO
  // =========================================================

  const deadlineInfo =
    useMemo(() => {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const threeDaysLater =
        new Date(today);

      threeDaysLater.setDate(
        today.getDate() + 3
      );

      const overdue = [];
      const upcoming = [];

      tasks.forEach(
        (task) => {
          if (
            !task.due_date ||
            task.status ===
              "Concluída"
          ) {
            return;
          }

          const dueDate =
            parseTaskDate(
              task.due_date
            );

          if (!dueDate) {
            return;
          }

          if (
            dueDate < today
          ) {
            overdue.push(
              task
            );

            return;
          }

          if (
            dueDate >=
              today &&
            dueDate <=
              threeDaysLater
          ) {
            upcoming.push(
              task
            );
          }
        }
      );

      return {
        overdue,
        upcoming,

        total:
          overdue.length +
          upcoming.length,
      };
    }, [tasks]);

  // =========================================================
  // TAREFAS VISÍVEIS
  // =========================================================

  const visibleTasks =
    useMemo(() => {
      let result = [
        ...tasks,
      ];

      if (
        !preferences.completedTasks
      ) {
        result =
          result.filter(
            (task) =>
              task.status !==
              "Concluída"
          );
      }

      return result.slice(
        0,
        6
      );
    }, [
      tasks,
      preferences.completedTasks,
    ]);

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <>
      <section className="content">

        {/* ===================================================
            CABEÇALHO
        =================================================== */}

        <div className="heading">

          <div>

            <p className="eyebrow">
              VISÃO GERAL
            </p>

            <h1>
              Olá, {userName} 👋
            </h1>

            <p className="subtitle">
              Organize seu dia e acompanhe seu progresso.
            </p>

          </div>

          <button
            className="new-task"
            onClick={
              openCreateModal
            }
          >
            <Plus
              size={20}
            />

            Nova tarefa
          </button>

        </div>

        {/* ===================================================
            ALERTA DE PRAZO
        =================================================== */}

        {preferences.deadlineAlerts &&
          deadlineInfo.total >
            0 && (

            <section className="task-deadline-alert">

              <div className="task-deadline-alert-icon">

                <AlertTriangle
                  size={22}
                />

              </div>

              <div className="task-deadline-alert-content">

                <strong>

                  {deadlineInfo.total ===
                  1
                    ? "1 tarefa precisa de atenção"
                    : `${deadlineInfo.total} tarefas precisam de atenção`}

                </strong>

                <p>

                  {deadlineInfo
                    .overdue
                    .length >
                    0 && (

                    <span>

                      {
                        deadlineInfo
                          .overdue
                          .length
                      }{" "}

                      {deadlineInfo
                        .overdue
                        .length ===
                      1
                        ? "tarefa atrasada"
                        : "tarefas atrasadas"}

                    </span>

                  )}

                  {deadlineInfo
                    .overdue
                    .length >
                    0 &&
                    deadlineInfo
                      .upcoming
                      .length >
                      0 && (

                      <span>
                        {" "}
                        •{" "}
                      </span>

                    )}

                  {deadlineInfo
                    .upcoming
                    .length >
                    0 && (

                    <span>

                      {
                        deadlineInfo
                          .upcoming
                          .length
                      }{" "}

                      {deadlineInfo
                        .upcoming
                        .length ===
                      1
                        ? "vence nos próximos 3 dias"
                        : "vencem nos próximos 3 dias"}

                    </span>

                  )}

                </p>

              </div>

              <CalendarClock
                className="task-deadline-calendar"
                size={21}
              />

            </section>

          )}

        {/* ===================================================
            INDICADORES
        =================================================== */}

        <section className="stats">

          <StatCard
            title="Total de tarefas"
            value={
              dashboard.total
            }
            icon={
              <ClipboardList />
            }
            type="purple"
          />

          <StatCard
            title="Pendentes"
            value={
              dashboard.pending
            }
            icon={
              <Clock3 />
            }
            type="orange"
          />

          <StatCard
            title="Em andamento"
            value={
              dashboard.progress
            }
            icon={
              <CircleDashed />
            }
            type="blue"
          />

          <StatCard
            title="Concluídas"
            value={
              dashboard.completed
            }
            icon={
              <CheckCircle2 />
            }
            type="green"
          />

        </section>

        {/* ===================================================
            PROGRESSO / PRODUTIVIDADE
        =================================================== */}

        <section className="dashboard-grid">

          {/* PROGRESSO */}

          <div className="panel progress-panel">

            <div className="panel-title">

              <div>

                <h2>
                  Seu progresso
                </h2>

                <p>
                  Progresso geral das suas tarefas
                </p>

              </div>

              <strong>
                {progressPercentage}%
              </strong>

            </div>

            <div className="progress-track">

              <div
                className="progress-bar"
                style={{
                  width:
                    `${progressPercentage}%`,
                }}
              />

            </div>

            <div className="progress-footer">

              <span>
                {
                  dashboard.completed
                }{" "}
                concluídas
              </span>

              <span>
                {dashboard.total -
                  dashboard.completed}{" "}
                restantes
              </span>

            </div>

          </div>

          {/* PRODUTIVIDADE */}

          <div className="panel focus-panel">

            <span className="focus-label">
              PRODUTIVIDADE
            </span>

            <h2>
              Continue avançando.
            </h2>

            <p>
              Cada tarefa concluída aproxima você dos seus objetivos.
            </p>

            <div className="focus-number">
              {
                dashboard.completed
              }
            </div>

            <span>
              tarefas concluídas
            </span>

          </div>

        </section>

        {/* ===================================================
            TAREFAS
        =================================================== */}

        <section className="tasks-section">

          <div className="tasks-heading">

            <div>

              <h2>
                Minhas tarefas
              </h2>

              <p>
                Acompanhe as atividades mais recentes.
              </p>

            </div>

            <button
              className="view-all"
              onClick={() =>
                navigate(
                  "/tasks"
                )
              }
            >
              Ver todas

              <ChevronRight
                size={18}
              />
            </button>

          </div>

          <div className="task-list">

            {loading ? (

              <div className="empty-state">
                Carregando tarefas...
              </div>

            ) : visibleTasks.length ===
              0 ? (

              <div className="empty-state">

                <div className="empty-icon">

                  <ListTodo
                    size={30}
                  />

                </div>

                <h3>
                  Nenhuma tarefa para exibir
                </h3>

                <p>

                  {!preferences.completedTasks &&
                  dashboard.completed >
                    0
                    ? "As tarefas concluídas estão ocultas pelas suas configurações."
                    : "Crie sua primeira tarefa para começar a organizar seu dia."}

                </p>

                <button
                  onClick={
                    openCreateModal
                  }
                >
                  <Plus
                    size={18}
                  />

                  Criar tarefa
                </button>

              </div>

            ) : (

              visibleTasks.map(
                (task) => (

                  <div
                    className="task"
                    key={
                      task.id
                    }
                  >

                    {/* STATUS */}

                    <button
                      className={`task-check ${
                        task.status ===
                        "Concluída"
                          ? "completed"
                          : ""
                      }`}
                      onClick={() =>
                        changeStatus(
                          task
                        )
                      }
                      title="Alterar status"
                    >

                      {task.status ===
                        "Concluída" && (

                        <CheckCircle2
                          size={22}
                        />

                      )}

                    </button>

                    {/* CONTEÚDO */}

                    <div className="task-content">

                      <h3
                        className={
                          task.status ===
                          "Concluída"
                            ? "task-completed"
                            : ""
                        }
                      >
                        {
                          task.title
                        }
                      </h3>

                      <div className="task-meta">

                        <span>
                          {
                            task.category
                          }
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          {formatDate(
                            task.due_date
                          )}
                        </span>

                        <span
                          className={`status status-${task.status
                            .toLowerCase()
                            .replaceAll(
                              " ",
                              "-"
                            )}`}
                        >
                          {
                            task.status
                          }
                        </span>

                      </div>

                    </div>

                    {/* PRIORIDADE */}

                    <span
                      className={`priority ${priorityClass(
                        task.priority
                      )}`}
                    >
                      {
                        task.priority
                      }
                    </span>

                    {/* EXCLUIR */}

                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDelete(
                          task.id
                        )
                      }
                      title="Excluir tarefa"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>

                  </div>

                )
              )

            )}

          </div>

        </section>

      </section>

      {/* =====================================================
          MODAL NOVA TAREFA
      ===================================================== */}

      {modalOpen && (

        <div className="modal-overlay">

          <div className="modal">

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  Nova tarefa
                </h2>

                <p>
                  Adicione uma nova atividade ao TaskFlow.
                </p>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={
                  closeModal
                }
              >
                <X />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* TÍTULO */}

              <label>

                Título

                <input
                  type="text"
                  placeholder="Ex: Finalizar dashboard"
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,

                      title:
                        event
                          .target
                          .value,
                    })
                  }
                  required
                />

              </label>

              {/* DESCRIÇÃO */}

              <label>

                Descrição

                <textarea
                  placeholder="Adicione uma descrição..."
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,

                      description:
                        event
                          .target
                          .value,
                    })
                  }
                />

              </label>

              {/* CATEGORIA / PRIORIDADE */}

              <div className="form-row">

                <label>

                  Categoria

                  <select
                    value={
                      form.category
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,

                        category:
                          event
                            .target
                            .value,
                      })
                    }
                    disabled={
                      categories.length ===
                      0
                    }
                  >

                    {categories.length ===
                    0 ? (

                      <option value="">
                        Nenhuma categoria disponível
                      </option>

                    ) : (

                      categories.map(
                        (category) => (

                          <option
                            key={
                              category.id
                            }
                            value={
                              category.name
                            }
                          >
                            {
                              category.name
                            }
                          </option>

                        )
                      )

                    )}

                  </select>

                </label>

                <label>

                  Prioridade

                  <select
                    value={
                      form.priority
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,

                        priority:
                          event
                            .target
                            .value,
                      })
                    }
                  >

                    <option value="Baixa">
                      Baixa
                    </option>

                    <option value="Média">
                      Média
                    </option>

                    <option value="Alta">
                      Alta
                    </option>

                  </select>

                </label>

              </div>

              {/* STATUS / PRAZO */}

              <div className="form-row">

                <label>

                  Status

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,

                        status:
                          event
                            .target
                            .value,
                      })
                    }
                  >

                    <option value="Pendente">
                      Pendente
                    </option>

                    <option value="Em andamento">
                      Em andamento
                    </option>

                    <option value="Concluída">
                      Concluída
                    </option>

                  </select>

                </label>

                <label>

                  Prazo

                  <input
                    type="date"
                    value={
                      form.due_date
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,

                        due_date:
                          event
                            .target
                            .value,
                      })
                    }
                  />

                </label>

              </div>

              {/* BOTÕES */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeModal
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={
                    categories.length ===
                    0
                  }
                >
                  <Plus
                    size={18}
                  />

                  Criar tarefa
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
}

// =========================================================
// CARD DOS INDICADORES
// =========================================================

function StatCard({
  title,
  value,
  icon,
  type,
}) {
  return (
    <div className="stat-card">

      <div
        className={`stat-icon ${type}`}
      >
        {icon}
      </div>

      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

export default Dashboard;