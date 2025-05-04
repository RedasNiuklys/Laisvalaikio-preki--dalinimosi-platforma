import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Avatar,
  IconButton,
  TextInput,
  useTheme,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { chatService } from "@/src/services/ChatService";
import { format } from "date-fns";
import { ChatMessage } from "@/src/types/ChatMessage";
import { BASE_URL } from "@/src/utils/envConfig";
import { useAuth } from "@/src/context/AuthContext";
import axios from "axios";
import { getAuthToken } from "@/src/utils/authUtils";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      const userData = await loadUser();
      if (userData) {
        setUser(userData);
        await loadMessages(userData);
        await chatService.joinChat(id);
        setupMessageListener(userData);
      }
    };

    if (isAuthenticated) {
      loadInitialData();
    }

    return () => {
      if (isAuthenticated) {
        chatService.leaveChat(id);
      }
    };
  }, [isAuthenticated]);

  const loadUser = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  };

  const loadMessages = async (currentUser: User) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/chat/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          take: 25,
        },
      });
      console.log("Messages:", response.data);
      setMessages(
        [...response.data].reverse().map((msg: ChatMessage) => ({
          ...msg,
          isMine: msg.sender.id === currentUser.id,
        }))
      );
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupMessageListener = (currentUser: User) => {
    chatService.onMessage((message) => {
      if (message.chatId.toString() === id) {
        setMessages((prev) => [
          ...prev,
          { ...message, isMine: message.sender.id === currentUser.id },
        ]);
        scrollToBottom();
      }
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      console.log("Sending message:", newMessage.trim());
      await chatService.sendMessage(Number(id), newMessage.trim());
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isMine ? styles.myMessage : styles.otherMessage,
        {
          backgroundColor: item.isMine
            ? theme.colors.primaryContainer
            : theme.colors.surfaceVariant,
        },
      ]}
    >
      {!item.isMine && (
        <Avatar.Image
          size={32}
          source={{ uri: item.sender.avatarUrl }}
          style={styles.avatar}
        />
      )}
      <View style={styles.messageContent}>
        {!item.isMine && (
          <Text variant="labelSmall" style={styles.senderName}>
            {item.sender.name}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            {
              color: item.isMine
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {item.content}
        </Text>
        <Text variant="labelSmall" style={styles.timestamp}>
          {format(new Date(item.sentAt), "MMM d, yyyy HH:mm")}
        </Text>
      </View>
    </View>
  );

  if (loading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <TextInput
          mode="flat"
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.input}
          disabled={sending}
          right={
            <TextInput.Icon
              icon={sending ? () => <ActivityIndicator size={20} /> : "send"}
              disabled={!newMessage.trim() || sending}
              onPress={handleSend}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    maxWidth: "80%",
    borderRadius: 16,
    padding: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  avatar: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    alignSelf: "flex-end",
    marginTop: 4,
    opacity: 0.6,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  input: {
    backgroundColor: "transparent",
  },
});
