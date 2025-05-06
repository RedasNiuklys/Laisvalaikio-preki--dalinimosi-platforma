import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { UserSelector } from "@/src/components/UserSelector";
import { Button, Text, useTheme } from "react-native-paper";
import axios from "axios";
import { BASE_URL } from "@/src/utils/envConfig";
import { getAuthToken } from "@/src/utils/authUtils";
import { useAuth } from "@/src/context/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function NewChatModal() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleCreateChat = async () => {
    if (!selectedUser || !user) return;

    try {
      setLoading(true);
      const token = await getAuthToken();
      console.log("Trying to create chat");
      const response = await axios.post(
        `${BASE_URL}/chat/create`,
        {
          name: "",
          isGroupChat: false,
          participantIds: [selectedUser.id, user.id],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Navigate to the new chat
      router.push(`/chat/${response.data.chatId}`);
      console.log("Chat created successfully");
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onBackground }}
        >
          New Chat
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Select a user to start chatting with
        </Text>
      </View>

      <UserSelector
        onUserSelect={handleUserSelect}
        selectedUsers={selectedUser ? [selectedUser] : []}
        isMultiSelect={false}
        excludeUsers={user?.id ? [user.id] : []}
      />

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => router.push("/chat/list")}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleCreateChat}
          loading={loading}
          disabled={loading || !selectedUser}
          style={styles.button}
        >
          Start Chat
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    gap: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  button: {
    minWidth: 100,
  },
});
