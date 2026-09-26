import { useEffect, useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
} from "lucide-react";

import { getTasks } from "../services/api";

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(
    new Date()
  );

  const [selectedDay, setSelectedDay] = useState(null);

  // =========================================================
  // CARREGAR TAREFAS
  // =========================================================

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);

        const data = await getTasks();

        setTasks(data);
      } catch (error) {
        console.error(
          "Erro ao carregar tarefas no calendário:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  // =========================================================
  // DATA ATUAL DO CALENDÁRIO
  // =========================================================

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const shortMonthNames = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];

  const weekDays = [
    "SEG",
    "TER",
    "QUA",
    "QUI",
    "SEX",
    "SÁB",
    "DOM",
  ];

  // =========================================================
  // DIAS DO MÊS
  // =========================================================

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const startDay =
    firstDay === 0
      ? 6
      : firstDay - 1;

  // =========================================================
  // TAREFAS COM PRAZO
  // =========================================================

  const tasksWithDate = useMemo(() => {
    return tasks.filter(
      (task) => task.due_date
    );
  }, [tasks]);

  // =========================================================
  // TAREFAS DO MÊS ATUAL
  // =========================================================

  const tasksCurrentMonth = useMemo(() => {
    return tasksWithDate.filter((task) => {
      const [
        taskYear,
        taskMonth,
      ] = task.due_date
        .split("-")
        .map(Number);

      return (
        taskYear === year &&
        taskMonth === month + 1
      );
    });
  }, [
    tasksWithDate,
    year,
    month,
  ]);

  // =========================================================
  // PRÓXIMOS PRAZOS
  // =========================================================

  const upcomingTasks = useMemo(() => {
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return tasksWithDate
      .filter((task) => {
        if (
          task.status === "Concluída"
        ) {
          return false;
        }

        const [
          taskYear,
          taskMonth,
          taskDay,
        ] = task.due_date
          .split("-")
          .map(Number);

        const taskDate = new Date(
          taskYear,
          taskMonth - 1,
          taskDay
        );

        return taskDate >= today;
      })
      .sort((a, b) => {
        return a.due_date.localeCompare(
          b.due_date
        );
      })
      .slice(0, 5);
  }, [tasksWithDate]);

  // =========================================================
  // TAREFAS ATRASADAS
  // =========================================================

  const overdueTasks = useMemo(() => {
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return tasksWithDate.filter(
      (task) => {
        if (
          task.status === "Concluída"
        ) {
          return false;
        }

        const [
          taskYear,
          taskMonth,
          taskDay,
        ] = task.due_date
          .split("-")
          .map(Number);

        const taskDate = new Date(
          taskYear,
          taskMonth - 1,
          taskDay
        );

        return taskDate < today;
      }
    );
  }, [tasksWithDate]);

  // =========================================================
  // BUSCAR TAREFAS DE UM DIA
  // =========================================================

  function getTasksForDay(day) {
    const dateString =
      `${year}-${String(
        month + 1
      ).padStart(
        2,
        "0"
      )}-${String(day).padStart(
        2,
        "0"
      )}`;

    return tasksWithDate.filter(
      (task) =>
        task.due_date === dateString
    );
  }

  // =========================================================
  // MÊS ANTERIOR
  // =========================================================

  function previousMonth() {
    setCurrentDate(
      new Date(
        year,
        month - 1,
        1
      )
    );

    setSelectedDay(null);
  }

  // =========================================================
  // PRÓXIMO MÊS
  // =========================================================

  function nextMonth() {
    setCurrentDate(
      new Date(
        year,
        month + 1,
        1
      )
    );

    setSelectedDay(null);
  }

  // =========================================================
  // HOJE
  // =========================================================

  function goToday() {
    setCurrentDate(
      new Date()
    );

    setSelectedDay(null);
  }

  // =========================================================
  // VERIFICAR SE É HOJE
  // =========================================================

  function isToday(day) {
    const today = new Date();

    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  }

  // =========================================================
  // ÍCONE DO STATUS
  // =========================================================

  function getStatusIcon(status) {
    if (
      status === "Concluída"
    ) {
      return (
        <CheckCircle2
          size={15}
        />
      );
    }

    if (
      status === "Em andamento"
    ) {
      return (
        <CircleDashed
          size={15}
        />
      );
    }

    return (
      <Clock3 size={15} />
    );
  }

  // =========================================================
  // FORMATAR PRIORIDADE
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
  // DIAS DO CALENDÁRIO
  // =========================================================

  const calendarDays = [];

  for (
    let i = 0;
    i < startDay;
    i++
  ) {
    calendarDays.push(
      <div
        className="calendar-day empty-day"
        key={`empty-${i}`}
      />
    );
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const dayTasks =
      getTasksForDay(day);

    calendarDays.push(
      <div
        className={`calendar-day ${
          isToday(day)
            ? "today"
            : ""
        } ${
          selectedDay === day
            ? "selected"
            : ""
        }`}
        key={day}
        onClick={() =>
          setSelectedDay(day)
        }
      >

        <div className="calendar-day-number">

          <span>
            {day}
          </span>

          {dayTasks.length > 0 && (
            <small>
              {dayTasks.length}
            </small>
          )}

        </div>

        <div className="calendar-day-tasks">

          {dayTasks
            .slice(0, 3)
            .map((task) => (

              <div
                className={`calendar-task priority-${priorityClass(
                  task.priority
                )}`}
                key={task.id}
                title={task.title}
              >

                <span className="calendar-task-icon">
                  {getStatusIcon(
                    task.status
                  )}
                </span>

                <span className="calendar-task-title">
                  {task.title}
                </span>

              </div>

            ))}

          {dayTasks.length > 3 && (

            <div className="calendar-more">
              +{dayTasks.length - 3} tarefas
            </div>

          )}

        </div>

      </div>
    );
  }

  // =========================================================
  // TAREFAS DO DIA SELECIONADO
  // =========================================================

  const selectedTasks =
    selectedDay
      ? getTasksForDay(
          selectedDay
        )
      : [];

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <section className="calendar-page">

      {/* HEADER */}

      <div className="calendar-page-header">

        <div>

          <p className="eyebrow">
            AGENDA
          </p>

          <h1>
            Calendário
          </h1>

          <p className="subtitle">
            Visualize seus prazos e tarefas por data.
          </p>

        </div>

        <button
          className="calendar-today-button"
          onClick={goToday}
        >
          <CalendarDays
            size={18}
          />

          Hoje
        </button>

      </div>

      {/* CALENDÁRIO */}

      <section className="calendar-card">

        <div className="calendar-navigation">

          <div>

            <h2>
              {monthNames[month]}{" "}
              {year}
            </h2>

            <p>
              {
                tasksCurrentMonth.length
              }{" "}
              {tasksCurrentMonth.length ===
              1
                ? "tarefa com prazo neste mês"
                : "tarefas com prazo neste mês"}
            </p>

          </div>

          <div className="calendar-navigation-buttons">

            <button
              onClick={
                previousMonth
              }
              title="Mês anterior"
            >
              <ChevronLeft
                size={20}
              />
            </button>

            <button
              onClick={
                nextMonth
              }
              title="Próximo mês"
            >
              <ChevronRight
                size={20}
              />
            </button>

          </div>

        </div>

        {/* DIAS DA SEMANA */}

        <div className="calendar-weekdays">

          {weekDays.map(
            (day) => (
              <div key={day}>
                {day}
              </div>
            )
          )}

        </div>

        {/* CALENDÁRIO */}

        {loading ? (

          <div className="calendar-loading">
            Carregando calendário...
          </div>

        ) : (

          <div className="calendar-grid">
            {calendarDays}
          </div>

        )}

      </section>

      {/* =====================================================
          DETALHES DO DIA
      ===================================================== */}

      {selectedDay && (

        <section className="selected-day-card">

          <div className="selected-day-header">

            <div>

              <span>
                TAREFAS DO DIA
              </span>

              <h2>
                {selectedDay} de{" "}
                {monthNames[month]}
              </h2>

            </div>

            <button
              onClick={() =>
                setSelectedDay(
                  null
                )
              }
            >
              ×
            </button>

          </div>

          {selectedTasks.length ===
          0 ? (

            <div className="selected-day-empty">

              <CalendarDays
                size={30}
              />

              <p>
                Nenhuma tarefa para este dia.
              </p>

            </div>

          ) : (

            <div className="selected-day-list">

              {selectedTasks.map(
                (task) => (

                  <div
                    className="selected-day-task"
                    key={task.id}
                  >

                    <div
                      className={`selected-task-status ${
                        task.status ===
                        "Concluída"
                          ? "completed"
                          : ""
                      }`}
                    >
                      {getStatusIcon(
                        task.status
                      )}
                    </div>

                    <div className="selected-task-content">

                      <h3>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p>
                          {
                            task.description
                          }
                        </p>
                      )}

                      <div className="selected-task-meta">

                        <span>
                          {
                            task.category
                          }
                        </span>

                        <span>
                          {
                            task.status
                          }
                        </span>

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

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      )}

      {/* =====================================================
          PRÓXIMOS PRAZOS
      ===================================================== */}

      <section className="deadlines-section">

        <div className="deadlines-header">

          <div>

            <p className="eyebrow">
              AGENDA
            </p>

            <h2>
              Próximos prazos
            </h2>

            <p>
              Acompanhe as tarefas que estão chegando.
            </p>

          </div>

          {overdueTasks.length >
            0 && (

            <div className="overdue-warning">

              <AlertCircle
                size={17}
              />

              {
                overdueTasks.length
              }{" "}

              {overdueTasks.length ===
              1
                ? "tarefa atrasada"
                : "tarefas atrasadas"}

            </div>

          )}

        </div>

        {loading ? (

          <div className="deadlines-empty">
            Carregando prazos...
          </div>

        ) : upcomingTasks.length ===
          0 ? (

          <div className="deadlines-empty">

            <CalendarDays
              size={32}
            />

            <h3>
              Nenhum prazo próximo
            </h3>

            <p>
              Suas próximas tarefas com prazo aparecerão aqui.
            </p>

          </div>

        ) : (

          <div className="deadlines-list">

            {upcomingTasks.map(
              (task) => {

                const [
                  taskYear,
                  taskMonth,
                  taskDay,
                ] = task.due_date
                  .split("-")
                  .map(Number);

                return (

                  <div
                    className="deadline-item"
                    key={task.id}
                  >

                    <div className="deadline-date">

                      <strong>
                        {String(
                          taskDay
                        ).padStart(
                          2,
                          "0"
                        )}
                      </strong>

                      <span>
                        {
                          shortMonthNames[
                            taskMonth -
                              1
                          ]
                        }
                      </span>

                    </div>

                    <div className="deadline-content">

                      <h3>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p>
                          {
                            task.description
                          }
                        </p>
                      )}

                      <div className="deadline-meta">

                        <span>
                          {
                            task.category
                          }
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

                    <div
                      className={`deadline-priority ${priorityClass(
                        task.priority
                      )}`}
                    >
                      {
                        task.priority
                      }
                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>

    </section>
  );
}

export default Calendar;