<script lang="ts">
  import { chatState, isStreaming } from '../../stores/chat';
  import { characterState, characterActions } from '../../stores/character';
  import { colonelAPI } from '../../api/colonel';
  import { onMount } from 'svelte';

  let messageInput = '';
  let chatContainer;
  let inputElement;
  
  $: messages = $chatState.messages;
  $: isLoading = $chatState.isLoading;
  $: canSend = messageInput.trim() && !isLoading && !$isStreaming;

  // Auto-scroll to bottom when new messages arrive
  $: if (messages.length > 0 && chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }

  async function sendMessage() {
    if (!canSend) return;

    const userMessage = messageInput.trim();
    messageInput = '';

    // Add user message
    chatState.addMessage({
      role: 'user',
      content: userMessage
    });

    // Set character to thinking
    characterActions.think(1000);
    chatState.setLoading(true);

    try {
      // Start streaming assistant response
      const streamingId = chatState.startStreaming('assistant', '');
      
      // Get conversation history for API
      const apiMessages = chatState.getMessagesForAPI();
      
      // Stream response from The_Colonel
      const streamGenerator = colonelAPI.streamChatCompletion({
        messages: apiMessages,
        stream: true,
        temperature: 0.7
      });

      let fullResponse = '';
      
      for await (const chunk of streamGenerator) {
        fullResponse += chunk;
        chatState.appendToStreaming(chunk);
      }

      // End streaming
      chatState.endStreaming();
      
      // Character reaction based on response
      if (fullResponse.includes('error') || fullResponse.includes('failed')) {
        characterActions.sympathize();
      } else {
        characterState.setEmotion('happy');
        characterState.adjustMood(5);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // End streaming and add error message
      chatState.endStreaming();
      chatState.addMessage({
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that The_Colonel is running and try again.`
      });
      
      characterActions.sympathize();
    } finally {
      chatState.setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatTimestamp(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function clearChat() {
    chatState.clear();
    characterState.reset();
  }

  onMount(() => {
    // Focus input on mount
    if (inputElement) {
      inputElement.focus();
    }
  });
</script>

<div class="chat-interface">
  <!-- Chat Header -->
  <div class="chat-header">
    <h2>Cognitive Companion Chat</h2>
    <div class="header-actions">
      <button class="btn-secondary" on:click={clearChat} disabled={isLoading}>
        Clear Chat
      </button>
    </div>
  </div>

  <!-- Chat Messages -->
  <div class="chat-container" bind:this={chatContainer}>
    <div class="messages">
      {#each messages as message (message.id)}
        <div class="message {message.role}" class:streaming={message.isStreaming}>
          <div class="message-header">
            <span class="role">{message.role === 'user' ? 'You' : 'Assistant'}</span>
            <span class="timestamp">{formatTimestamp(message.timestamp)}</span>
          </div>
          <div class="message-content">
            {#if message.isStreaming}
              <span class="content">{message.content}</span>
              <span class="streaming-cursor">|</span>
            {:else}
              <span class="content">{message.content}</span>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if isLoading && !$isStreaming}
        <div class="message assistant thinking">
          <div class="message-header">
            <span class="role">Assistant</span>
            <span class="timestamp">Thinking...</span>
          </div>
          <div class="message-content">
            <div class="thinking-indicator">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Chat Input -->
  <div class="chat-input-container">
    <div class="input-wrapper">
      <textarea
        bind:this={inputElement}
        bind:value={messageInput}
        on:keydown={handleKeyDown}
        placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
        rows="3"
        disabled={isLoading}
        class="message-input"
      ></textarea>
      <button 
        class="send-button"
        on:click={sendMessage}
        disabled={!canSend}
        title="Send message"
      >
        {#if isLoading}
          <div class="loading-spinner"></div>
        {:else}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        {/if}
      </button>
    </div>
    
    <!-- Connection Status -->
    <div class="connection-status">
      <span class="status-indicator"></span>
      Connected to The_Colonel
    </div>
  </div>
</div>

<style>
  .chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    color: white;
  }

  .chat-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .btn-secondary {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #fafbfc;
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message {
    max-width: 80%;
    animation: fadeIn 0.3s ease;
  }

  .message.user {
    align-self: flex-end;
  }

  .message.assistant {
    align-self: flex-start;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 12px;
    color: #666;
  }

  .role {
    font-weight: 600;
    text-transform: capitalize;
  }

  .timestamp {
    opacity: 0.7;
  }

  .message-content {
    padding: 12px 16px;
    border-radius: 18px;
    position: relative;
    word-wrap: break-word;
    line-height: 1.4;
  }

  .user .message-content {
    background: #4a90e2;
    color: white;
  }

  .assistant .message-content {
    background: white;
    color: #333;
    border: 1px solid #e1e5e9;
  }

  .streaming .message-content {
    border-color: #4a90e2;
  }

  .content {
    white-space: pre-wrap;
  }

  .streaming-cursor {
    animation: blink 1s infinite;
    color: #4a90e2;
    font-weight: bold;
  }

  .thinking .message-content {
    background: #f8f9fa;
    border: 1px dashed #d1d5da;
  }

  .thinking-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .thinking-indicator .dot {
    width: 6px;
    height: 6px;
    background: #666;
    border-radius: 50%;
    animation: thinking 1.5s infinite;
  }

  .thinking-indicator .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .thinking-indicator .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  .chat-input-container {
    padding: 16px 20px;
    background: white;
    border-top: 1px solid #e1e5e9;
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .message-input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 12px;
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4;
    transition: border-color 0.2s ease;
    min-height: 48px;
    max-height: 120px;
  }

  .message-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .message-input:disabled {
    background: #f8f9fa;
    color: #666;
  }

  .send-button {
    width: 48px;
    height: 48px;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .send-button:hover:not(:disabled) {
    background: #357abd;
    transform: translateY(-1px);
  }

  .send-button:disabled {
    background: #d1d5da;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    font-size: 12px;
    color: #666;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    background: #5cb85c;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  @keyframes thinking {
    0%, 60%, 100% { transform: scale(1); opacity: 0.7; }
    30% { transform: scale(1.2); opacity: 1; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Scrollbar styling */
  .chat-container::-webkit-scrollbar {
    width: 6px;
  }

  .chat-container::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .chat-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  .chat-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
</style>