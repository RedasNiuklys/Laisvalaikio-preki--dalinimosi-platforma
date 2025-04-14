import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { useTheme} from '../../src/context/ThemeContext';
import { themes } from '../../src/theme/GlobalTheme';
import CreateOrUpdateProfileScreen from "@/src/pages/UserFormScreen";

export default function HomeScreen() {
  const router = useRouter();

  return (
  <View>
    <Text>"Programming is FuN </Text>
  </View>
  )
}
