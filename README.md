# 🧠 Cognitive Companion

**Your AI Desktop Companion with Deep Native Integration**

Cognitive Companion is a native desktop application that combines the power of The_Colonel (Open Interpreter fork) with an engaging, animated character interface. Built with Tauri and Svelte, it provides a seamless desktop experience with embedded AI capabilities, character animations, and voice synthesis.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active%20Development-orange)

## ✨ Features

### 🤖 **Deep AI Integration**
- **Embedded The_Colonel**: Automatically starts and manages The_Colonel process
- **Profile Support**: Uses your custom AI profiles (gpt-4o-mini included)
- **Streaming Responses**: Real-time chat with your AI companion
- **Tool Execution**: Full access to code execution, file operations, and computer control

### 🎭 **Interactive Character**
- **Animated Companion**: CSS-based character with emotions and reactions
- **Voice Synthesis**: Character speaks responses using Web Speech API
- **Mood System**: Dynamic mood and energy tracking based on interactions
- **Contextual Reactions**: Character responds to tool execution results

### 🖥️ **Native Desktop Experience**
- **System Tray Integration**: Minimize to tray with right-click controls
- **Auto-start Management**: Automatically launches The_Colonel on startup
- **Process Lifecycle**: Start/stop The_Colonel directly from the UI
- **Native Window Controls**: Hide on close, focus management
- **Global Shortcuts**: Quick access hotkeys (ready for implementation)

### 💬 **Advanced Chat Interface**
- **Streaming Chat**: Real-time conversation with typing indicators
- **Message History**: Persistent chat log with timestamps
- **Error Recovery**: Graceful handling of connection issues
- **Status Indicators**: Visual feedback for all system states

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** 1.70+ (for Tauri)
- **Python** 3.11+ (for The_Colonel)
- **The_Colonel Profile**: Compatible AI profile (included: gpt-4o-mini)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd cognitive-companion
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up The_Colonel Profile**
   - Ensure you have a working AI profile at:
   - `/Users/aaronstransky/AI-Profiles/Open-Interpreter-Profiles/gpt-4o-mini.py`
   - Or update the profile path in `src-tauri/src/main.rs`

4. **Development Mode**
   ```bash
   npm run tauri:dev
   ```

5. **Production Build**
   ```bash
   npm run tauri:build
   ```

### First Launch

1. The app will automatically start The_Colonel with your profile
2. Wait 2-3 seconds for initialization
3. The character will show "Connected" status when ready
4. Start chatting with your AI companion!

## 🏗️ Architecture

### Frontend (Svelte + TypeScript)
```
src/
├── lib/
│   ├── api/colonel.ts          # The_Colonel API client with Tauri integration
│   ├── stores/                 # Reactive state management
│   │   ├── character.ts        # Character emotions, mood, voice
│   │   └── chat.ts            # Chat messages and streaming
│   └── components/            # UI components
│       ├── character/         # Character display and animations
│       └── chat/             # Chat interface and controls
└── App.svelte                 # Main application shell
```

### Backend (Rust + Tauri)
```
src-tauri/
├── src/
│   ├── main.rs               # Tauri app with system tray and commands
│   └── colonel.rs           # The_Colonel process management
├── resources/               # Bundled resources
│   └── the_colonel/        # Complete The_Colonel installation
└── Cargo.toml              # Rust dependencies and features
```

### Key Components

- **ColonelManager**: Rust backend for process lifecycle management
- **Character System**: Emotion engine with voice synthesis
- **API Bridge**: Seamless communication between frontend and The_Colonel
- **System Integration**: Native desktop features and tray controls

## 🎯 Usage

### Basic Chat
1. Type your message in the chat input
2. Press Enter to send (Shift+Enter for new lines)
3. Watch the character react with emotions and voice
4. Character mood and energy change based on interactions

### Character Interaction
- **Click the character** to trigger random expressions
- **Use quick actions** to make the character happy, think, or celebrate
- **Monitor status bars** for mood and energy levels

### Desktop Controls (Tauri App)
- **Start/Stop The_Colonel** using the control panel
- **System Tray** for background operation
- **Hide on close** - app continues running in tray
- **Status monitoring** - visual indicators for all processes

### Profile Management
The app uses The_Colonel profiles for AI configuration:
- Default: `gpt-4o-mini.py` profile
- Customize: Edit the profile path in Rust backend
- Supports: All The_Colonel compatible profiles

## 🔧 Development

### Project Structure
- **Frontend**: Svelte 4 with reactive stores and components
- **Backend**: Tauri 1.5 with Rust process management
- **Build System**: Vite for frontend, Cargo for backend
- **Package Manager**: npm for Node.js, Cargo for Rust

### Development Commands
```bash
# Start development server
npm run tauri:dev

# Build frontend only
npm run build

# Build complete desktop app
npm run tauri:build

# Run The_Colonel standalone (for testing)
cd The_Colonel && source venv/bin/activate && interpreter --openwebui_server --port 8264
```

### Adding Features

1. **New Character Emotions**: Add to `character.ts` emotion mappings
2. **Additional AI Tools**: Extend `colonel.ts` API client
3. **UI Components**: Create new Svelte components in `components/`
4. **Rust Commands**: Add Tauri commands in `main.rs`

### Testing
- **Frontend**: Browser at `http://localhost:5173` (web mode)
- **Desktop**: `npm run tauri:dev` (native mode)
- **API**: Test The_Colonel endpoints directly
- **Character**: Use quick action buttons for testing reactions

## 📋 Current Status

### ✅ Completed Features
- **Phase 1**: Core Integration with The_Colonel ✓
- **Deep Native Integration**: Embedded Tauri app ✓
- **Character System**: Animations, voice, emotions ✓
- **Chat Interface**: Streaming, history, error handling ✓
- **Process Management**: Auto-start, lifecycle control ✓
- **Desktop Features**: System tray, native windows ✓

### 🔄 In Progress
- **Live2D Integration**: Advanced character animations
- **Global Shortcuts**: Hotkey system
- **Settings Panel**: User configuration interface

### 🎯 Planned Features
- **Multiple Characters**: Character selection and customization
- **Voice Input**: Speech-to-text integration
- **Plugin System**: Extensible tool architecture
- **Cloud Sync**: Settings and chat history synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Submit a pull request with detailed description

### Code Style
- **Frontend**: Prettier + ESLint for Svelte/TypeScript
- **Backend**: Rustfmt for Rust code
- **Commits**: Conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[The_Colonel](https://github.com/Unicorn-Commander/The_Colonel)** - Enhanced Open Interpreter fork
- **[Open Interpreter](https://github.com/OpenInterpreter/open-interpreter)** - Foundation AI framework
- **[Tauri](https://tauri.app/)** - Native desktop app framework
- **[Svelte](https://svelte.dev/)** - Reactive frontend framework

## 🆘 Troubleshooting

### Common Issues

**The_Colonel Won't Start**
```bash
# Check if Python 3.11 is available
python3.11 --version

# Test The_Colonel manually
cd The_Colonel && source venv/bin/activate && interpreter --version
```

**Character Not Responding**
- Check browser console for errors
- Verify Web Speech API support
- Test with character quick actions

**Build Failures**
```bash
# Clean and rebuild
npm run build
cargo clean
npm run tauri:build
```

**Connection Issues**
- Ensure port 8264 is available
- Check firewall settings
- Verify The_Colonel profile is valid

### Support

- **Issues**: [GitHub Issues](https://github.com/Unicorn-Commander/cognitive-companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Unicorn-Commander/cognitive-companion/discussions)
- **Documentation**: [Project Wiki](https://github.com/Unicorn-Commander/cognitive-companion/wiki)

---

**Made with ❤️ by Magic Unicorn Unconventional Technology & Stuff Inc**

**Repository**: https://github.com/Unicorn-Commander/cognitive-companion