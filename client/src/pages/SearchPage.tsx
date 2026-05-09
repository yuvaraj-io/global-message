import { useEffect } from "react";
import { FiMessageSquare, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import { UserAvatar } from "../components/UserAvatar";
import { useSearchState } from "../context/SearchContext";
import { useDebounce } from "../hooks/useDebounce";
import { api } from "../services/api";

export const SearchPage = () => {
  const { query, setQuery, users, setUsers } = useSearchState();
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    if (!debounced.trim()) {
      setUsers([]);
      return;
    }
    api.get("/users/search", { params: { q: debounced } }).then((res) => setUsers(res.data.users));
  }, [debounced, setUsers]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-space-950/80 px-4 py-4 backdrop-blur">
        <h1 className="text-2xl font-black text-white">Search</h1>
      </header>
      <div className="panel mt-4 rounded-xl p-4">
        <label className="relative block">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search usernames" />
        </label>
      </div>
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="panel flex items-center gap-3 rounded-xl p-4 transition hover:border-white/20">
            <Link to={`/profile/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <div className="font-semibold text-white">@{user.username}</div>
                <p className="line-clamp-1 text-sm text-slate-500">{user.bio}</p>
              </div>
            </Link>
            <Link className="button-ghost shrink-0 px-3 py-2" to={`/messages/${user.username}`} aria-label={`Message ${user.username}`}>
              <FiMessageSquare />
              <span className="hidden sm:inline">Message</span>
            </Link>
          </div>
        ))}
        {query.trim() && !users.length && (
          <div className="panel rounded-xl p-8 text-center text-sm text-slate-500">
            No matching profiles found.
          </div>
        )}
      </div>
    </div>
  );
};
