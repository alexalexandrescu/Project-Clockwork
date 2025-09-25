# Project Clockwork

> A modern web application platform with real-time collaboration and immersive user experiences

[![Quality Checks](https://github.com/username/project-clockwork/workflows/Quality%20Checks/badge.svg)](https://github.com/username/project-clockwork/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.70+-orange.svg)](https://phaser.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Features

- **Real-time Collaboration**: Seamless P2P networking with WebRTC for instant multi-user experiences
- **Immersive Rendering**: Powered by Phaser 3 game engine with 2D isometric graphics
- **Distributed Architecture**: Web Workers handle AI, database operations, and background processing
- **Offline-First**: IndexedDB storage with Dexie.js ensures functionality without internet
- **Modern Stack**: TypeScript, Vite, and cutting-edge web technologies
- **Production Ready**: Comprehensive testing, linting, and deployment pipeline

## 🏗️ Architecture

```
Project Clockwork
├── Core Systems          # Game engine and state management
│   ├── GameCore         # Phaser 3 integration
│   ├── StateManager    # Zustand-based global state
│   └── WorkerManager   # Web Worker orchestration
├── Workers              # Background processing
│   ├── AI Worker       # Intelligent behavior processing
│   ├── Database Worker # IndexedDB operations
│   ├── Network Worker  # P2P WebRTC connections
│   └── Processing Worker # Heavy computations
├── Game Systems        # Interactive components
│   ├── Scenes         # Phaser game scenes
│   ├── Entities       # Game objects and characters
│   └── UI Components  # User interface elements
└── Systems            # Feature modules
    ├── Character      # Player progression
    ├── Network        # Connection management
    └── Authentication # User identity
```

## 🛠️ Tech Stack

### Core Technologies
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **PNPM** - Efficient package management

### Game Engine & Graphics
- **Phaser 3** - 2D game engine with WebGL/Canvas rendering
- **Isometric Graphics** - Advanced 2.5D visual system

### State & Data Management
- **Zustand** - Lightweight state management
- **Dexie.js** - IndexedDB wrapper for local storage
- **Immer** - Immutable state updates

### Networking & Communication
- **PeerJS** - WebRTC peer-to-peer connections
- **Web Workers** - Multi-threaded processing

### Development & Quality
- **Biome** - Fast linting and formatting
- **Vitest** - Next-generation testing framework
- **GitHub Actions** - Continuous integration

## 🚦 Quick Start

### Prerequisites

- Node.js 18+
- PNPM 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/username/project-clockwork.git
cd project-clockwork

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Development Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Lint code
pnpm lint:fix         # Fix linting issues
pnpm format           # Check formatting
pnpm format:fix       # Fix formatting
pnpm typecheck        # Type check
pnpm check            # Run all checks
pnpm check:fix        # Fix all auto-fixable issues

# Testing
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage
```

## 🎮 Usage

### Basic Game Controls
- **WASD** or **Arrow Keys** - Move character
- **ESC** - Open/close main menu
- **E** - Interact with objects
- **I** - Open inventory

### Multiplayer Features
1. **Host Room** - Create a new multiplayer session
2. **Join Room** - Connect to existing session with room ID
3. **Real-time Sync** - All players see each other's movements instantly

### Architecture Integration

The application follows a modular architecture where each system operates independently:

- **Game Core** manages the Phaser 3 integration and rendering
- **State Manager** handles all application state with Zustand
- **Worker Manager** coordinates background processing tasks
- **Network Manager** facilitates P2P connections and data synchronization

## 🔧 Configuration

### Environment Variables

```env
VITE_APP_TITLE=Project Clockwork
VITE_API_BASE_URL=https://api.projectclockwork.dev
VITE_ENABLE_DEBUG=true
```

### Game Configuration

Modify `src/assets/data/gameConfig.json` for gameplay settings:

```json
{
  "game": {
    "maxPlayers": 8,
    "worldSize": { "width": 2000, "height": 2000 }
  },
  "graphics": {
    "enableShadows": true,
    "enableParticles": true
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel --prod
```

### Manual Build

```bash
# Build for production
pnpm build

# The dist/ directory contains the production build
```

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests** - Individual component testing
- **Integration Tests** - System interaction testing
- **Performance Tests** - Load and stress testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Generate coverage report
pnpm test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow the existing code style (enforced by Biome)
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Phaser Community** - For the amazing game engine
- **Vite Team** - For the lightning-fast build tool
- **TypeScript Team** - For making JavaScript development enjoyable
- **WebRTC Community** - For enabling real-time P2P communication

## 📞 Support

- 📧 Email: support@projectclockwork.dev
- 💬 Discord: [Project Clockwork Community](https://discord.gg/projectclockwork)
- 🐛 Issues: [GitHub Issues](https://github.com/username/project-clockwork/issues)
- 📖 Docs: [Documentation](https://docs.projectclockwork.dev)

---

<div align="center">
  <strong>Built with ❤️ by the Project Clockwork Team</strong>
</div>