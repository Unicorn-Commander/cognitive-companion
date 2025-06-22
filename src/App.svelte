<script lang="ts">
  import CharacterDisplay from './lib/components/character/CharacterDisplay.svelte';
  import ChatInterface from './lib/components/chat/ChatInterface.svelte';
  import { characterState, characterActions } from './lib/stores/character';
  import { chatState } from './lib/stores/chat';
  import { colonelAPI } from './lib/api/colonel';
  import { onMount } from 'svelte';

  let connectionStatus = 'connecting'; // 'connecting' | 'connected' | 'error'
  let errorMessage = '';
  let isInitialized = false;
  let isDesktopApp = false;
  let colonelStatus = false;

  // Initialize app
  onMount(async () => {
    console.log('Cognitive Companion starting...');
    
    // Check if running in Tauri desktop app
    isDesktopApp = !!window.__TAURI__;
    console.log(isDesktopApp ? '🖥️ Running as desktop app' : '🌐 Running as web app');

    if (isDesktopApp) {
      // In desktop app, The_Colonel should auto-start via Rust backend
      // Wait a moment for it to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        colonelStatus = await colonelAPI.getColonelStatus();
        console.log('Colonel status:', colonelStatus);
      } catch (error) {
        console.error('Failed to get colonel status:', error);
      }
    }
    
    // Test connection to The_Colonel
    try {
      const isConnected = await colonelAPI.testConnection();
      if (isConnected) {
        connectionStatus = 'connected';
        await characterActions.express('happy', false);
        characterState.setLastAction('Connected to The_Colonel successfully');
        console.log('✅ Connected to The_Colonel');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      connectionStatus = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      characterState.setEmotion('worried');
      characterState.setLastAction('Failed to connect to The_Colonel');
      console.error('❌ Failed to connect to The_Colonel:', error);
    }
    
    isInitialized = true;
  });

  async function retryConnection() {
    connectionStatus = 'connecting';
    errorMessage = '';
    
    try {
      const isConnected = await colonelAPI.testConnection();
      if (isConnected) {
        connectionStatus = 'connected';
        await characterActions.express('excited', true);
        characterState.setLastAction('Reconnected to The_Colonel');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      connectionStatus = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      characterActions.sympathize();
    }
  }

  function handleCharacterClick() {
    if (connectionStatus === 'connected') {
      characterActions.express($characterState.emotion, true);
    }
  }
</script>

<main class="app">
  {#if !isInitialized}
    <!-- Loading Screen -->
    <div class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h2>Initializing Cognitive Companion...</h2>
        <p>Connecting to The_Colonel server...</p>
      </div>
    </div>
  {:else if connectionStatus === 'error'}
    <!-- Error Screen -->
    <div class="error-screen">
      <div class="error-content">
        <CharacterDisplay size="large" />
        <div class="error-details">
          <h2>Connection Error</h2>
          <p>Unable to connect to The_Colonel server:</p>
          <code class="error-message">{errorMessage}</code>
          <div class="error-actions">
            <button class="btn-primary" on:click={retryConnection}>
              Retry Connection
            </button>
          </div>
          <div class="troubleshooting">
            <h3>Troubleshooting:</h3>
            <ul>
              <li>Make sure The_Colonel is running on localhost:8264</li>
              <li>Check if the port is available and not blocked</li>
              <li>Verify your API configuration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Main Application -->
    <div class="app-container">
      <!-- Left Panel - Character -->
      <div class="character-panel">
        <CharacterDisplay 
          size="large" 
          on:click={handleCharacterClick} 
        />
        
        <!-- Connection Status -->
        <div class="connection-panel">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value connected">Connected</span>
          </div>
          <div class="status-item">
            <span class="status-label">Server:</span>
            <span class="status-value">localhost:8264</span>
          </div>
          <div class="status-item">
            <span class="status-label">Model:</span>
            <span class="status-value">the-colonel</span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button 
            class="action-btn"
            on:click={() => characterActions.express('happy', true)}
            title="Make character happy"
          >
            😊 Cheer Up
          </button>
          <button 
            class="action-btn"
            on:click={() => characterActions.think(3000)}
            title="Make character think"
          >
            🤔 Think
          </button>
          <button 
            class="action-btn"
            on:click={() => characterActions.celebrate()}
            title="Make character celebrate"
          >
            🎉 Celebrate
          </button>
        </div>

        <!-- Desktop App Controls -->
        {#if isDesktopApp}
          <div class="desktop-controls">
            <h3>The_Colonel Control</h3>
            <div class="control-buttons">
              <button 
                class="control-btn start"
                on:click={async () => {
                  try {
                    await colonelAPI.startColonel();
                    colonelStatus = await colonelAPI.getColonelStatus();
                  } catch (error) {
                    console.error('Failed to start Colonel:', error);
                  }
                }}
                disabled={colonelStatus}
              >
                🚀 Start The_Colonel
              </button>
              <button 
                class="control-btn stop"
                on:click={async () => {
                  try {
                    await colonelAPI.stopColonel();
                    colonelStatus = await colonelAPI.getColonelStatus();
                  } catch (error) {
                    console.error('Failed to stop Colonel:', error);
                  }
                }}
                disabled={!colonelStatus}
              >
                ⏹️ Stop The_Colonel
              </button>
            </div>
            <div class="status-indicator {colonelStatus ? 'running' : 'stopped'}">
              {colonelStatus ? '✅ Running' : '❌ Stopped'}
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Panel - Chat -->
      <div class="chat-panel">
        <ChatInterface />
      </div>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }

  .loading-content {
    text-align: center;
    color: #333;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e1e5e9;
    border-top: 4px solid #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }

  .error-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }

  .error-content {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    text-align: center;
  }

  .error-details {
    margin-top: 24px;
  }

  .error-details h2 {
    color: #d9534f;
    margin-bottom: 16px;
  }

  .error-message {
    display: block;
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
    margin: 16px 0;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 14px;
    color: #d9534f;
    border-left: 4px solid #d9534f;
  }

  .error-actions {
    margin: 24px 0;
  }

  .btn-primary {
    background: #4a90e2;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background: #357abd;
    transform: translateY(-1px);
  }

  .troubleshooting {
    margin-top: 24px;
    text-align: left;
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
  }

  .troubleshooting h3 {
    margin-top: 0;
    color: #666;
  }

  .troubleshooting ul {
    margin: 8px 0;
    padding-left: 20px;
  }

  .troubleshooting li {
    margin: 4px 0;
    color: #666;
  }

  .app-container {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    width: 100%;
    max-width: 1400px;
    height: 90vh;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .character-panel {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    border-right: 1px solid #e1e5e9;
  }

  .connection-panel {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0;
    font-size: 14px;
  }

  .status-label {
    font-weight: 600;
    color: #666;
  }

  .status-value {
    color: #333;
  }

  .status-value.connected {
    color: #5cb85c;
    font-weight: 600;
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    padding: 12px 16px;
    background: white;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    text-align: left;
  }

  .action-btn:hover {
    background: #f8f9fa;
    border-color: #4a90e2;
    transform: translateY(-1px);
  }

  .desktop-controls {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .desktop-controls h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .control-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .control-btn {
    padding: 10px 16px;
    border: 2px solid;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    text-align: left;
  }

  .control-btn.start {
    background: white;
    border-color: #5cb85c;
    color: #5cb85c;
  }

  .control-btn.start:hover:not(:disabled) {
    background: #5cb85c;
    color: white;
  }

  .control-btn.stop {
    background: white;
    border-color: #d9534f;
    color: #d9534f;
  }

  .control-btn.stop:hover:not(:disabled) {
    background: #d9534f;
    color: white;
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .status-indicator {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }

  .status-indicator.running {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .status-indicator.stopped {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .chat-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .app-container {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
      height: 95vh;
      gap: 16px;
    }

    .character-panel {
      padding: 16px;
      flex-direction: row;
      align-items: center;
      gap: 16px;
      overflow-x: auto;
    }

    .quick-actions {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      min-width: 100px;
    }
  }
</style>