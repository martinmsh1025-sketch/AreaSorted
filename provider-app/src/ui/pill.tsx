import { Text, View } from "react-native";
import { AppTheme } from "@/ui/theme";

export function Pill({ label, subtle = false }: { label: string; subtle?: boolean }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: subtle ? AppTheme.colors.accentSoft : AppTheme.colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          color: subtle ? AppTheme.colors.ink : "#fff",
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
