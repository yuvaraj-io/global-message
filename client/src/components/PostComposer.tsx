import { FormEvent, useState } from "react";
import { FiSend } from "react-icons/fi";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "./UserAvatar";

type Props = {
  onCreate?: (content: string) => void;
};

export const PostComposer = ({ onCreate }: Props) => {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !socket) return;
    setSending(true);
    onCreate?.(trimmed);
    setContent("");
    socket.emit("post:create", { content: trimmed }, () => setSending(false));
  };

  return (
    <form onSubmit={submit} className="panel rounded-xl p-4">
      <div className="flex gap-3">
        {user && <UserAvatar user={user} />}
        <div className="flex-1">
          <textarea
            className="input min-h-24 resize-none"
            value={content}
            maxLength={420}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Start a global discussion..."
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-wa-muted">{content.length}/420</span>
            <button className="button-primary" disabled={!content.trim() || sending} type="submit">
              <FiSend />
              Publish
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
