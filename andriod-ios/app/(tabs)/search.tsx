import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar } from "@/src/components/Avatar";
import { Header } from "@/src/components/Header";
import { Screen } from "@/src/components/Screen";
import { useSearchState } from "@/src/context/SearchContext";
import { apiRequest } from "@/src/services/api";
import { User } from "@/src/types";
import { colors, shadow } from "@/src/utils/theme";

export default function SearchScreen() {
  const { query, setQuery, users, setUsers } = useSearchState();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }
      apiRequest<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`).then((res) => setUsers(res.users)).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, setUsers]);

  return (
    <Screen>
      <Header title="Search" />
      <View style={styles.searchBox}>
        <Ionicons name="search" color={colors.dim} size={18} />
        <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search usernames" placeholderTextColor={colors.dim} autoCapitalize="none" />
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={query.trim() ? <Text style={styles.empty}>No matching profiles found.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable style={styles.user} onPress={() => router.push(`/profile/${item.username}`)}>
              <Avatar user={item} />
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.messageButton} onPress={() => router.push(`/messages/${item.username}`)}>
              <Ionicons name="chatbubble-outline" color={colors.bg} size={18} />
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: { margin: 16, height: 48, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, color: colors.text },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  user: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  username: { color: colors.text, fontWeight: "800" },
  bio: { color: colors.dim, marginTop: 2 },
  messageButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.cyan, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.dim, textAlign: "center", marginTop: 32 }
});
