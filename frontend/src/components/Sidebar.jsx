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
  X,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";


function Sidebar({
  isOpen = false,
  onClose = () => {},
}) {
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
      onClose();

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  }


  function handleNavigation() {
    onClose();
  }


  const linkClass =
    ({ isActive }) =>
      `sidebar-link ${
        isActive
          ? "active"
          : ""
      }`;


  return (
    <>
      <div
        className={
          `sidebar-overlay ${
            isOpen
              ? "show"
              : ""
          }`
        }
        onClick={onClose}
        aria-hidden="true"
      />


      <aside
        className={
          `sidebar ${
            isOpen
              ? "sidebar-open"
              : ""
          }`
        }
      >

        <div className="sidebar-mobile-top">

          <div className="logo sidebar-mobile-logo">

            <div className="logo-icon">
              <CheckCircle2
                size={23}
              />
            </div>

            <span>
              TaskFlow
            </span>

          </div>


          <button
            type="button"
            className="sidebar-close-button"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={23} />
          </button>

        </div>


        <div className="logo sidebar-desktop-logo">

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
            onClick={handleNavigation}
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
            onClick={handleNavigation}
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
            onClick={handleNavigation}
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
            onClick={handleNavigation}
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


        <div className="sidebar-bottom">

          <NavLink
            to="/settings"
            className={linkClass}
            onClick={handleNavigation}
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
    </>
  );
}

export default Sidebar;