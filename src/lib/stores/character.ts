/**
 * Character State Management
 * Handles character emotions, reactions, and behavior
 */

import { writable, derived } from 'svelte/store';
import type { ToolExecutionResult } from '../api/colonel';

export type Emotion = 
  | 'neutral' 
  | 'happy' 
  | 'excited' 
  | 'focused' 
  | 'confused' 
  | 'worried' 
  | 'accomplished' 
  | 'frustrated';

export interface CharacterState {
  name: string;
  emotion: Emotion;
  isThinking: boolean;
  isSpeaking: boolean;
  lastAction: string;
  energy: number; // 0-100
  mood: number; // -100 to 100
}

export interface CharacterProfile {
  name: string;
  personality: string;
  voice: {
    pitch: number;
    rate: number;
    volume: number;
  };
  responses: {
    [key in Emotion]: string[];
  };
}

// Default character profile
const defaultProfile: CharacterProfile = {
  name: "Aria",
  personality: "Helpful, curious, and enthusiastic AI companion",
  voice: {
    pitch: 1.2,
    rate: 0.9,
    volume: 0.8
  },
  responses: {
    neutral: [
      "What would you like to do today?",
      "I'm here and ready to help!",
      "How can I assist you?"
    ],
    happy: [
      "That's wonderful!",
      "I'm so glad to help!",
      "This is exciting!"
    ],
    excited: [
      "Oh wow, this is amazing!",
      "I love working on this kind of thing!",
      "This is going to be great!"
    ],
    focused: [
      "Let me concentrate on this...",
      "Working on it now...",
      "I'm processing this carefully..."
    ],
    confused: [
      "Hmm, that's interesting...",
      "Let me think about this...",
      "I need to understand this better..."
    ],
    worried: [
      "Oh, that doesn't look right...",
      "Something seems to be wrong...",
      "I'm concerned about this..."
    ],
    accomplished: [
      "Perfect! We did it!",
      "That worked beautifully!",
      "Success! I'm so proud of what we accomplished!"
    ],
    frustrated: [
      "This is challenging...",
      "Let me try a different approach...",
      "We'll figure this out together..."
    ]
  }
};

// Character state store
function createCharacterStore() {
  const initialState: CharacterState = {
    name: defaultProfile.name,
    emotion: 'neutral',
    isThinking: false,
    isSpeaking: false,
    lastAction: '',
    energy: 100,
    mood: 0
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    set,
    update,
    
    // Actions
    setEmotion: (emotion: Emotion) => update(state => ({ ...state, emotion })),
    
    setThinking: (isThinking: boolean) => update(state => ({ ...state, isThinking })),
    
    setSpeaking: (isSpeaking: boolean) => update(state => ({ ...state, isSpeaking })),
    
    setLastAction: (action: string) => update(state => ({ ...state, lastAction: action })),
    
    adjustMood: (delta: number) => update(state => ({
      ...state,
      mood: Math.max(-100, Math.min(100, state.mood + delta))
    })),
    
    adjustEnergy: (delta: number) => update(state => ({
      ...state,
      energy: Math.max(0, Math.min(100, state.energy + delta))
    })),
    
    // React to tool execution
    reactToTool: (result: ToolExecutionResult) => {
      if (result.success) {
        update(state => ({
          ...state,
          emotion: 'accomplished',
          mood: Math.min(100, state.mood + 10),
          energy: Math.max(0, state.energy - 5),
          lastAction: `Successfully executed ${result.type} command`
        }));
      } else {
        update(state => ({
          ...state,
          emotion: 'frustrated',
          mood: Math.max(-100, state.mood - 5),
          energy: Math.max(0, state.energy - 10),
          lastAction: `Failed to execute ${result.type} command`
        }));
      }
    },
    
    // Generate contextual response
    generateResponse: (context?: string): string => {
      // Get current emotion from store
      let currentEmotion: Emotion = 'neutral';
      update(state => {
        currentEmotion = state.emotion;
        return state;
      });
      
      const responses = defaultProfile.responses[currentEmotion];
      const randomIndex = Math.floor(Math.random() * responses.length);
      return responses[randomIndex];
    },
    
    // Reset to neutral state
    reset: () => set(initialState)
  };
}

export const characterState = createCharacterStore();
export const characterProfile = writable(defaultProfile);

// Derived stores
export const characterMoodDisplay = derived(
  characterState,
  $state => {
    if ($state.mood > 50) return 'very-happy';
    if ($state.mood > 20) return 'happy';
    if ($state.mood > -20) return 'neutral';
    if ($state.mood > -50) return 'sad';
    return 'very-sad';
  }
);

export const characterEnergyDisplay = derived(
  characterState,
  $state => {
    if ($state.energy > 80) return 'high';
    if ($state.energy > 40) return 'medium';
    if ($state.energy > 20) return 'low';
    return 'very-low';
  }
);

// Character actions helper
export const characterActions = {
  // Speak text using Web Speech API
  speak: async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      characterState.setSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get current profile for voice settings
      let profile = defaultProfile;
      characterProfile.subscribe(p => profile = p)();
      
      utterance.pitch = profile.voice.pitch;
      utterance.rate = profile.voice.rate;
      utterance.volume = profile.voice.volume;
      
      utterance.onend = () => {
        characterState.setSpeaking(false);
        resolve();
      };
      
      utterance.onerror = (event) => {
        characterState.setSpeaking(false);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      speechSynthesis.speak(utterance);
    });
  },

  // Show thinking animation
  think: async (duration: number = 2000): Promise<void> => {
    characterState.setThinking(true);
    characterState.setEmotion('focused');
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    characterState.setThinking(false);
    characterState.setEmotion('neutral');
  },

  // Express emotion with optional speech
  express: async (emotion: Emotion, speak: boolean = true): Promise<void> => {
    characterState.setEmotion(emotion);
    
    if (speak) {
      const response = characterState.generateResponse();
      await characterActions.speak(response);
    }
  },

  // React to successful task completion
  celebrate: async (): Promise<void> => {
    characterState.setEmotion('excited');
    characterState.adjustMood(20);
    
    const responses = [
      "Excellent work! That turned out perfectly!",
      "Amazing! We make a great team!",
      "Success! I love it when things work so well!"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    await characterActions.speak(response);
  },

  // React to errors or problems
  sympathize: async (): Promise<void> => {
    characterState.setEmotion('worried');
    characterState.adjustMood(-10);
    
    const responses = [
      "Don't worry, we'll figure this out together.",
      "That's okay, let's try a different approach.",
      "No problem! Learning from mistakes makes us stronger."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    await characterActions.speak(response);
  }
};