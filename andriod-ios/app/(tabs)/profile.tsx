import { Redirect } from "expo-router";
import { LoadingState } from "@/src/components/LoadingState";
import { useAuth } from "@/src/context/AuthContext";

export default function MyProfileTab() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState />;
  return <Redirect href={`/profile/${user?.username}`} />;
}
