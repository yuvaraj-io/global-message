import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { User } from "../types";

type SearchContextValue = {
  query: string;
  users: User[];
  setQuery: (query: string) => void;
  setUsers: (users: User[]) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export const SearchProvider = ({ children }: PropsWithChildren) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const value = useMemo(() => ({ query, users, setQuery, setUsers }), [query, users]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearchState = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearchState must be used inside SearchProvider");
  return context;
};
