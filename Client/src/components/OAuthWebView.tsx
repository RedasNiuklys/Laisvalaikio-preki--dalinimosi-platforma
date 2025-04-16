import { WebView } from "react-native-webview";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useTheme as useAppTheme } from "../context/ThemeContext";
import { useTheme as usePaperTheme } from "react-native-paper";

interface OAuthWebViewProps {
  url: string;
  onNavigationStateChange: (state: any) => void;
}

const OAuthWebView: React.FC<OAuthWebViewProps> = ({
  url,
  onNavigationStateChange,
}) => {
  const { theme: appTheme } = useAppTheme();
  const theme = usePaperTheme();

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={onNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        style={[styles.webview, { pointerEvents: "auto" }]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        incognito={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});

export default OAuthWebView;
