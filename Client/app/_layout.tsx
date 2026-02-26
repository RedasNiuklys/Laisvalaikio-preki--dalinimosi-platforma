import { Platform } from "react-native";
import NativeLayout from "./_layout.native";
import WebLayout from "./_layout.web";

export default Platform.OS === "web" ? WebLayout : NativeLayout;
