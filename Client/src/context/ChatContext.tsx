import React, { createContext, useContext, useState } from "react";

interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ChatContextData {
  chatId: number | null;
  title: string;
  isGroupChat: boolean;
  participants: ChatParticipant[];
  setChatTitle: (chatId: number, title: string, isGroupChat: boolean, participants: ChatParticipant[]) => void;
  clearChatTitle: () => void;
}

const ChatContext = createContext<ChatContextData | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatId, setChatId] = useState<number | null>(null);
  const [title, setTitle] = useState("Chat");
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);

  const setChatTitle = (
    id: number,
    newTitle: string,
    groupChat: boolean,
    chatParticipants: ChatParticipant[]
  ) => {
    setChatId(id);
    setTitle(newTitle);
    setIsGroupChat(groupChat);
    setParticipants(chatParticipants);
  };

  const clearChatTitle = () => {
    setChatId(null);
    setTitle("Chat");
    setIsGroupChat(false);
    setParticipants([]);
  };

  return (
    <ChatContext.Provider
      value={{
        chatId,
        title,
        isGroupChat,
        participants,
        setChatTitle,
        clearChatTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
};
