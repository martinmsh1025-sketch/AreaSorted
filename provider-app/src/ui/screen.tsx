import type { ReactNode } from "react";
import { View } from "react-native";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 12 }}>
      {children}
    </View>
  );
}
