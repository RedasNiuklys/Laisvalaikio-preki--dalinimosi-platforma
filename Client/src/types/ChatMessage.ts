export interface ChatMessage {
    id: number;
    content: string;
    senderId: string;
    chatId: number;
    sentAt: string;
    isMine?: boolean;
    sender: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    readBy: {
        id: string;
        name: string;
        readAt: string;
    }[];
}

export interface IMessage {
    _id: string;
    text: string;
    createdAt: Date;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    };
} 