import { PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../utils/theme";

export const Screen = ({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) => (
  <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg }
});
