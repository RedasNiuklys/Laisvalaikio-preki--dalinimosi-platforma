import React, { useEffect, useState } from "react";
import { View } from "react-native";

interface ClientOnlyProps {
  children: React.ReactNode;
}

export const ClientOnly: React.FC<ClientOnlyProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <View />;
  }

  return <>{children}</>;
};
