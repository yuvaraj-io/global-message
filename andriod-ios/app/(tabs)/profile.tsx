import { useAuth } from "@/src/context/AuthContext";
import { LoadingState } from "@/src/components/LoadingState";
import ProfileScreen from "./profile/[username]";

export default function MyProfileTab() {
  const { user, loading } = useAuth();
  if (loading || !user) return <LoadingState />;
  return <ProfileScreen overrideUsername={user.username} />;
}
