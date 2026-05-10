import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "@/src/components/Header";
import { Screen } from "@/src/components/Screen";
import { useNotifications } from "@/src/context/NotificationContext";
import { timeAgo } from "@/src/utils/time";
import { colors, shadow } from "@/src/utils/theme";

export default function NotificationsScreen() {
  const { notifications, markAllRead, openNotification } = useNotifications();

  return (
    <Screen>
      <Header title="Notifications" subtitle="Realtime alerts from discussions and messages." />
      <View style={styles.toolbar}>
        <Text style={styles.count}>{notifications.filter((item) => !item.read).length} unread</Text>
        <Pressable style={styles.markButton} onPress={markAllRead}>
          <Text style={styles.markText}>Mark all read</Text>
        </Pressable>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, !item.read && styles.unread]} onPress={() => openNotification(item)}>
            <View style={[styles.icon, item.type === "message" && styles.messageIcon]}>
              <Ionicons name={item.type === "message" ? "chatbubble" : item.type === "reply" ? "chatbox-ellipses" : "radio"} color={colors.bg} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  count: { color: colors.dim, fontWeight: "700" },
  markButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  markText: { color: colors.text, fontWeight: "800" },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  unread: { borderColor: "rgba(77,214,214,0.45)" },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  messageIcon: { backgroundColor: colors.lime },
  title: { color: colors.text, fontWeight: "900" },
  body: { color: colors.muted, marginTop: 3, lineHeight: 19 },
  time: { color: colors.dim, marginTop: 6, fontSize: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cyan },
  empty: { color: colors.dim, textAlign: "center", marginTop: 40 }
});
