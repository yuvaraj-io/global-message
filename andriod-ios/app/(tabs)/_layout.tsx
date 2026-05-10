import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { colors } from "@/src/utils/theme";

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { unreadCount, unreadMessages } = useNotifications();
  const unreadMessageCount = Object.values(unreadMessages).reduce((total, count) => total + count, 0);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.border },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="search" color={color} />
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="chatbubbles" color={color} />,
          tabBarBadge: unreadMessageCount || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.lime, color: colors.bg }
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="notifications" color={color} />,
          tabBarBadge: unreadCount || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.rose, color: colors.text }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />
        }}
      />
      <Tabs.Screen name="profile/[username]" options={{ href: null }} />
      <Tabs.Screen name="messages/[username]" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
