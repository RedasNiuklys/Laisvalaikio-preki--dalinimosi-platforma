import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  TextInput,
  Button,
  Switch,
  Text,
} from "react-native-paper";
import { UserSelector } from "./UserSelector";
import axios from "axios";
import { BASE_URL } from "../utils/envConfig";

interface User {
  id: string;
  name: string;
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
      const response = await axios.post(`${BASE_URL}/chat/create`, {
        name: isGroupChat ? groupName : "",
        isGroupChat,
        participantIds: selectedUsers.map((user) => user.id),
      });

      onChatCreated(response.data.chatId);
      handleDismiss();
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setSelectedUsers([]);
    setIsGroupChat(false);
    setGroupName("");
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall">New Chat</Text>
          <View style={styles.groupSwitch}>
            <Text>Group Chat</Text>
            <Switch value={isGroupChat} onValueChange={setIsGroupChat} />
          </View>
        </View>

        {isGroupChat && (
          <TextInput
            label="Group Name"
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
            Cancel
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
            Create Chat
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
