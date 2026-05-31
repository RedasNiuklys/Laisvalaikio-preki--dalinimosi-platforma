import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ChatProvider, useChatContext } from '@/src/context/ChatContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatProvider>{children}</ChatProvider>
);

describe('ChatContext', () => {
  it('provides default values', () => {
    const { result } = renderHook(() => useChatContext(), { wrapper });
    expect(result.current.chatId).toBeNull();
    expect(result.current.title).toBe('Chat');
    expect(result.current.isGroupChat).toBe(false);
    expect(result.current.participants).toEqual([]);
  });

  it('setChatTitle updates chatId, title, isGroupChat, participants', () => {
    const { result } = renderHook(() => useChatContext(), { wrapper });
    const participants = [{ id: 'u1', name: 'Alice' }];

    act(() => {
      result.current.setChatTitle(7, 'Test Chat', true, participants);
    });

    expect(result.current.chatId).toBe(7);
    expect(result.current.title).toBe('Test Chat');
    expect(result.current.isGroupChat).toBe(true);
    expect(result.current.participants).toEqual(participants);
  });

  it('clearChatTitle resets to defaults', () => {
    const { result } = renderHook(() => useChatContext(), { wrapper });

    act(() => {
      result.current.setChatTitle(7, 'Test Chat', true, [{ id: 'u1', name: 'Alice' }]);
    });
    act(() => {
      result.current.clearChatTitle();
    });

    expect(result.current.chatId).toBeNull();
    expect(result.current.title).toBe('Chat');
    expect(result.current.isGroupChat).toBe(false);
    expect(result.current.participants).toEqual([]);
  });

  it('throws when used outside ChatProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useChatContext();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toContain('ChatProvider');
  });
});
