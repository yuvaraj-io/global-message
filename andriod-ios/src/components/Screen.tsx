import { PropsWithChildren } from "react";
import { Platform, StatusBar, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../utils/theme";

export const Screen = ({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) => (
  <View style={[styles.screen, style]}>{children}</View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }
});
