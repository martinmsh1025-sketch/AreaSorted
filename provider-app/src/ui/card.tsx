import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { AppTheme } from "@/ui/theme";

export function Card({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "hero" }) {
  return (
    <View
      style={{
        backgroundColor: tone === "hero" ? AppTheme.colors.hero : AppTheme.colors.card,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: AppTheme.colors.line,
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}

export function CardEmpty({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <Text style={AppTheme.text.cardTitle}>{title}</Text>
      <Text style={AppTheme.text.bodyMuted}>{body}</Text>
    </Card>
  );
}
