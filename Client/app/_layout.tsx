import { Platform } from "react-native";
import NativeLayout from "./_layout.native";
import WebLayout from "./_layout.web";

console.log('🚀 _layout.tsx: Entry point loading, Platform:', Platform.OS);

export default Platform.OS === "web" ? WebLayout : NativeLayout;
