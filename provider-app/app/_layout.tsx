import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/state/auth";
import { NotificationCoordinator } from "@/state/notification-coordinator";
import { AppTheme } from "@/ui/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NotificationCoordinator />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: AppTheme.colors.shell },
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
