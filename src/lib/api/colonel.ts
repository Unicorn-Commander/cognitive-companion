/**
 * The_Colonel API Client
 * Provides interface to The_Colonel server for AI chat and tool execution
 * Now with Tauri integration for desktop app
 */

import { invoke } from '@tauri-apps/api/tauri';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string;
  }>;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  type: 'python' | 'shell' | 'file' | 'computer';
}

export class ColonelAPI {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = 'http://localhost:8264', authToken?: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Test connection to The_Colonel server
   */
  async testConnection(): Promise<boolean> {
    try {
      // In Tauri app, use the Rust backend to test connection
      if (window.__TAURI__) {
        return await invoke('test_colonel_connection');
      }
      
      // Fallback to direct HTTP for web version
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Start The_Colonel server (Tauri only)
   */
  async startColonel(): Promise<string> {
    if (window.__TAURI__) {
      return await invoke('start_colonel');
    }
    throw new Error('startColonel only available in desktop app');
  }

  /**
   * Stop The_Colonel server (Tauri only)
   */
  async stopColonel(): Promise<string> {
    if (window.__TAURI__) {
      return await invoke('stop_colonel');
    }
    throw new Error('stopColonel only available in desktop app');
  }

  /**
   * Get The_Colonel server status (Tauri only)
   */
  async getColonelStatus(): Promise<boolean> {
    if (window.__TAURI__) {
      return await invoke('get_colonel_status');
    }
    return false;
  }

  /**
   * Send chat completion request
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat completion failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send streaming chat completion request
   */
  async *streamChatCompletion(request: ChatCompletionRequest): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Streaming chat failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Execute Python code
   */
  async executePython(code: string): Promise<ToolExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tools/execute/python`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        output: result.output || result.message || '',
        error: result.error,
        type: 'python'
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        type: 'python'
      };
    }
  }

  /**
   * Execute shell command
   */
  async executeShell(command: string): Promise<ToolExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tools/execute/shell`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ command }),
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        output: result.output || result.message || '',
        error: result.error,
        type: 'shell'
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        type: 'shell'
      };
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(): Promise<ToolExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tools/computer/screenshot`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        output: result.screenshot || result.message || '',
        error: result.error,
        type: 'computer'
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        type: 'computer'
      };
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<ToolExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tools/files/read`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ path }),
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        output: result.content || result.message || '',
        error: result.error,
        type: 'file'
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        type: 'file'
      };
    }
  }

  /**
   * Write file content
   */
  async writeFile(path: string, content: string): Promise<ToolExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tools/files/write`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ path, content }),
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        output: result.message || 'File written successfully',
        error: result.error,
        type: 'file'
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        type: 'file'
      };
    }
  }
}

// Export singleton instance
export const colonelAPI = new ColonelAPI();