import { Redirect } from "expo-router";
import { useAuth } from "@/state/auth";

export default function IndexScreen() {
  const { isInitializing, isSignedIn } = useAuth();
  if (isInitializing) return null;
  return <Redirect href={isSignedIn ? "/(tabs)/orders" : "/sign-in"} />;
}
