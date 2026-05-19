import { User } from "../types";

type Props = {
  user: Pick<User, "avatar" | "username">;
  size?: "sm" | "md" | "lg";
  online?: boolean;
};

const sizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-20 w-20"
};

export const UserAvatar = ({ user, size = "md", online }: Props) => (
  <div className="relative shrink-0">
    <img
      className={`${sizes[size]} rounded-full border border-wa-border bg-wa-chatBg object-cover`}
      src={user.avatar}
      alt={user.username}
    />
    {online !== undefined && (
      <span
        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
          online ? "bg-wa-greenAccent" : "bg-wa-muted"
        }`}
      />
    )}
  </div>
);
