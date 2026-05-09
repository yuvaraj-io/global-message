import { StyleSheet, Text, View } from "react-native";
import { colors } from "../utils/theme";

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: colors.dim, marginTop: 2 }
});
