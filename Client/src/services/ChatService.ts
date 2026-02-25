import { HubConnection, HubConnectionBuilder, LogLevel, RetryContext } from '@microsoft/signalr';
import { getAuthToken } from '../utils/authUtils';
import { BASE_URL, CHAT_ENDPOINT, CHAT_HUB_ENDPOINT } from '../utils/envConfig';

export interface Message {
    id: string;
    content: string;
    senderId: string;
    chatId: number;
    sentAt: string;
    sender: {
        id: string;
        name: string;
        avatar?: string;
    };
    readBy: {
        id: string;
        name: string;
        readAt: string;
    }[];
}

export interface ChatParticipant {
    id: string;
    name: string;
    avatar?: string;
    isAdmin: boolean;
    joinedAt: string;
}

export interface Chat {
    id: number;
    name?: string;
    isGroupChat: boolean;
    createdAt: string;
    lastMessage?: Message;
    participants: ChatParticipant[];
}

// export interface ChatMessage {
//     id: string;
//     content: string;
//     senderId: string;
//     senderName: string;
//     chatId: number;
//     createdAt: string;
// }

class ChatService {
    private hubConnection: HubConnection | null = null;
    private messageCallbacks: ((message: Message) => void)[] = [];
    private readReceiptCallbacks: ((data: { messageId: string; userId: string; readAt: string }) => void)[] = [];
    private chatUpdatedCallbacks: ((chatId: number) => void)[] = [];
    private unreadCountCallbacks: ((data: { chatId: number; unreadCount: number }) => void)[] = [];
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private initialized = false;

    async ensureInitialized() {
        if (this.initialized) return;
        this.initialized = true;
        await this.initializeConnection();
    }

    private async initializeConnection() {
        try {
            const token = await getAuthToken();
            if (!token) {
                console.error('No authentication token available');
                return;
            }

            this.hubConnection = new HubConnectionBuilder()
                .withUrl(`${BASE_URL.replace('/api', '')}/chatHub`, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext: RetryContext) => {
                        if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
                            return null; // Stop trying to reconnect
                        }
                        // Implement exponential backoff
                        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                    }
                })
                .configureLogging(LogLevel.Information)
                .build();

            // Set up message handling
            this.hubConnection.on('ReceiveMessage', (message: Message) => {
                this.messageCallbacks.forEach(callback => callback(message));
            });

            // Set up read receipt handling
            this.hubConnection.on('MessageRead', (data: { messageId: string; userId: string; readAt: string }) => {
                this.readReceiptCallbacks.forEach(callback => callback(data));
            });

            // Set up chat updated handling
            this.hubConnection.on('ChatUpdated', (chatId: number) => {
                this.chatUpdatedCallbacks.forEach(callback => callback(chatId));
            });

            // Set up unread count changed handling
            this.hubConnection.on('UnreadCountChanged', (data: { chatId: number; unreadCount: number }) => {
                this.unreadCountCallbacks.forEach(callback => callback(data));
            });

            // Handle reconnection
            this.hubConnection.onreconnecting(() => {
                console.log('Attempting to reconnect to chat hub...');
            });

            this.hubConnection.onreconnected(() => {
                console.log('Reconnected to chat hub');
                this.reconnectAttempts = 0;
            });

            // Start the connection
            await this.startConnection();
        } catch (error) {
            console.error('Error initializing chat hub connection:', error);
        }
    }

    private async startConnection() {
        try {
            if (this.hubConnection && this.hubConnection.state === 'Disconnected') {
                await this.hubConnection.start();
                console.log('Connected to chat hub');
                this.reconnectAttempts = 0;
            }
        } catch (error) {
            console.error('Error starting connection:', error);
            throw error;
        }
    }

    public onMessage(callback: (message: Message) => void) {
        this.messageCallbacks.push(callback);
        return () => {
            this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
        };
    }

    public onReadReceipt(callback: (data: { messageId: string; userId: string; readAt: string }) => void) {
        this.readReceiptCallbacks.push(callback);
        return () => {
            this.readReceiptCallbacks = this.readReceiptCallbacks.filter(cb => cb !== callback);
        };
    }

    public onChatUpdated(callback: (chatId: number) => void) {
        this.chatUpdatedCallbacks.push(callback);
        return () => {
            this.chatUpdatedCallbacks = this.chatUpdatedCallbacks.filter(cb => cb !== callback);
        };
    }

    public onUnreadCountChanged(callback: (data: { chatId: number; unreadCount: number }) => void) {
        this.unreadCountCallbacks.push(callback);
        return () => {
            this.unreadCountCallbacks = this.unreadCountCallbacks.filter(cb => cb !== callback);
        };
    }

    public async sendMessage(chatId: number | string, content: string) {
        try {
            await this.ensureInitialized();
            
            if (!this.hubConnection || this.hubConnection.state === 'Disconnected') {
                await this.startConnection();
                await this.joinChat(chatId); // Ensure we're in the chat room
            }

            if (this.hubConnection?.state !== 'Connected') {
                throw new Error('Chat connection is not in Connected state');
            }

            const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
            await this.hubConnection.invoke('SendMessage', numericChatId, content);
        } catch (error) {
            console.error('Error sending message:', error);
            // Try to reconnect once if the connection was lost
            if (this.hubConnection?.state !== 'Connected') {
                try {
                    await this.startConnection();
                    await this.joinChat(chatId);
                    const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
                    await this.hubConnection?.invoke('SendMessage', numericChatId, content);
                    return;
                } catch (retryError) {
                    console.error('Error retrying message send:', retryError);
                }
            }
            throw error;
        }
    }

    public async markAsRead(messageId: string | number) {
        try {
            await this.ensureInitialized();
            
            if (!this.hubConnection || this.hubConnection.state === 'Disconnected') {
                await this.startConnection();
            }

            // Convert to string if it's a number (messageId should be a GUID string)
            const messageIdStr = typeof messageId === 'number' ? messageId.toString() : messageId;
            await this.hubConnection?.invoke('MarkAsRead', messageIdStr);
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    public getConnectionState(): string {
        return this.hubConnection?.state || 'Disconnected';
    }

    public async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
        const startTime = Date.now();
        
        await this.ensureInitialized();
        
        while (this.hubConnection?.state !== 'Connected' && Date.now() - startTime < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return this.hubConnection?.state === 'Connected';
    }

    public async joinChat(chatId: number | string) {
        try {
            await this.ensureInitialized();
            
            if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
                await this.startConnection();
            }

            const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
            await this.hubConnection?.invoke('JoinChat', numericChatId);
        } catch (error) {
            console.error('Error joining chat:', error);
            throw error;
        }
    }

    public async leaveChat(chatId: number | string) {
        try {
            await this.ensureInitialized();
            
            if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
                await this.startConnection();
            }

            const numericChatId = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
            await this.hubConnection?.invoke('LeaveChat', numericChatId);
        } catch (error) {
            console.error('Error leaving chat:', error);
            throw error;
        }
    }

    public async disconnect() {
        try {
            if (this.hubConnection) {
                await this.hubConnection.stop();
                this.hubConnection = null;
            }
        } catch (error) {
            console.error('Error disconnecting from chat hub:', error);
            throw error;
        }
    }

    async getMessages(chatId: number): Promise<Message[]> {
        const response = await fetch(`${CHAT_ENDPOINT}/${chatId}/messages`);
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        return response.json();
    }

    async sendMessageToAPI(chatId: number, content: string): Promise<void> {
        await this.ensureInitialized();
        if (!this.hubConnection) {
            throw new Error('SignalR connection not established');
        }
        await this.hubConnection.invoke('SendMessage', chatId, content);
    }

    subscribeToMessages(chatId: number, callback: (message: Message) => void) {
        this.ensureInitialized().then(() => {
            if (!this.hubConnection) {
                throw new Error('SignalR connection not established');
            }
            this.hubConnection.on('ReceiveMessage', (message: Message) => {
                if (message.chatId.toString() === chatId.toString()) {
                    callback(message);
                }
            });
        });

        return {
            unsubscribe: () => {
                if (this.hubConnection) {
                    this.hubConnection.off('ReceiveMessage');
                }
            }
        };
    }
}

export const chatService = new ChatService(); 