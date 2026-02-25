import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  TextInput,
  Button,
  Switch,
  useTheme as usePaperTheme,
  Text,
} from "react-native-paper";
import { UserSelector } from "./UserSelector";
import axios from "axios";
import { BASE_URL } from "../utils/envConfig";
import { getAuthToken } from "../utils/authUtils";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  avatar?: string;
}

interface NewChatModalProps {
  visible: boolean;
  onDismiss: () => void;
  onChatCreated: (chatId: number) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  visible,
  onDismiss,
  onChatCreated,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = usePaperTheme();
  const { t } = useTranslation();

  const handleUserSelect = (user: User) => {
    if (!isGroupChat) {
      setSelectedUsers([user]);
    } else {
      if (selectedUsers.some((selected) => selected.id === user.id)) {
        setSelectedUsers(
          selectedUsers.filter((selected) => selected.id !== user.id)
        );
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/chat/create`,
        {
          name: isGroupChat ? groupName : "",
          isGroupChat,
          participantIds: selectedUsers.map((user) => user.id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Backend returns the chat ID directly, not wrapped in an object
      const chatId = response.data;
      console.log("Chat created with ID:", chatId);
      onChatCreated(chatId);
      handleDismiss();
    } catch (error) {
      console.error("Error creating chat:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Failed to create chat"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setSelectedUsers([]);
    setIsGroupChat(false);
    setGroupName("");
    setError(null);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.header}>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground }}
          >
            {t("chat.newChat")}
          </Text>
          <View style={styles.groupSwitch}>
            <Text style={{ color: theme.colors.onBackground }}>
              {t("chat.groupChat")}
            </Text>
            <Switch value={isGroupChat} onValueChange={setIsGroupChat} />
          </View>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={{ color: theme.colors.error }}>
              {error}
            </Text>
          </View>
        )}

        {isGroupChat && (
          <TextInput
            label={t("chat.groupName")}
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
          />
        )}

        <UserSelector
          onUserSelect={handleUserSelect}
          selectedUsers={selectedUsers}
          isMultiSelect={isGroupChat}
        />

        <View style={styles.footer}>
          <Button mode="outlined" onPress={handleDismiss} style={styles.button}>
            {t("common.buttons.cancel")}
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateChat}
            loading={loading}
            disabled={
              loading ||
              selectedUsers.length === 0 ||
              (isGroupChat && !groupName)
            }
            style={styles.button}
          >
            {t("chat.create")}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  groupSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    marginBottom: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 20,
  },
  button: {
    minWidth: 100,
  },
});
