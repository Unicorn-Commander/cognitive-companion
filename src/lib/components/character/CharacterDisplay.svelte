<script>
  import { characterState, characterActions } from '../../stores/character';
  import { onMount } from 'svelte';

  export let size = 'medium'; // 'small' | 'medium' | 'large'
  
  let characterElement;
  
  // Reactive character state
  $: emotion = $characterState.emotion;
  $: isThinking = $characterState.isThinking;
  $: isSpeaking = $characterState.isSpeaking;
  $: mood = $characterState.mood;
  $: energy = $characterState.energy;

  // Character dimensions based on size
  $: characterSize = {
    small: { width: 120, height: 160 },
    medium: { width: 200, height: 260 },
    large: { width: 280, height: 360 }
  }[size];

  // Emotion-based character appearance
  $: emotionStyle = getEmotionStyle(emotion);
  
  function getEmotionStyle(emotion) {
    const baseColors = {
      background: '#4a90e2',
      border: '#357abd',
      accent: '#ffffff'
    };

    const emotionColors = {
      neutral: { background: '#4a90e2', border: '#357abd' },
      happy: { background: '#5cb85c', border: '#449d44' },
      excited: { background: '#f0ad4e', border: '#ec971f' },
      focused: { background: '#7b68ee', border: '#6a5acd' },
      confused: { background: '#d9534f', border: '#c9302c' },
      worried: { background: '#d9534f', border: '#c9302c' },
      accomplished: { background: '#5bc0de', border: '#46b8da' },
      frustrated: { background: '#d9534f', border: '#c9302c' }
    };

    return emotionColors[emotion] || emotionColors.neutral;
  }

  // Animation effects
  $: thinkingAnimation = isThinking ? 'animate-pulse' : '';
  $: speakingAnimation = isSpeaking ? 'animate-bounce' : '';

  // Character click handler
  function handleClick() {
    characterActions.express(emotion, true);
  }

  onMount(() => {
    // Initialize character animations
    console.log('Character display mounted');
  });
</script>

<div class="character-container" class:small={size === 'small'} class:medium={size === 'medium'} class:large={size === 'large'}>
  <!-- Character Avatar -->
  <div 
    bind:this={characterElement}
    class="character-avatar {thinkingAnimation} {speakingAnimation}"
    style="
      width: {characterSize.width}px; 
      height: {characterSize.height}px;
      background: linear-gradient(135deg, {emotionStyle.background}, {emotionStyle.border});
      border: 3px solid {emotionStyle.border};
    "
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
    role="button"
    tabindex="0"
    aria-label="Character avatar - click to interact"
  >
    <!-- Character Face -->
    <div class="character-face">
      <!-- Eyes -->
      <div class="eyes">
        <div class="eye left-eye" class:thinking={isThinking}></div>
        <div class="eye right-eye" class:thinking={isThinking}></div>
      </div>
      
      <!-- Mouth -->
      <div class="mouth" class:speaking={isSpeaking} class:happy={emotion === 'happy' || emotion === 'excited' || emotion === 'accomplished'} class:sad={emotion === 'worried' || emotion === 'frustrated'}></div>
    </div>
    
    <!-- Emotion indicator -->
    <div class="emotion-indicator">
      {emotion}
    </div>
  </div>

  <!-- Character Status -->
  <div class="character-status">
    <!-- Mood indicator -->
    <div class="status-bar mood-bar">
      <span class="status-label">Mood</span>
      <div class="status-progress">
        <div 
          class="progress-fill mood-fill" 
          style="width: {Math.abs(mood)}%; background-color: {mood >= 0 ? '#5cb85c' : '#d9534f'}"
        ></div>
      </div>
      <span class="status-value">{mood > 0 ? '+' : ''}{mood}</span>
    </div>

    <!-- Energy indicator -->
    <div class="status-bar energy-bar">
      <span class="status-label">Energy</span>
      <div class="status-progress">
        <div 
          class="progress-fill energy-fill" 
          style="width: {energy}%; background-color: {energy > 60 ? '#5cb85c' : energy > 30 ? '#f0ad4e' : '#d9534f'}"
        ></div>
      </div>
      <span class="status-value">{energy}</span>
    </div>

    <!-- Current action -->
    {#if $characterState.lastAction}
      <div class="last-action">
        <span class="action-label">Last Action:</span>
        <span class="action-text">{$characterState.lastAction}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .character-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 16px;
    user-select: none;
  }

  .character-avatar {
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .character-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  }

  .character-face {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .eyes {
    display: flex;
    gap: 20px;
  }

  .eye {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    position: relative;
    transition: all 0.3s ease;
  }

  .eye::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: #333;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: all 0.3s ease;
  }

  .eye.thinking::after {
    animation: blink 1s infinite;
  }

  .mouth {
    width: 20px;
    height: 10px;
    border: 2px solid white;
    border-radius: 0 0 20px 20px;
    border-top: none;
    transition: all 0.3s ease;
  }

  .mouth.speaking {
    animation: talk 0.5s infinite alternate;
  }

  .mouth.happy {
    border-radius: 20px 20px 0 0;
    border-bottom: none;
    border-top: 2px solid white;
  }

  .mouth.sad {
    border-radius: 0 0 20px 20px;
    transform: scaleY(-1);
  }

  .emotion-indicator {
    position: absolute;
    bottom: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    text-transform: capitalize;
  }

  .character-status {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 200px;
  }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .status-label {
    width: 50px;
    font-weight: bold;
    color: #666;
  }

  .status-progress {
    flex: 1;
    height: 8px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .status-value {
    width: 30px;
    text-align: right;
    font-weight: bold;
    color: #666;
  }

  .last-action {
    margin-top: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 11px;
  }

  .action-label {
    font-weight: bold;
    color: #666;
  }

  .action-text {
    color: #333;
    margin-left: 4px;
  }

  /* Size variations */
  .small .character-face {
    gap: 10px;
  }

  .small .eyes {
    gap: 10px;
  }

  .small .eye {
    width: 8px;
    height: 8px;
  }

  .small .eye::after {
    width: 5px;
    height: 5px;
    top: 1.5px;
    left: 1.5px;
  }

  .small .mouth {
    width: 12px;
    height: 6px;
  }

  .large .character-face {
    gap: 30px;
  }

  .large .eyes {
    gap: 30px;
  }

  .large .eye {
    width: 16px;
    height: 16px;
  }

  .large .eye::after {
    width: 10px;
    height: 10px;
    top: 3px;
    left: 3px;
  }

  .large .mouth {
    width: 28px;
    height: 14px;
  }

  /* Animations */
  @keyframes blink {
    0%, 90% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }

  @keyframes talk {
    0% { transform: scaleY(1); }
    100% { transform: scaleY(0.8); }
  }

  .animate-pulse {
    animation: pulse 1s infinite;
  }

  .animate-bounce {
    animation: bounce 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
</style>