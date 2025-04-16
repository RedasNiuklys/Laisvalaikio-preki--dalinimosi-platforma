import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LocationListScreen from "../../src/pages/LocationListScreen";
import LocationFormScreen from "../../src/pages/LocationFormScreen";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

const Stack = createNativeStackNavigator();

export default function LocationsScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Navigator>
        <Stack.Screen
          name="Location List"
          component={LocationListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Add Location"
          component={LocationFormScreen}
          options={{ title: "Add Location" }}
        />
        <Stack.Screen
          name="Edit Location"
          component={LocationFormScreen}
          options={{ title: "Edit Location" }}
        />
      </Stack.Navigator>
    </View>
  );
}
