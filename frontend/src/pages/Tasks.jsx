import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  X,
  ListTodo,
  Clock3,
  CircleDashed,
  Pencil,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

import {
  getTasks,
  getCategories,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../services/api";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [priorityFilter, setPriorityFilter] = useState("Todas");

  // =========================================================
  // PREFERÊNCIAS
  // =========================================================

  const [preferences, setPreferences] = useState({
    notifications: true,
    deadlineAlerts: true,
    completedTasks: true,
  });

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  const initialForm = {
    title: "",
    description: "",
    category: "",
    priority: "Média",
    status: "Pendente",
    due_date: "",
  };

  const [form, setForm] = useState(initialForm);

  // =========================================================
  // CARREGAR PREFERÊNCIAS
  // =========================================================

  function loadPreferences() {
    const storedSettings =
      localStorage.getItem("taskflow-settings");

    if (!storedSettings) {
      return;
    }

    try {
      const settings = JSON.parse(storedSettings);

      setPreferences({
        notifications:
          settings.notifications ?? true,

        deadlineAlerts:
          settings.deadlineAlerts ?? true,

        completedTasks:
          settings.completedTasks ?? true,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar preferências:",
        error
      );
    }
  }

  // =========================================================
  // CARREGAR TAREFAS E CATEGORIAS
  // =========================================================

  async function loadData() {
    try {
      setLoading(true);

      const [
        tasksData,
        categoriesData,
      ] = await Promise.all([
        getTasks(),
        getCategories(),
      ]);

      setTasks(tasksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error(
        "Erro ao carregar dados:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  useEffect(() => {
    loadData();
    loadPreferences();

    function handleSettingsChanged() {
      loadPreferences();
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
    setEditingTask(null);

    setForm({
      ...initialForm,
      category:
        categories.length > 0
          ? categories[0].name
          : "",
    });

    setModalOpen(true);
  }

  // =========================================================
  // ABRIR MODAL EDITAR
  // =========================================================

  function openEditModal(task) {
    setEditingTask(task);

    setForm({
      title: task.title || "",
      description: task.description || "",

      category:
        task.category ||
        categories[0]?.name ||
        "",

      priority:
        task.priority || "Média",

      status:
        task.status || "Pendente",

      due_date:
        task.due_date || "",
    });

    setModalOpen(true);
  }

  // =========================================================
  // FECHAR MODAL
  // =========================================================

  function closeModal() {
    setModalOpen(false);
    setEditingTask(null);

    setForm({
      ...initialForm,
    });
  }

  // =========================================================
  // CRIAR / EDITAR
  // =========================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    if (!form.category) {
      window.alert(
        "Crie uma categoria antes de cadastrar uma tarefa."
      );

      return;
    }

    try {
      if (editingTask) {
        const updatedTask =
          await updateTask(
            editingTask.id,
            form
          );

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === editingTask.id
              ? updatedTask
              : task
          )
        );
      } else {
        const newTask =
          await createTask(form);

        setTasks((currentTasks) => [
          newTask,
          ...currentTasks,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error(
        "Erro ao salvar tarefa:",
        error
      );

      window.alert(
        error.message ||
          "Não foi possível salvar a tarefa."
      );
    }
  }

  // =========================================================
  // EXCLUIR
  // =========================================================

  async function handleDelete(id) {
    const confirmDelete =
      window.confirm(
        "Tem certeza que deseja excluir esta tarefa?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteTask(id);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Erro ao excluir tarefa:",
        error
      );
    }
  }

  // =========================================================
  // ALTERAR STATUS
  // =========================================================

  async function changeStatus(task) {
    let nextStatus;

    if (task.status === "Pendente") {
      nextStatus = "Em andamento";
    } else if (
      task.status === "Em andamento"
    ) {
      nextStatus = "Concluída";
    } else {
      nextStatus = "Pendente";
    }

    try {
      const updatedTask =
        await updateTaskStatus(
          task.id,
          nextStatus
        );

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? updatedTask
            : currentTask
        )
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );
    }
  }

  // =========================================================
  // FORMATAR DATA
  // =========================================================

  function formatDate(date) {
    if (!date) {
      return "Sem prazo";
    }

    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;
  }

  // =========================================================
  // TRANSFORMAR DATA
  // =========================================================

  function parseTaskDate(date) {
    if (!date) {
      return null;
    }

    const [year, month, day] =
      date.split("-").map(Number);

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

  function priorityClass(priority) {
    return priority
      ?.toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  }

  // =========================================================
  // CONTADORES
  // =========================================================

  const counts = useMemo(() => {
    return {
      total: tasks.length,

      pending: tasks.filter(
        (task) =>
          task.status === "Pendente"
      ).length,

      progress: tasks.filter(
        (task) =>
          task.status === "Em andamento"
      ).length,

      completed: tasks.filter(
        (task) =>
          task.status === "Concluída"
      ).length,
    };
  }, [tasks]);

  // =========================================================
  // ALERTAS DE PRAZO
  // =========================================================

  const deadlineInfo = useMemo(() => {
    const today = new Date();

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

    tasks.forEach((task) => {
      if (
        !task.due_date ||
        task.status === "Concluída"
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

      if (dueDate < today) {
        overdue.push(task);

        return;
      }

      if (
        dueDate >= today &&
        dueDate <= threeDaysLater
      ) {
        upcoming.push(task);
      }
    });

    return {
      overdue,
      upcoming,

      total:
        overdue.length +
        upcoming.length,
    };
  }, [tasks]);

  // =========================================================
  // FILTROS
  // =========================================================

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // -------------------------------------------------------
      // PREFERÊNCIA: ESCONDER CONCLUÍDAS
      // -------------------------------------------------------

      if (
        !preferences.completedTasks &&
        task.status === "Concluída"
      ) {
        return false;
      }

      const title =
        task.title?.toLowerCase() ||
        "";

      const description =
        task.description?.toLowerCase() ||
        "";

      const searchText =
        search
          .trim()
          .toLowerCase();

      const matchesSearch =
        title.includes(
          searchText
        ) ||
        description.includes(
          searchText
        );

      const matchesStatus =
        statusFilter === "Todos" ||
        task.status ===
          statusFilter;

      const matchesCategory =
        categoryFilter === "Todas" ||
        task.category ===
          categoryFilter;

      const matchesPriority =
        priorityFilter === "Todas" ||
        task.priority ===
          priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    categoryFilter,
    priorityFilter,
    preferences.completedTasks,
  ]);

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <>
      <section className="tasks-page">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="tasks-page-header">

          <div>

            <p className="eyebrow">
              TAREFAS
            </p>

            <h1>
              Minhas tarefas
            </h1>

            <p className="subtitle">
              Gerencie todas as suas tarefas em um só lugar.
            </p>

          </div>

          <button
            className="new-task"
            onClick={
              openCreateModal
            }
          >
            <Plus size={20} />

            Nova tarefa
          </button>

        </div>

        {/* ===================================================
            ALERTAS DE PRAZO
        =================================================== */}

        {preferences.deadlineAlerts &&
          deadlineInfo.total > 0 && (

            <section className="task-deadline-alert">

              <div className="task-deadline-alert-icon">

                <AlertTriangle
                  size={22}
                />

              </div>

              <div className="task-deadline-alert-content">

                <strong>
                  {deadlineInfo.total === 1
                    ? "1 tarefa precisa de atenção"
                    : `${deadlineInfo.total} tarefas precisam de atenção`}
                </strong>

                <p>

                  {deadlineInfo.overdue.length >
                    0 && (
                    <span>
                      {
                        deadlineInfo
                          .overdue
                          .length
                      }{" "}
                      {deadlineInfo.overdue
                        .length === 1
                        ? "tarefa atrasada"
                        : "tarefas atrasadas"}
                    </span>
                  )}

                  {deadlineInfo.overdue.length >
                    0 &&
                    deadlineInfo.upcoming
                      .length > 0 && (
                      <span>
                        {" "}
                        •{" "}
                      </span>
                    )}

                  {deadlineInfo.upcoming.length >
                    0 && (
                    <span>
                      {
                        deadlineInfo
                          .upcoming
                          .length
                      }{" "}
                      {deadlineInfo.upcoming
                        .length === 1
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
            RESUMO
        =================================================== */}

        <section className="task-summary">

          <button
            className={
              statusFilter === "Todos"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Todos"
              )
            }
          >

            <ListTodo
              size={19}
            />

            <div>

              <span>
                Todas
              </span>

              <strong>
                {counts.total}
              </strong>

            </div>

          </button>

          <button
            className={
              statusFilter ===
              "Pendente"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Pendente"
              )
            }
          >

            <Clock3
              size={19}
            />

            <div>

              <span>
                Pendentes
              </span>

              <strong>
                {counts.pending}
              </strong>

            </div>

          </button>

          <button
            className={
              statusFilter ===
              "Em andamento"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Em andamento"
              )
            }
          >

            <CircleDashed
              size={19}
            />

            <div>

              <span>
                Em andamento
              </span>

              <strong>
                {counts.progress}
              </strong>

            </div>

          </button>

          <button
            className={
              statusFilter ===
              "Concluída"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "Concluída"
              )
            }
          >

            <CheckCircle2
              size={19}
            />

            <div>

              <span>
                Concluídas
              </span>

              <strong>
                {counts.completed}
              </strong>

            </div>

          </button>

        </section>

        {/* ===================================================
            FILTROS
        =================================================== */}

        <section className="tasks-toolbar">

          <div className="task-search">

            <Search
              size={18}
            />

            <input
              type="text"
              placeholder="Pesquisar tarefas..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {/* CATEGORIAS DINÂMICAS */}

          <select
            value={
              categoryFilter
            }
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >

            <option value="Todas">
              Todas as categorias
            </option>

            {categories.map(
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
            )}

          </select>

          <select
            value={
              priorityFilter
            }
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
          >

            <option value="Todas">
              Todas as prioridades
            </option>

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

        </section>

        {/* ===================================================
            LISTAGEM
        =================================================== */}

        <section className="all-tasks-container">

          <div className="all-tasks-header">

            <div>

              <h2>
                Tarefas
              </h2>

              <p>
                {
                  filteredTasks.length
                }{" "}
                {filteredTasks.length ===
                1
                  ? "tarefa encontrada"
                  : "tarefas encontradas"}
              </p>

            </div>

          </div>

          <div className="task-list">

            {loading ? (

              <div className="empty-state">

                <p>
                  Carregando tarefas...
                </p>

              </div>

            ) : filteredTasks.length ===
              0 ? (

              <div className="empty-state">

                <div className="empty-icon">

                  <ListTodo
                    size={30}
                  />

                </div>

                <h3>
                  Nenhuma tarefa encontrada
                </h3>

                <p>

                  {!preferences.completedTasks &&
                  counts.completed > 0 &&
                  statusFilter ===
                    "Concluída"
                    ? "A exibição de tarefas concluídas está desativada nas Configurações."
                    : "Crie uma nova tarefa ou altere os filtros."}

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

              filteredTasks.map(
                (task) => (

                  <div
                    className="task"
                    key={task.id}
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
                      title={`Status: ${task.status}`}
                    >

                      {task.status ===
                        "Concluída" && (

                        <CheckCircle2
                          size={22}
                        />

                      )}

                    </button>

                    {/* CONTEÚDO */}

                    <div
                      className="task-content"
                      onClick={() =>
                        openEditModal(
                          task
                        )
                      }
                      style={{
                        cursor:
                          "pointer",
                      }}
                      title="Clique para editar"
                    >

                      <h3
                        className={
                          task.status ===
                          "Concluída"
                            ? "task-completed"
                            : ""
                        }
                      >
                        {task.title}
                      </h3>

                      {task.description && (

                        <p className="task-description">
                          {
                            task.description
                          }
                        </p>

                      )}

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

                    {/* EDITAR */}

                    <button
                      className="edit-button"
                      onClick={() =>
                        openEditModal(
                          task
                        )
                      }
                      title="Editar tarefa"
                    >
                      <Pencil
                        size={18}
                      />
                    </button>

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
          MODAL
      ===================================================== */}

      {modalOpen && (

        <div className="modal-overlay">

          <div className="modal">

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <h2>

                  {editingTask
                    ? "Editar tarefa"
                    : "Nova tarefa"}

                </h2>

                <p>

                  {editingTask
                    ? "Altere as informações da tarefa."
                    : "Adicione uma nova atividade ao TaskFlow."}

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

            {/* FORMULÁRIO */}

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
                  placeholder="Ex: Finalizar projeto TaskFlow"
                  value={
                    form.title
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,

                      title:
                        event.target
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
                  onChange={(event) =>
                    setForm({
                      ...form,

                      description:
                        event.target
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
                    onChange={(event) =>
                      setForm({
                        ...form,

                        category:
                          event.target
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
                    onChange={(event) =>
                      setForm({
                        ...form,

                        priority:
                          event.target
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
                    onChange={(event) =>
                      setForm({
                        ...form,

                        status:
                          event.target
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
                    onChange={(event) =>
                      setForm({
                        ...form,

                        due_date:
                          event.target
                            .value,
                      })
                    }
                  />

                </label>

              </div>

              {/* AÇÕES */}

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

                  {editingTask ? (
                    <>
                      <CheckCircle2
                        size={18}
                      />

                      Salvar alterações
                    </>
                  ) : (
                    <>
                      <Plus
                        size={18}
                      />

                      Criar tarefa
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
}

export default Tasks;