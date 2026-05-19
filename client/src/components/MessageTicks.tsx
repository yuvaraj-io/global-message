type Props = {
  status: "pending" | "sent" | "delivered" | "seen";
};

export const MessageTicks = ({ status }: Props) => {
  if (status === "pending") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-label="Sending" className="text-wa-muted">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5V8l2 1.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "sent") {
    return (
      <svg viewBox="0 0 16 11" width="16" height="11" aria-label="Sent" className="text-wa-muted">
        <path
          d="M11.071 0.653a0.553 0.553 0 0 0-0.78 0.044L4.92 7.36 2.43 4.99a0.553 0.553 0 0 0-0.76 0.804l2.93 2.79a0.553 0.553 0 0 0 0.79-0.044l6.13-6.97a0.553 0.553 0 0 0-0.05-0.78z"
          fill="currentColor"
        />
      </svg>
    );
  }
  const color = status === "seen" ? "text-wa-blueTick" : "text-wa-muted";
  return (
    <svg viewBox="0 0 18 11" width="18" height="11" aria-label={status === "seen" ? "Seen" : "Delivered"} className={color}>
      <path
        d="M11.071 0.653a0.553 0.553 0 0 0-0.78 0.044L4.92 7.36 2.43 4.99a0.553 0.553 0 0 0-0.76 0.804l2.93 2.79a0.553 0.553 0 0 0 0.79-0.044l6.13-6.97a0.553 0.553 0 0 0-0.05-0.78z"
        fill="currentColor"
      />
      <path
        d="M15.071 0.653a0.553 0.553 0 0 0-0.78 0.044L8.92 7.36 7.7 6.2a0.553 0.553 0 1 0-0.76 0.804l1.66 1.58a0.553 0.553 0 0 0 0.79-0.044l6.13-6.97a0.553 0.553 0 0 0-0.05-0.78z"
        fill="currentColor"
      />
    </svg>
  );
};
