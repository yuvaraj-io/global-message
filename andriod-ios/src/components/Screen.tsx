import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../utils/theme";

export const Screen = ({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) => {
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, { paddingTop: insets.top }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg }
});
