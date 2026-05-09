import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../utils/theme";

export const LoadingState = ({ label = "Loading" }: { label?: string }) => (
  <View style={styles.wrap}>
    <ActivityIndicator color={colors.cyan} />
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { padding: 28, alignItems: "center", gap: 10 },
  text: { color: colors.muted }
});
