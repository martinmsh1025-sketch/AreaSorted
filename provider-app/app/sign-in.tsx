import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/state/auth";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Screen } from "@/ui/screen";

export default function SignInScreen() {
  const { isInitializing, isSignedIn, isDemoMode, signIn, authError } = useAuth();
  const [email, setEmail] = useState("provider@example.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (submitting) return;
    try {
      setSubmitting(true);
      await signIn(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  if (isInitializing) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <ActivityIndicator color={AppTheme.colors.ink} />
          <Text style={AppTheme.text.bodyMuted}>Checking your provider session...</Text>
        </View>
      </Screen>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/orders" />;
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        <Card tone="hero">
          <Text style={AppTheme.text.eyebrow}>AreaSorted Provider</Text>
          <Text style={AppTheme.text.heroTitle}>Sign in to your provider workspace.</Text>
          <Text style={AppTheme.text.heroBody}>
            {isDemoMode
              ? "Demo mode is enabled, so you can explore the app without any backend or database connection."
              : "This mobile app uses its own token-based provider session and does not interfere with your existing web login flow."}
          </Text>
        </Card>

        <Card>
          <Text style={AppTheme.text.sectionTitle}>Provider login</Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={AppTheme.colors.muted}
              style={{
                borderWidth: 1,
                borderColor: AppTheme.colors.line,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                color: AppTheme.colors.ink,
                backgroundColor: "#fff",
              }}
            />
            <TextInput
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={AppTheme.colors.muted}
              style={{
                borderWidth: 1,
                borderColor: AppTheme.colors.line,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                color: AppTheme.colors.ink,
                backgroundColor: "#fff",
              }}
            />
            {authError ? <Text style={{ color: "#b42318", fontSize: 13 }}>{authError}</Text> : null}
            {isDemoMode ? <Text style={AppTheme.text.caption}>Demo mode uses built-in sample provider data.</Text> : null}
          </View>
        </Card>

        <Pressable
          onPress={handleSignIn}
          style={{
            backgroundColor: AppTheme.colors.ink,
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>{submitting ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
