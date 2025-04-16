import { Modal, View, StyleSheet } from "react-native";
import OAuthWebView from "./OAuthWebView";
import { LOGIN_ENDPOINT } from "../utils/envConfig";
import { ClientOnly } from "./ClientOnly";

interface OAuthMobileHandlerProps {
  provider: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

const OAuthMobileHandler: React.FC<OAuthMobileHandlerProps> = ({
  provider,
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const handleNavigationStateChange = (state: any) => {
    if (state.url.includes("token=")) {
      const token = state.url.split("token=")[1].split("&")[0];
      onSuccess(token);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.modalContainer}>
        <ClientOnly>
          <OAuthWebView
            url={`${LOGIN_ENDPOINT}/${provider.toLowerCase()}-login`}
            onNavigationStateChange={handleNavigationStateChange}
          />
        </ClientOnly>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default OAuthMobileHandler;
