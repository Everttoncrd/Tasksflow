import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Tags,
  Settings,
  CheckCircle2,
  LogOut,
  UserRound,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";


function Sidebar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();


  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  }


  const linkClass =
    ({ isActive }) =>
      `sidebar-link ${
        isActive
          ? "active"
          : ""
      }`;


  return (
    <aside className="sidebar">

      <div className="logo">

        <div className="logo-icon">
          <CheckCircle2
            size={23}
          />
        </div>

        <span>
          TaskFlow
        </span>

      </div>


      <nav className="sidebar-menu">

        <NavLink
          to="/"
          end
          className={linkClass}
        >
          <LayoutDashboard
            size={20}
          />

          <span>
            Dashboard
          </span>
        </NavLink>


        <NavLink
          to="/tasks"
          className={linkClass}
        >
          <ListTodo
            size={20}
          />

          <span>
            Minhas tarefas
          </span>
        </NavLink>


        <NavLink
          to="/calendar"
          className={linkClass}
        >
          <CalendarDays
            size={20}
          />

          <span>
            Calendário
          </span>
        </NavLink>


        <NavLink
          to="/categories"
          className={linkClass}
        >
          <Tags
            size={20}
          />

          <span>
            Categorias
          </span>
        </NavLink>

      </nav>


      <div className="sidebar-account">

        <UserRound
          size={18}
        />

        <div>
          <strong>
            {user?.name}
          </strong>

          <span>
            {user?.email}
          </span>
        </div>

      </div>


      <div className="Sidebar-bottom">

        <NavLink
          to="/settings"
          className={linkClass}
        >
          <Settings
            size={20}
          />

          <span>
            Configurações
          </span>
        </NavLink>


        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={
            handleLogout
          }
        >
          <LogOut
            size={20}
          />

          <span>
            Sair
          </span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;