import { useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  Text,
  Avatar,
  List,
  FAB,
  useTheme,
  TouchableRipple,
  Divider,
} from "react-native-paper";
import { router } from "expo-router";
import { BASE_URL } from "@/src/utils/envConfig";
import { getAuthToken } from "@/src/utils/authUtils";
import { useChatContext } from "@/src/context/ChatContext";
import { format } from "date-fns";
import { User } from "@/src/types/User";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatService } from "@/src/services/ChatService";

interface ChatMessage {
  id: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Chat {
  id: number;
  name: string;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isGroupChat: boolean;
}

export default function ChatScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const theme = useTheme();
  const { setChatTitle } = useChatContext();
  // const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadUser();
    loadChats();
    
    // Set up SignalR listeners for real-time chat updates
    const unsubscribeChatUpdated = chatService.onChatUpdated((chatId) => {
      console.log("Chat updated via SignalR:", chatId);
      // Reload the chat list when a chat is updated
      loadChats();
    });

    const unsubscribeUnreadCount = chatService.onUnreadCountChanged((data) => {
      console.log("Unread count changed via SignalR:", data);
      // Update the unread count for a specific chat
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === data.chatId ? { ...chat, unreadCount: data.unreadCount } : chat
        )
      );
      // Update the total unread count
      updateTabBadge();
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeChatUpdated();
      unsubscribeUnreadCount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      console.log("Loaded user profile:", response.data);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched chats from backend:", response.data);
      console.log("Chat IDs:", response.data.map((c: Chat) => c.id));
      
      // Backend already filters to only return chats user is a participant in
      setChats(response.data);
      console.log("State updated with chats");
      updateTabBadge(response.data);
    } catch (error) {
      console.error("Error loading chats:", error);
      setChats([]); // Clear chats on error
    } finally {
      setLoading(false);
    }
  };

  const updateTabBadge = (chatsToUpdate?: Chat[]) => {
    const chatsForBadge = chatsToUpdate || chats;
    const totalUnread = chatsForBadge.reduce(
      (sum: number, chat: Chat) => sum + (chat.unreadCount || 0),
      0
    );
    if (typeof window !== "undefined") {
      // Store the unread count in localStorage for the tab badge
      AsyncStorage.setItem("unreadMessageCount", totalUnread.toString());
    }
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.isGroupChat) return chat.name;
    const otherParticipant = chat.participants.find((p) => p.id !== user?.id);
    if (otherParticipant) {
      return `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
    }
    return "Unknown User";
  };

  const handleChatPress = (chat: Chat) => {
    const title = getChatTitle(chat);
    const participants = chat.participants.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      avatarUrl: p.avatarUrl,
    }));
    
    setChatTitle(chat.id, title, chat.isGroupChat, participants);
    router.push(`/(modals)/chat/${chat.id}`);
  };

  const deleteEmptyChat = async (chatId: number) => {
    try {
      const token = await getAuthToken();
      await axios.delete(`${BASE_URL}/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const getFilteredChats = () => {
    // Filter out duplicate 1:1 chats, keeping only one per participant
    // Prefer the chat with messages over empty ones
    console.log("getFilteredChats - Input chats:", chats.map(c => ({ id: c.id, isGroup: c.isGroupChat, participants: c.participants.length })));
    
    const participantChatMap = new Map<string, Chat>();

    for (const chat of chats) {
      if (chat.isGroupChat) {
        // Always include group chats
        participantChatMap.set(`group_${chat.id}`, chat);
      } else {
        // For 1:1 chats, keep only one per participant
        const otherParticipant = chat.participants.find((p) => p.id !== user?.id);
        if (otherParticipant) {
          const participantId = otherParticipant.id;
          const existingChat = participantChatMap.get(participantId);

          // Replace if this chat has messages and the existing one doesn't
          if (!existingChat || (chat.lastMessage && !existingChat.lastMessage)) {
            participantChatMap.set(participantId, chat);
          }
        }
      }
    }

    const filtered = Array.from(participantChatMap.values());
    console.log("getFilteredChats - Output chat IDs:", filtered.map(c => c.id));
    return filtered;
  };

  const renderChatItem = ({ item: chat }: { item: Chat }) => (
    <TouchableRipple
      onPress={() => handleChatPress(chat)}
      rippleColor={theme.colors.primaryContainer}
    >
      <List.Item
        title={getChatTitle(chat)}
        description={chat.lastMessage ? `${chat.lastMessage.sender.firstName} ${chat.lastMessage.sender.lastName}: ${chat.lastMessage.content}` : "No messages yet"}
        titleStyle={chat.unreadCount > 0 ? styles.unreadTitle : undefined}
        descriptionStyle={chat.unreadCount > 0 ? styles.unreadDescription : undefined}
        left={(props) => (
          <Avatar.Image
            {...props}
            size={40}
            source={{
              uri:
                chat.participants.find((p) => p.id !== user?.id)?.avatarUrl ||
                "",
            }}
          />
        )}
        right={(props) => {
          if (!chat.lastMessage) {
            // Show delete button for empty chats
            return (
              <View style={styles.rightContent}>
                <Text
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e?.stopPropagation();
                    deleteEmptyChat(chat.id);
                  }}
                >
                  ✕
                </Text>
              </View>
            );
          }
          return (
            <View style={styles.rightContent}>
              {chat.unreadCount > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: theme.colors.onPrimary }]}
                  >
                    {chat.unreadCount}
                  </Text>
                </View>
              )}
              <Text {...props} style={styles.timestamp}>
                {format(new Date(chat.lastMessage.sentAt), "HH:mm")}
              </Text>
            </View>
          );
        }}
      />
    </TouchableRipple>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={getFilteredChats()}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={styles.listContent}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/(modals)/chat/new")}
        color={theme.colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  rightContent: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff4444",
    paddingHorizontal: 12,
  },
  unreadTitle: {
    fontWeight: "bold",
  },
  unreadDescription: {
    fontWeight: "600",
  },
});
