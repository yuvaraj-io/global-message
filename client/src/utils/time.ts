export const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
};

export const fullDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));

export const clockTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));

export const isSameDay = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const dayLabel = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date.toISOString(), today.toISOString())) return "Today";
  if (isSameDay(date.toISOString(), yesterday.toISOString())) return "Yesterday";
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
};
