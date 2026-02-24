import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  List,
  Avatar,
  useTheme,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { BASE_URL } from "@/src/utils/envConfig";
import { format } from "date-fns";
import { getAuthToken } from "@/src/utils/authUtils";

interface ChatMessage {
  id: string;
  content: string;
  sentAt: string;
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
  isGroupChat: boolean;
}

export default function ChatListScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    fetchChats();
  });

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError(t("chat.errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.isGroupChat) return chat.name;
    const otherParticipant = chat.participants.find(
      (p) => p.id !== "currentUserId"
    ); // Replace with actual user ID
    return otherParticipant?.name || t("chat.unknownUser");
  };

  const getAvatarLabel = (chat: Chat) => {
    const name = getChatTitle(chat);
    return name.substring(0, 2).toUpperCase();
  };

  const renderChatItem = ({ item: chat }: { item: Chat }) => (
    <List.Item
      title={getChatTitle(chat)}
      description={chat.lastMessage?.content || t("chat.noMessages")}
      left={(props) => (
        <Avatar.Image
          {...props}
          size={40}
          source={{ uri: chat.participants[0].avatarUrl }}
          style={{ backgroundColor: theme.colors.primary }}
        />
      )}
      right={(props) =>
        chat.lastMessage && (
          <Text {...props} style={[props.style, styles.timestamp]}>
            {format(new Date(chat.lastMessage.sentAt), "HH:mm")}
          </Text>
        )
      }
      onPress={() => router.push(`/(modals)/chat/${chat.id}`)}
      style={[styles.chatItem, { backgroundColor: theme.colors.background }]}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant="titleLarge"
        style={[styles.title, { color: theme.colors.onBackground }]}
      >
        {t("navigation.messages")}
      </Text>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t("chat.noChats")}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    padding: 16,
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    paddingVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});
