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
import { useAuth } from "@/src/context/AuthContext";
import { format } from "date-fns";
import { User } from "@/src/types/User";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ChatMessage {
  id: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
  };
}

interface Chat {
  id: string;
  name: string;
  participants: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isGroupChat: boolean;
}

export default function ChatScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadChats();
    loadUser();
    // Set up polling for unread messages
    const interval = setInterval(loadChats, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
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
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadChats = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(response.data);

      // Update the tab badge with total unread count
      const totalUnread = response.data.reduce(
        (sum: number, chat: Chat) => sum + (chat.unreadCount || 0),
        0
      );
      if (typeof window !== "undefined") {
        // Store the unread count in localStorage for the tab badge
        AsyncStorage.setItem("unreadMessageCount", totalUnread.toString());
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.isGroupChat) return chat.name;
    const otherParticipant = chat.participants.find((p) => p.id !== user?.id);
    return otherParticipant?.name || "Unknown User";
  };

  const renderChatItem = ({ item: chat }: { item: Chat }) => (
    <TouchableRipple
      onPress={() => router.push(`/(modals)/chat/${chat.id}`)}
      rippleColor={theme.colors.primaryContainer}
    >
      <List.Item
        title={getChatTitle(chat)}
        description={chat.lastMessage?.content || "No messages yet"}
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
        right={(props) => (
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
            {chat.lastMessage && (
              <Text {...props} style={styles.timestamp}>
                {format(new Date(chat.lastMessage.sentAt), "HH:mm")}
              </Text>
            )}
          </View>
        )}
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
        data={chats}
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
});
