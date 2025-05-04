export interface ChatRoom {
    id: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: string;
    lastMessageDate?: string;
    participants: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    }[];
    equipment: {
        id: string;
        name: string;
        description?: string;
        imageUrl?: string;
    };
} 