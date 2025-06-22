/**
 * Chat State Management
 * Handles conversation history and messaging
 */

import { writable, derived } from 'svelte/store';
import type { Message } from '../api/colonel';

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolResult?: any;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentStreamingId?: string;
}

function createChatStore() {
  const initialState: ChatState = {
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI companion. How can I help you today?",
        timestamp: new Date()
      }
    ],
    isLoading: false
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    set,
    update,

    // Add a new message
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      update(state => ({
        ...state,
        messages: [...state.messages, newMessage]
      }));

      return newMessage.id;
    },

    // Start streaming a message
    startStreaming: (role: 'user' | 'assistant' | 'system', initialContent: string = '') => {
      const messageId = Date.now().toString();
      const streamingMessage: ChatMessage = {
        id: messageId,
        role,
        content: initialContent,
        timestamp: new Date(),
        isStreaming: true
      };

      update(state => ({
        ...state,
        messages: [...state.messages, streamingMessage],
        currentStreamingId: messageId
      }));

      return messageId;
    },

    // Append content to streaming message
    appendToStreaming: (content: string) => {
      update(state => {
        if (!state.currentStreamingId) return state;

        return {
          ...state,
          messages: state.messages.map(msg =>
            msg.id === state.currentStreamingId
              ? { ...msg, content: msg.content + content }
              : msg
          )
        };
      });
    },

    // End streaming
    endStreaming: () => {
      update(state => {
        if (!state.currentStreamingId) return state;

        return {
          ...state,
          messages: state.messages.map(msg =>
            msg.id === state.currentStreamingId
              ? { ...msg, isStreaming: false }
              : msg
          ),
          currentStreamingId: undefined
        };
      });
    },

    // Update message content
    updateMessage: (id: string, updates: Partial<ChatMessage>) => {
      update(state => ({
        ...state,
        messages: state.messages.map(msg =>
          msg.id === id ? { ...msg, ...updates } : msg
        )
      }));
    },

    // Set loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },

    // Clear all messages
    clear: () => {
      set(initialState);
    },

    // Remove message
    removeMessage: (id: string) => {
      update(state => ({
        ...state,
        messages: state.messages.filter(msg => msg.id !== id)
      }));
    },

    // Get messages in OpenAI format
    getMessagesForAPI: (): Message[] => {
      let messages: Message[] = [];
      
      update(state => {
        messages = state.messages
          .filter(msg => !msg.isStreaming)
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        return state;
      });
      
      return messages;
    }
  };
}

export const chatState = createChatStore();

// Derived stores
export const lastMessage = derived(
  chatState,
  $state => $state.messages[$state.messages.length - 1]
);

export const messageCount = derived(
  chatState,
  $state => $state.messages.length
);

export const hasMessages = derived(
  messageCount,
  $count => $count > 1 // > 1 because we start with a greeting
);

export const isStreaming = derived(
  chatState,
  $state => !!$state.currentStreamingId
);