import { Redirect } from "expo-router";

export default function Index() {
  // Static redirect - no hooks to avoid triggering route re-evaluation
  return <Redirect href="/(auth)/login" />;
}
