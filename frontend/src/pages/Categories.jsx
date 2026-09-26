import { useEffect, useMemo, useState } from "react";

import {
  BriefcaseBusiness,
  GraduationCap,
  UserRound,
  FolderKanban,
  ListTodo,
  Clock3,
  CircleDashed,
  CheckCircle2,
  ChevronRight,
  X,
  Plus,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react";

import {
  getTasks,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api";

function Categories() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [categoryName, setCategoryName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =========================================================
  // INFORMAÇÕES VISUAIS
  // =========================================================

  function getCategoryVisual(categoryName) {
    const defaultCategories = {
      Trabalho: {
        description:
          "Tarefas profissionais e atividades de trabalho.",
        icon: BriefcaseBusiness,
        className: "work",
      },

      Estudos: {
        description:
          "Cursos, estudos e desenvolvimento profissional.",
        icon: GraduationCap,
        className: "study",
      },

      Pessoal: {
        description:
          "Compromissos e atividades pessoais.",
        icon: UserRound,
        className: "personal",
      },

      Projetos: {
        description:
          "Projetos pessoais e profissionais.",
        icon: FolderKanban,
        className: "projects",
      },
    };

    if (
      defaultCategories[
        categoryName
      ]
    ) {
      return defaultCategories[
        categoryName
      ];
    }

    return {
      description:
        "Categoria personalizada para organizar suas tarefas.",
      icon: Tag,
      className: "custom",
    };
  }

  // =========================================================
  // CARREGAR DADOS
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
      setCategories(
        categoriesData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar categorias:",
        error
      );

      setErrorMessage(
        error.message ||
          "Não foi possível carregar as categorias."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // ESTATÍSTICAS DA CATEGORIA
  // =========================================================

  function getCategoryStats(
    categoryName
  ) {
    const categoryTasks =
      tasks.filter(
        (task) =>
          task.category ===
          categoryName
      );

    const total =
      categoryTasks.length;

    const pending =
      categoryTasks.filter(
        (task) =>
          task.status ===
          "Pendente"
      ).length;

    const progress =
      categoryTasks.filter(
        (task) =>
          task.status ===
          "Em andamento"
      ).length;

    const completed =
      categoryTasks.filter(
        (task) =>
          task.status ===
          "Concluída"
      ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed /
              total) *
              100
          );

    return {
      total,
      pending,
      progress,
      completed,
      percentage,
    };
  }

  // =========================================================
  // RESUMO GERAL
  // =========================================================

  const summary =
    useMemo(() => {
      const completed =
        tasks.filter(
          (task) =>
            task.status ===
            "Concluída"
        ).length;

      const pending =
        tasks.filter(
          (task) =>
            task.status ===
            "Pendente"
        ).length;

      const progress =
        tasks.filter(
          (task) =>
            task.status ===
            "Em andamento"
        ).length;

      return {
        total:
          tasks.length,

        completed,

        pending,

        progress,
      };
    }, [tasks]);

  // =========================================================
  // TAREFAS DA CATEGORIA SELECIONADA
  // =========================================================

  const selectedTasks =
    useMemo(() => {
      if (
        !selectedCategory
      ) {
        return [];
      }

      return tasks.filter(
        (task) =>
          task.category ===
          selectedCategory
      );
    }, [
      tasks,
      selectedCategory,
    ]);

  // =========================================================
  // FORMATAR DATA
  // =========================================================

  function formatDate(date) {
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
  // PRIORIDADE
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
  // ABRIR NOVA CATEGORIA
  // =========================================================

  function openCreateModal() {
    setEditingCategory(
      null
    );

    setCategoryName("");

    setErrorMessage("");

    setModalOpen(true);
  }

  // =========================================================
  // ABRIR EDIÇÃO
  // =========================================================

  function openEditModal(
    event,
    category
  ) {
    event.stopPropagation();

    setEditingCategory(
      category
    );

    setCategoryName(
      category.name
    );

    setErrorMessage("");

    setModalOpen(true);
  }

  // =========================================================
  // FECHAR MODAL
  // =========================================================

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingCategory(
      null
    );

    setCategoryName("");

    setErrorMessage("");
  }

  // =========================================================
  // SALVAR CATEGORIA
  // =========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const name =
      categoryName.trim();

    if (!name) {
      setErrorMessage(
        "Digite um nome para a categoria."
      );

      return;
    }

    try {
      setSaving(true);

      setErrorMessage("");

      if (editingCategory) {
        const oldName =
          editingCategory.name;

        const updated =
          await updateCategory(
            editingCategory.id,
            name
          );

        // Se a categoria aberta nos detalhes
        // foi renomeada, atualizamos o nome.
        if (
          selectedCategory ===
          oldName
        ) {
          setSelectedCategory(
            updated.name
          );
        }
      } else {
        await createCategory(
          name
        );
      }

      await loadData();

      setModalOpen(false);

      setEditingCategory(
        null
      );

      setCategoryName("");
    } catch (error) {
      console.error(
        "Erro ao salvar categoria:",
        error
      );

      setErrorMessage(
        error.message ||
          "Não foi possível salvar a categoria."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // EXCLUIR CATEGORIA
  // =========================================================

  async function handleDelete(
    event,
    category
  ) {
    event.stopPropagation();

    const confirmDelete =
      window.confirm(
        `Deseja realmente excluir a categoria "${category.name}"?`
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setErrorMessage("");

      await deleteCategory(
        category.id
      );

      if (
        selectedCategory ===
        category.name
      ) {
        setSelectedCategory(
          null
        );
      }

      await loadData();
    } catch (error) {
      console.error(
        "Erro ao excluir categoria:",
        error
      );

      window.alert(
        error.message ||
          "Não foi possível excluir a categoria."
      );
    }
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <>
      <section className="categories-page">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="categories-page-header">

          <div>

            <p className="eyebrow">
              ORGANIZAÇÃO
            </p>

            <h1>
              Categorias
            </h1>

            <p className="subtitle">
              Organize e acompanhe suas tarefas por área.
            </p>

          </div>

          <button
            className="new-task"
            onClick={
              openCreateModal
            }
          >
            <Plus size={20} />

            Nova categoria
          </button>

        </div>

        {/* ===================================================
            RESUMO
        =================================================== */}

        <section className="categories-summary">

          <div className="category-summary-card">

            <div className="category-summary-icon">
              <ListTodo
                size={19}
              />
            </div>

            <div>

              <span>
                Total de tarefas
              </span>

              <strong>
                {summary.total}
              </strong>

            </div>

          </div>

          <div className="category-summary-card">

            <div className="category-summary-icon">
              <Clock3
                size={19}
              />
            </div>

            <div>

              <span>
                Pendentes
              </span>

              <strong>
                {summary.pending}
              </strong>

            </div>

          </div>

          <div className="category-summary-card">

            <div className="category-summary-icon">
              <CircleDashed
                size={19}
              />
            </div>

            <div>

              <span>
                Em andamento
              </span>

              <strong>
                {summary.progress}
              </strong>

            </div>

          </div>

          <div className="category-summary-card">

            <div className="category-summary-icon">
              <CheckCircle2
                size={19}
              />
            </div>

            <div>

              <span>
                Concluídas
              </span>

              <strong>
                {summary.completed}
              </strong>

            </div>

          </div>

        </section>

        {/* ===================================================
            CATEGORIAS
        =================================================== */}

        <div className="categories-section-header">

          <div>

            <h2>
              Suas categorias
            </h2>

            <p>
              Clique em uma categoria para visualizar suas tarefas.
            </p>

          </div>

          {!loading && (
            <span className="categories-count">
              {categories.length}{" "}
              {categories.length ===
              1
                ? "categoria"
                : "categorias"}
            </span>
          )}

        </div>

        {loading ? (

          <div className="categories-loading">
            Carregando categorias...
          </div>

        ) : categories.length ===
          0 ? (

          <div className="categories-empty-state">

            <Tag size={30} />

            <h3>
              Nenhuma categoria
            </h3>

            <p>
              Crie sua primeira categoria para organizar suas tarefas.
            </p>

            <button
              className="new-task"
              onClick={
                openCreateModal
              }
            >
              <Plus
                size={18}
              />

              Nova categoria
            </button>

          </div>

        ) : (

          <section className="categories-grid">

            {categories.map(
              (category) => {
                const visual =
                  getCategoryVisual(
                    category.name
                  );

                const Icon =
                  visual.icon;

                const stats =
                  getCategoryStats(
                    category.name
                  );

                return (

                  <div
                    className={`category-card category-${visual.className}`}
                    key={
                      category.id
                    }
                    onClick={() =>
                      setSelectedCategory(
                        category.name
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        setSelectedCategory(
                          category.name
                        );
                      }
                    }}
                  >

                    {/* =======================================
                        TOPO
                    ======================================= */}

                    <div className="category-card-top">

                      <div className="category-icon">

                        <Icon
                          size={22}
                        />

                      </div>

                      <div className="category-card-actions">

                        <button
                          type="button"
                          className="category-action-button"
                          onClick={(
                            event
                          ) =>
                            openEditModal(
                              event,
                              category
                            )
                          }
                          title="Editar categoria"
                        >
                          <Pencil
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          className="category-action-button category-delete-action"
                          onClick={(
                            event
                          ) =>
                            handleDelete(
                              event,
                              category
                            )
                          }
                          title="Excluir categoria"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>

                        <ChevronRight
                          className="category-arrow"
                          size={20}
                        />

                      </div>

                    </div>

                    {/* =======================================
                        CONTEÚDO
                    ======================================= */}

                    <div className="category-card-content">

                      <h3>
                        {
                          category.name
                        }
                      </h3>

                      <p>
                        {
                          visual.description
                        }
                      </p>

                    </div>

                    {/* =======================================
                        TOTAL
                    ======================================= */}

                    <div className="category-total">

                      <strong>
                        {stats.total}
                      </strong>

                      <span>

                        {stats.total ===
                        1
                          ? "tarefa"
                          : "tarefas"}

                      </span>

                    </div>

                    {/* =======================================
                        PROGRESSO
                    ======================================= */}

                    <div className="category-progress">

                      <div className="category-progress-info">

                        <span>
                          Progresso
                        </span>

                        <strong>
                          {
                            stats.percentage
                          }
                          %
                        </strong>

                      </div>

                      <div className="category-progress-bar">

                        <div
                          className="category-progress-fill"
                          style={{
                            width:
                              `${stats.percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* =======================================
                        STATUS
                    ======================================= */}

                    <div className="category-status-row">

                      <div>

                        <span className="status-dot pending" />

                        <small>
                          {
                            stats.pending
                          }{" "}
                          pendentes
                        </small>

                      </div>

                      <div>

                        <span className="status-dot progress" />

                        <small>
                          {
                            stats.progress
                          }{" "}
                          em andamento
                        </small>

                      </div>

                      <div>

                        <span className="status-dot completed" />

                        <small>
                          {
                            stats.completed
                          }{" "}
                          concluídas
                        </small>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </section>

        )}

        {/* ===================================================
            DETALHES
        =================================================== */}

        {selectedCategory && (

          <section className="category-details">

            <div className="category-details-header">

              <div>

                <p className="eyebrow">
                  {selectedCategory.toUpperCase()}
                </p>

                <h2>
                  Tarefas de{" "}
                  {selectedCategory}
                </h2>

                <p>
                  {
                    selectedTasks.length
                  }{" "}
                  {selectedTasks.length ===
                  1
                    ? "tarefa encontrada"
                    : "tarefas encontradas"}
                </p>

              </div>

              <button
                className="category-close"
                onClick={() =>
                  setSelectedCategory(
                    null
                  )
                }
                title="Fechar"
              >
                <X
                  size={18}
                />
              </button>

            </div>

            {selectedTasks.length ===
            0 ? (

              <div className="category-empty">

                <ListTodo
                  size={30}
                />

                <h3>
                  Nenhuma tarefa nesta categoria
                </h3>

                <p>
                  As tarefas cadastradas em{" "}
                  {selectedCategory}{" "}
                  aparecerão aqui.
                </p>

              </div>

            ) : (

              <div className="category-task-list">

                {selectedTasks.map(
                  (task) => (

                    <div
                      className="category-task-item"
                      key={
                        task.id
                      }
                    >

                      <div
                        className={`category-task-status status-${task.status
                          .toLowerCase()
                          .replaceAll(
                            " ",
                            "-"
                          )}`}
                      >

                        {task.status ===
                        "Concluída" ? (

                          <CheckCircle2
                            size={18}
                          />

                        ) : task.status ===
                          "Em andamento" ? (

                          <CircleDashed
                            size={18}
                          />

                        ) : (

                          <Clock3
                            size={18}
                          />

                        )}

                      </div>

                      <div className="category-task-content">

                        <h3>
                          {
                            task.title
                          }
                        </h3>

                        {task.description && (

                          <p>
                            {
                              task.description
                            }
                          </p>

                        )}

                        <div className="category-task-meta">

                          <span>
                            {formatDate(
                              task.due_date
                            )}
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {
                              task.status
                            }
                          </span>

                        </div>

                      </div>

                      <span
                        className={`priority ${priorityClass(
                          task.priority
                        )}`}
                      >
                        {
                          task.priority
                        }
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        )}

      </section>

      {/* =====================================================
          MODAL CATEGORIA
      ===================================================== */}

      {modalOpen && (

        <div className="modal-overlay">

          <div className="modal category-modal">

            <div className="modal-header">

              <div>

                <h2>

                  {editingCategory
                    ? "Editar categoria"
                    : "Nova categoria"}

                </h2>

                <p>

                  {editingCategory
                    ? "Altere o nome da categoria."
                    : "Crie uma nova categoria para organizar suas tarefas."}

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

            <form
              onSubmit={
                handleSubmit
              }
            >

              <label>

                Nome da categoria

                <input
                  type="text"
                  placeholder="Ex: Freelance"
                  value={
                    categoryName
                  }
                  maxLength={50}
                  autoFocus
                  onChange={(
                    event
                  ) => {
                    setCategoryName(
                      event.target
                        .value
                    );

                    if (
                      errorMessage
                    ) {
                      setErrorMessage(
                        ""
                      );
                    }
                  }}
                />

              </label>

              <div className="category-character-count">
                {
                  categoryName.length
                }
                /50
              </div>

              {errorMessage && (

                <div className="category-form-error">
                  {
                    errorMessage
                  }
                </div>

              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={
                    saving
                  }
                >

                  {editingCategory ? (
                    <>
                      <CheckCircle2
                        size={18}
                      />

                      {saving
                        ? "Salvando..."
                        : "Salvar alterações"}
                    </>
                  ) : (
                    <>
                      <Plus
                        size={18}
                      />

                      {saving
                        ? "Criando..."
                        : "Criar categoria"}
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

export default Categories;