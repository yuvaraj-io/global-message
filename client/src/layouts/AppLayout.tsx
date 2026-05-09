import { FiHome, FiLogOut, FiMessageSquare, FiSearch, FiUser } from "react-icons/fi";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
    isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
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
    <div className="min-h-screen text-slate-100">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-white/10 bg-space-950/90 px-4 py-6 backdrop-blur lg:block">
        <div className="mb-8 px-2">
          <div className="text-2xl font-black tracking-tight text-white">Global Space</div>
          <p className="mt-1 text-sm text-slate-500">Realtime discussion network</p>
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <button className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white" onClick={logout}>
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </nav>
      </aside>

      <main className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-4 lg:ml-72 lg:px-8 lg:pb-8">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-white/10 bg-space-950/95 px-2 py-2 backdrop-blur lg:hidden">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-lg py-2 text-xs ${isActive ? "text-space-cyan" : "text-slate-500"}`}>
            <span className="text-xl">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        <button className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs text-slate-500" onClick={logout}>
          <FiLogOut className="text-xl" />
          Logout
        </button>
      </nav>
    </div>
  );
};
