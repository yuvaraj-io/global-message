import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import { UserAvatar } from "../components/UserAvatar";
import { useDebounce } from "../hooks/useDebounce";
import { api } from "../services/api";
import { User } from "../types";

export const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    api.get("/users/search", { params: { q: debounced } }).then((res) => setUsers(res.data.users));
  }, [debounced]);

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
          <Link key={user.id} to={`/profile/${user.username}`} className="panel flex items-center gap-3 rounded-xl p-4 transition hover:border-white/20">
            <UserAvatar user={user} />
            <div>
              <div className="font-semibold text-white">@{user.username}</div>
              <p className="line-clamp-1 text-sm text-slate-500">{user.bio}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
