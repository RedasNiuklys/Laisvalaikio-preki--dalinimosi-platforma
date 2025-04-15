import { Linking } from "react-native";
import { LOGIN_ENDPOINT } from "../utils/envConfig";

interface OAuthWebHandlerProps {
  provider: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

const OAuthWebHandler: React.FC<OAuthWebHandlerProps> = ({
  provider,
  onSuccess,
  onError,
}) => {
  const handleOAuthLogin = async () => {
    try {
      const url = `${LOGIN_ENDPOINT}/${provider.toLowerCase()}-login`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("OAuth login error:", error);
      onError(`Failed to start ${provider} login`);
    }
  };

  return null; // This component doesn't render anything
};

export default OAuthWebHandler;
