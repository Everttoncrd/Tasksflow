import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Tags,
  Settings,
  Plus,
  Search,
  Bell,
  CheckCircle2,
  Clock3,
  CircleDashed,
  ClipboardList,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";

import {
  getTasks,
  getDashboard,
  createTask,
  updateTask,
  deleteTask,
} from "./services/api";

import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);

  const [dashboard, setDashboard] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    completed: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Trabalho",
    priority: "Média",
    status: "Pendente",
    due_date: "",
  });

  async function loadData() {
    try {
      setLoading(true);

      const [tasksData, dashboardData] = await Promise.all([
        getTasks(),
        getDashboard(),
      ]);

      setTasks(tasksData);
      setDashboard(dashboardData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    try {
      await createTask(form);

      setForm({
        title: "",
        description: "",
        category: "Trabalho",
        priority: "Média",
        status: "Pendente",
        due_date: "",
      });

      setModalOpen(false);

      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function changeStatus(task) {
    let nextStatus = "Pendente";

    if (task.status === "Pendente") {
      nextStatus = "Em andamento";
    } else if (task.status === "Em andamento") {
      nextStatus = "Concluída";
    }

    try {
      await updateTask(task.id, {
        ...task,
        status: nextStatus,
      });

      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  const progressPercentage =
    dashboard.total > 0
      ? Math.round((dashboard.completed / dashboard.total) * 100)
      : 0;

  function formatDate(date) {
    if (!date) {
      return "Sem prazo";
    }

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  function priorityClass(priority) {
    return priority
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <div className="logo">
            <div className="logo-icon">
              <CheckCircle2 size={25} />
            </div>

            <span>TaskFlow</span>
          </div>

          <nav className="navigation">
            <button className="nav-item active">
              <LayoutDashboard size={20} />
              Dashboard
            </button>

            <button className="nav-item">
              <ListTodo size={20} />
              Minhas tarefas
            </button>

            <button className="nav-item">
              <CalendarDays size={20} />
              Calendário
            </button>

            <button className="nav-item">
              <Tags size={20} />
              Categorias
            </button>
          </nav>
        </div>

        <button className="nav-item settings">
          <Settings size={20} />
          Configurações
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Pesquisar tarefas..."
            />
          </div>

          <div className="profile">
            <button className="notification">
              <Bell size={20} />
              <span></span>
            </button>

            <div className="avatar">
              E
            </div>

            <div className="profile-info">
              <strong>Everton</strong>
              <span>Meu espaço</span>
            </div>
          </div>
        </header>

        <section className="content">
          <div className="heading">
            <div>
              <p className="eyebrow">VISÃO GERAL</p>

              <h1>Olá, Everton 👋</h1>

              <p className="subtitle">
                Organize seu dia e acompanhe seu progresso.
              </p>
            </div>

            <button
              className="new-task"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={20} />
              Nova tarefa
            </button>
          </div>

          <section className="stats">
            <StatCard
              title="Total de tarefas"
              value={dashboard.total}
              icon={<ClipboardList />}
              type="purple"
            />

            <StatCard
              title="Pendentes"
              value={dashboard.pending}
              icon={<Clock3 />}
              type="orange"
            />

            <StatCard
              title="Em andamento"
              value={dashboard.progress}
              icon={<CircleDashed />}
              type="blue"
            />

            <StatCard
              title="Concluídas"
              value={dashboard.completed}
              icon={<CheckCircle2 />}
              type="green"
            />
          </section>

          <section className="dashboard-grid">
            <div className="panel progress-panel">
              <div className="panel-title">
                <div>
                  <h2>Seu progresso</h2>
                  <p>Progresso geral das suas tarefas</p>
                </div>

                <strong>{progressPercentage}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-bar"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                ></div>
              </div>

              <div className="progress-footer">
                <span>
                  {dashboard.completed} concluídas
                </span>

                <span>
                  {dashboard.total - dashboard.completed} restantes
                </span>
              </div>
            </div>

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
                {dashboard.completed}
              </div>

              <span>tarefas concluídas</span>
            </div>
          </section>

          <section className="tasks-section">
            <div className="tasks-heading">
              <div>
                <h2>Minhas tarefas</h2>
                <p>
                  Acompanhe as atividades mais recentes.
                </p>
              </div>

              <button className="view-all">
                Ver todas
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="task-list">
              {loading ? (
                <div className="empty-state">
                  Carregando tarefas...
                </div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <ListTodo size={30} />
                  </div>

                  <h3>Nenhuma tarefa ainda</h3>

                  <p>
                    Crie sua primeira tarefa para começar a organizar seu dia.
                  </p>

                  <button
                    onClick={() => setModalOpen(true)}
                  >
                    <Plus size={18} />
                    Criar tarefa
                  </button>
                </div>
              ) : (
                tasks.slice(0, 6).map((task) => (
                  <div
                    className="task"
                    key={task.id}
                  >
                    <button
                      className={`task-check ${
                        task.status === "Concluída"
                          ? "completed"
                          : ""
                      }`}
                      onClick={() => changeStatus(task)}
                    >
                      {task.status === "Concluída" && (
                        <CheckCircle2 size={22} />
                      )}
                    </button>

                    <div className="task-content">
                      <h3
                        className={
                          task.status === "Concluída"
                            ? "task-completed"
                            : ""
                        }
                      >
                        {task.title}
                      </h3>

                      <div className="task-meta">
                        <span>{task.category}</span>
                        <span>•</span>
                        <span>
                          {formatDate(task.due_date)}
                        </span>

                        <span
                          className={`status status-${task.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`priority ${priorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>

                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDelete(task.id)
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </main>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Nova tarefa</h2>
                <p>
                  Adicione uma nova atividade ao TaskFlow.
                </p>
              </div>

              <button
                className="close-modal"
                onClick={() => setModalOpen(false)}
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Título
                <input
                  type="text"
                  placeholder="Ex: Finalizar dashboard"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Descrição
                <textarea
                  placeholder="Adicione uma descrição..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                />
              </label>

              <div className="form-row">
                <label>
                  Categoria

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category:
                          event.target.value,
                      })
                    }
                  >
                    <option>Trabalho</option>
                    <option>Estudos</option>
                    <option>Pessoal</option>
                    <option>Projetos</option>
                  </select>
                </label>

                <label>
                  Prioridade

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority:
                          event.target.value,
                      })
                    }
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  Status

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target.value,
                      })
                    }
                  >
                    <option>Pendente</option>
                    <option>Em andamento</option>
                    <option>Concluída</option>
                  </select>
                </label>

                <label>
                  Prazo

                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        due_date:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  <Plus size={18} />
                  Criar tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  type,
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${type}`}>
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default App;