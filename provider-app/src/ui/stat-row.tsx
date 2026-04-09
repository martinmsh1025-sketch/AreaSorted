import { Text, View } from "react-native";
import { AppTheme } from "@/ui/theme";

export function StatRow({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            backgroundColor: AppTheme.colors.card,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: AppTheme.colors.line,
            gap: 6,
          }}
        >
          <Text style={{ color: AppTheme.colors.ink, fontSize: 22, fontWeight: "800" }}>{stat.value}</Text>
          <Text style={AppTheme.text.caption}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
