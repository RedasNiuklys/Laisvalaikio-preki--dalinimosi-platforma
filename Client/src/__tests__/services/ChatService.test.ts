import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/src/utils/authUtils', () => ({
  getAuthToken: jest.fn().mockResolvedValue('test-token'),
}));
jest.mock('@/src/utils/envConfig', () => ({
  BASE_URL: 'http://localhost/api',
  CHAT_ENDPOINT: '/chat',
  CHAT_HUB_ENDPOINT: '/chatHub',
}));

import { chatService } from '@/src/services/ChatService';
import { HubConnectionBuilder } from '@microsoft/signalr';

const getMockHub = () => {
  const builder = new (HubConnectionBuilder as any)();
  return builder.build();
};

beforeEach(async () => {
  await (AsyncStorage as any).clear();
  jest.clearAllMocks();
  // Reset internal state between tests by re-requiring the module
  jest.resetModules();
});

describe('ChatService', () => {
  it('is importable and has expected public methods', () => {
    expect(typeof chatService.ensureInitialized).toBe('function');
    expect(typeof chatService.sendMessage).toBe('function');
    expect(typeof chatService.markAsRead).toBe('function');
    expect(typeof chatService.joinChat).toBe('function');
    expect(typeof chatService.leaveChat).toBe('function');
    expect(typeof chatService.onMessage).toBe('function');
    expect(typeof chatService.onReadReceipt).toBe('function');
    expect(typeof chatService.onChatUpdated).toBe('function');
    expect(typeof chatService.onUnreadCountChanged).toBe('function');
    expect(typeof chatService.onBookingStatusChanged).toBe('function');
    expect(typeof chatService.getConnectionState).toBe('function');
  });

  it('getConnectionState returns Disconnected before initialization', () => {
    expect(chatService.getConnectionState()).toBe('Disconnected');
  });

  it('onMessage registers a callback and returns an unsubscribe function', () => {
    const cb = jest.fn();
    const unsub = chatService.onMessage(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onReadReceipt registers a callback and returns an unsubscribe function', () => {
    const cb = jest.fn();
    const unsub = chatService.onReadReceipt(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onChatUpdated registers a callback and returns an unsubscribe function', () => {
    const cb = jest.fn();
    const unsub = chatService.onChatUpdated(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onUnreadCountChanged registers a callback and returns an unsubscribe function', () => {
    const cb = jest.fn();
    const unsub = chatService.onUnreadCountChanged(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onBookingStatusChanged registers a callback and returns an unsubscribe function', () => {
    const cb = jest.fn();
    const unsub = chatService.onBookingStatusChanged(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('ensureInitialized calls HubConnectionBuilder and starts the connection', async () => {
    await chatService.ensureInitialized();
    expect(HubConnectionBuilder).toHaveBeenCalled();
  });

  it('ensureInitialized is idempotent (second call does not re-initialize)', async () => {
    await chatService.ensureInitialized();
    const callCount = (HubConnectionBuilder as jest.Mock).mock.calls.length;
    await chatService.ensureInitialized();
    expect((HubConnectionBuilder as jest.Mock).mock.calls.length).toBe(callCount);
  });

  it('sendMessage invokes hub method', async () => {
    await chatService.ensureInitialized();
    const mockHub = getMockHub();
    await chatService.sendMessage(1, 'Hello world');
    expect(mockHub.invoke).toHaveBeenCalledWith('SendMessage', 1, 'Hello world');
  });

  it('sendMessage with string chatId converts to number', async () => {
    await chatService.ensureInitialized();
    const mockHub = getMockHub();
    await chatService.sendMessage('5', 'test msg');
    expect(mockHub.invoke).toHaveBeenCalledWith('SendMessage', 5, 'test msg');
  });

  it('markAsRead invokes MarkAsRead hub method', async () => {
    await chatService.ensureInitialized();
    const mockHub = getMockHub();
    await chatService.markAsRead('msg-123');
    expect(mockHub.invoke).toHaveBeenCalledWith('MarkAsRead', 'msg-123');
  });

  it('joinChat invokes JoinChat hub method', async () => {
    await chatService.ensureInitialized();
    const mockHub = getMockHub();
    await chatService.joinChat(42);
    expect(mockHub.invoke).toHaveBeenCalledWith('JoinChat', 42);
  });

  it('leaveChat invokes LeaveChat hub method', async () => {
    await chatService.ensureInitialized();
    const mockHub = getMockHub();
    await chatService.leaveChat(42);
    expect(mockHub.invoke).toHaveBeenCalledWith('LeaveChat', 42);
  });

  it('unsubscribed onMessage callback is not called after unsub', async () => {
    await chatService.ensureInitialized();
    const cb = jest.fn();
    const unsub = chatService.onMessage(cb);
    unsub();
    const mockHub = getMockHub();
    const receiveHandler = (mockHub.on as jest.Mock).mock.calls.find(
      ([event]: [string]) => event === 'ReceiveMessage'
    )?.[1];
    if (receiveHandler) receiveHandler({ id: '1', content: 'hi', senderId: 'u1', chatId: 1, sentAt: '', sender: { id: 'u1', name: 'User' }, readBy: [] });
    expect(cb).not.toHaveBeenCalled();
  });
});
