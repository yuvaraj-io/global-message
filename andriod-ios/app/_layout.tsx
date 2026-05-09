import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "@/src/context/AuthContext";
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
            <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.cyan, background: colors.bg, card: colors.panel, text: colors.text, border: colors.border, notification: colors.rose } }}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="profile/[username]" />
                <Stack.Screen name="messages/[username]" />
              </Stack>
              <StatusBar style="light" />
            </ThemeProvider>
          </SocketProvider>
        </SearchProvider>
      </UIProvider>
    </AuthProvider>
  );
}
