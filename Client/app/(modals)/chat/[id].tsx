import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import {
  Avatar,
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
import { useChatContext } from "@/src/context/ChatContext";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const { title, chatId: cachedChatId } = useChatContext();
  const flatListRef = useRef<FlatList>(null);

  const MESSAGES_PER_PAGE = 50;

  useEffect(() => {
    // Set the header title from context cache
    if (cachedChatId === id && title) {
      navigation.setOptions({ 
        // headerShown: true,
        title: title 
      });
    }
  }, [id, cachedChatId, title, navigation]);

  useEffect(() => {
    // Scroll to bottom when messages load and shouldScrollToBottom is true
    if (shouldScrollToBottom && messages.length > 0 && !loadingMore && !loading) {
      // Multiple attempts to ensure scroll reaches bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 150);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    }
  }, [messages.length, shouldScrollToBottom, loadingMore, loading]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const userData = await loadUser();
        if (!userData) {
          setError("Failed to load user data");
          return;
        }

        setUser(userData);

        // Check if user is a participant
        const token = await getAuthToken();
        const participantsResponse = await axios.get(
          `${BASE_URL}/chat/${id}/participants`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const isParticipant = participantsResponse.data.some(
          (p: any) => p.userId === userData.id
        );

        if (!isParticipant) {
          setError("You are not a participant in this chat");
          router.back();
          return;
        }

        // Load messages
        await loadMessages(userData);

        // Join the chat and setup message listener
        await chatService.joinChat(id);
        setupMessageListener(userData);
      } catch (error) {
        console.error("Error loading chat data:", error);
        setError("Failed to load chat");
      } finally {
        setLoading(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id]);

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

  const loadMessages = async (currentUser: User, skipCount: number = 0) => {
    try {
      if (skipCount === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/chat/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          take: MESSAGES_PER_PAGE,
          skip: skipCount,
        },
      });
      console.log("Loaded messages:", response.data, "for chat ID:", id, "with skip:", skipCount);
      if (response.data && Array.isArray(response.data)) {
        const formattedMessages = response.data
          .reverse()
          .map((msg: ChatMessage) => ({
            ...msg,
            isMine: msg.sender.id === currentUser.id,
          }));

        if (skipCount === 0) {
          // Initial load - set messages and scroll to bottom
          setMessages(formattedMessages);
          setShouldScrollToBottom(true);
          setHasMore(formattedMessages.length === MESSAGES_PER_PAGE);
        } else {
          // Loading more - prepend to existing messages
          setMessages((prev) => [...formattedMessages, ...prev]);
          setHasMore(formattedMessages.length === MESSAGES_PER_PAGE);
          setShouldScrollToBottom(false);
        }
      } else {
        console.error("Invalid message data received:", response.data);
        setError("Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Failed to load messages");
    } finally {
      if (skipCount === 0) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const setupMessageListener = (currentUser: User) => {
    chatService.onMessage((message) => {
      if (message.chatId.toString() === id) {
        setMessages((prev) => {
          const newMessage = {
            ...message,
            isMine: message.sender.id === currentUser.id,
          };
          if (prev.some((msg) => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        // Auto-scroll to bottom when new message arrives with multiple attempts
        if (shouldScrollToBottom) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 50);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 200);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 400);
        }
      }
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      setShouldScrollToBottom(true);
      await chatService.sendMessage(Number(id), newMessage.trim());
      setNewMessage("");
      // Force scroll to bottom after sending with multiple attempts
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 500);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const loadMoreMessages = async (currentUser: User) => {
    if (loadingMore || !hasMore) return;
    
    const newSkip = skip + MESSAGES_PER_PAGE;
    await loadMessages(currentUser, newSkip);
    setSkip(newSkip);
  };

  const onScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Check if user scrolled near the top
    if (contentOffset.y < 500 && hasMore && !loadingMore) {
      if (user) {
        loadMoreMessages(user);
      }
    }
    
    // Check if user is near the bottom
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    setShouldScrollToBottom(isAtBottom);
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

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          onContentSizeChange={() => {
            if (shouldScrollToBottom) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          onLayout={() => {
            if (shouldScrollToBottom && messages.length > 0) {
              // Multiple scroll attempts with increasing delays for reliability
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 10);
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 250);
            }
          }}
        />
      </View>
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
    flexDirection: "column",
  },
  chatContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 16,
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
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  input: {
    backgroundColor: "transparent",
  },
});
