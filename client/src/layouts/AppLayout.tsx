import { FiHome, FiLogOut, FiMessageSquare, FiSearch, FiUser } from "react-icons/fi";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
    isActive ? "bg-wa-green/10 text-wa-greenDark" : "text-wa-subtext hover:bg-wa-chatBg hover:text-wa-text"
  }`;

export const AppLayout = () => {
  const { user, logout } = useAuth();

  const links = [
    { to: "/", label: "Home", icon: <FiHome /> },
    { to: "/search", label: "Search", icon: <FiSearch /> },
    { to: "/messages", label: "Messages", icon: <FiMessageSquare /> },
    { to: `/profile/${user?.username}`, label: "Profile", icon: <FiUser /> }
  ];

  return (
    <div className="min-h-screen bg-wa-chatBg text-wa-text">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-wa-border bg-white px-4 py-6 lg:block">
        <div className="mb-8 px-2">
          <div className="text-2xl font-black tracking-tight text-wa-greenDark">Global Space</div>
          <p className="mt-1 text-sm text-wa-subtext">Realtime discussion network</p>
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <button
            className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-wa-subtext transition hover:bg-wa-chatBg hover:text-wa-text"
            onClick={logout}
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </nav>
      </aside>

      <main className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-4 lg:ml-72 lg:px-8 lg:pb-8 lg:pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-wa-border bg-white px-2 py-2 lg:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg py-2 text-xs ${
                isActive ? "text-wa-greenDark" : "text-wa-subtext"
              }`
            }
          >
            <span className="text-xl">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        <button className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs text-wa-subtext" onClick={logout}>
          <FiLogOut className="text-xl" />
          Logout
        </button>
      </nav>
    </div>
  );
};
