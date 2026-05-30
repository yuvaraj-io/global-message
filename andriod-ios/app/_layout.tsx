import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "@/src/context/AuthContext";
import { NotificationProvider } from "@/src/context/NotificationContext";
import { SearchProvider } from "@/src/context/SearchContext";
import { SocketProvider } from "@/src/context/SocketContext";
import { UIProvider } from "@/src/context/UIContext";
import { colors } from "@/src/utils/theme";

export const unstable_settings = {
  anchor: "(tabs)"
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <UIProvider>
        <SearchProvider>
          <SocketProvider>
            <NotificationProvider>
              <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.cyan, background: colors.bg, card: colors.panel, text: colors.text, border: colors.border, notification: colors.rose } }}>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
                  <Stack.Screen name="login" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="forgot-password" />
                  <Stack.Screen name="reset-password" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <StatusBar style="dark" />
              </ThemeProvider>
            </NotificationProvider>
          </SocketProvider>
        </SearchProvider>
      </UIProvider>
    </AuthProvider>
  );
}
