import { View, Pressable, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { buttonStyles } from "../styles/Button.styles";

type Props = {
  label: string;
  theme?: "primary";
  onPress?: () => void;
};

export default function Button({ label, theme, onPress }: Props) {
  if (theme === "primary") {
    return (
      <View
        style={[
          buttonStyles.buttonContainer,
          {
            borderWidth: 4,
            backgroundColor: "#fff",
            borderColor: "#ffd33d",
            borderRadius: 18,
          },
        ]}
      >
        <Pressable style={buttonStyles.button} onPress={onPress}>
          <FontAwesome
            name="picture-o"
            size={18}
            color="#000000"
            style={buttonStyles.buttonIcon}
          />
          <Text style={[buttonStyles.buttonLabel, { color: "#210a0a" }]}>
            {label}
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={buttonStyles.buttonContainer}>
      <Pressable
        style={buttonStyles.button}
        onPress={() => alert("You pressed a button.")}
      >
        <FontAwesome
          name="picture-o"
          size={18}
          color="#ffffff"
          style={buttonStyles.buttonIcon}
        />
        <Text style={buttonStyles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}
