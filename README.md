[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19676199&assignment_repo_type=AssignmentRepo)

# Team Streams - Anime Streaming Platform

A modern web application for anime discovery, featuring AI-powered recommendations, reverse image search, and comprehensive anime database integration.

## Local Development Setup

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (usually comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

### API Requirements

This application integrates with multiple external APIs. For full functionality, you'll need:

1. **Gemini AI API** (Google) - For AI chatbot functionality
2. **MyAnimeList API** - For anime database access and search
3. **TraceMoe API** - For reverse image search (no API key required)

See the Environment Configuration section below for setup instructions.

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/CMPT-276-SUMMER-2025/final-project-10-streams.git
cd final-project-10-streams
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Environment Configuration
Create a `.env` file in the `backend/` directory for API keys:
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Then edit backend/.env with your actual API keys
```

**Required environment variables:**
```bash
# backend/.env
# Gemini AI API (for chatbot functionality)
GEMINI_API_KEY=your_gemini_api_key_here

# MyAnimeList (MAL) API credentials
MAL_CLIENT_ID=your_mal_client_id_here
MAL_CLIENT_SECRET=your_mal_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/callback

# Server configuration
PORT=3000
NODE_ENV=development
```

> **Important**: To test the full functionality locally, you'll need API credentials:
> 
> **Gemini AI API**:
> 1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
> 2. Create a new API key
> 3. Add it as `GEMINI_API_KEY` in your `.env` file
> 
> **MyAnimeList API**:
> 1. Visit [MAL API Documentation](https://myanimelist.net/apiconfig)
> 2. Create a new client application
> 3. Set redirect URI to `http://localhost:3000/auth/callback`
> 4. Add the Client ID and Client Secret to your `.env` file
> 
> **Note**: The application will run without API keys but with limited functionality:
> - Basic UI and navigation will work
> - AI chatbot will not function (requires Gemini API)
> - Anime search and recommendations will not work (requires MAL API)
> - TraceMoe image recognition will work (no API key required)

#### 4. Start the Application

```bash
# Terminal 1: Start the backend server
cd backend
npm start

# Terminal 2: Serve the frontend
cd public
python3 -m http.server 8000

# Or using Node.js (if you have http-server installed)
# From project root:
npx http-server public -p 8000

# Or using any local server of your choice
```

#### 5. Access the Application
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3000
- **Main Pages**:
  - Homepage: http://localhost:8000/index.html
  - Search: http://localhost:8000/search.html
  - Recommendations: http://localhost:8000/recommendations.html
  - AI Chatbot: http://localhost:8000/chatbot.html
  - Image Recognition: http://localhost:8000/tracemoe.html

### Testing & Quality Assurance

#### Run All Tests
```bash
# Comprehensive test suite (24 tests)
npm run test:automated

# Individual test categories
npm run test:unit        # Unit tests
npm run test:integration # Integration tests  
npm run test:api         # API endpoint tests
npm run test:security    # Security implementation tests
npm run test:coverage    # Generate coverage report
```

#### Testing Without API Keys
If you don't have API keys configured, some tests may fail. To run tests that don't require external APIs:
```bash
# Run only unit tests (no API calls)
npm run test:unit

# Skip API-dependent tests
npm test -- --testPathIgnorePatterns="integration|api"
```

#### Verify Installation
```bash
# Check if all systems are working
npm test
```

### Project Architecture

```
final-project-10-streams/
├── backend/              # Express.js API server
│   ├── index.js         # Main server file
│   └── package.json     # Backend dependencies
├── public/              # Frontend application
│   ├── *.html          # Main pages
│   ├── *.js            # Client-side logic
│   └── css/            # Stylesheets
├── tests/              # Comprehensive test suite
├── netlify/functions/  # Serverless functions (for deployment)
└── package.json        # Root dependencies & scripts
```

### Development Workflow

1. **Start Development Servers** (both frontend and backend)
2. **Make Changes** to files in `public/` or `backend/`
3. **Test Changes** using `npm test`
4. **Refresh Browser** to see frontend changes
5. **Restart Backend** only if you modify `backend/index.js`

### Troubleshooting

**Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000  
lsof -ti:8000 | xargs kill -9
```

**Dependencies Issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
cd backend && npm install
```

**Test Failures:**
```bash
# Check if servers are running first
npm run test:automated
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start backend server |
| `npm test` | Run all tests |
| `npm run test:automated` | Run comprehensive test suite |
| `npm run test:coverage` | Generate test coverage report |
| `npm run dev` | Start backend in development mode |

### Production Deployment

The application is configured for deployment on:
- **Frontend**: Netlify (static hosting)
- **Backend**: Any Node.js hosting provider
- **Functions**: Netlify serverless functions

For local production testing:
```bash
# Build and serve production version
NODE_ENV=production npm start
```

## Live Demo & Resources

### Features Tested
- **Gemini AI API** - Chatbot functionality with secure backend proxy
- **TraceMoe API** - Anime reverse image recognition  
- **MyAnimeList (MAL) API** - Comprehensive anime database integration
- **Security Implementation** - API key protection and validation
- **Integration Testing** - End-to-end functionality verification

Tests run automatically on GitHub Actions for every push and pull request.
**Test Coverage**: 24/24 tests passing (100% success rate)

### Demo Videos
- [M1 Presentation](https://www.youtube.com/watch?v=2dFGk3fwoT0&t=110s) - Project overview and features
- [Live Demo](https://streamable.com/4pyrbh) - Application walkthrough

### Live Application
**Production Site**: [yomiru.netlify.app](https://yomiru.netlify.app/)

### Project Documentation
- [Group Contract](https://github.com/CMPT-276-SUMMER-2025/final-project-10-streams/blob/main/Group%20contract.pdf)
- [Milestone 0 Report](https://github.com/CMPT-276-SUMMER-2025/final-project-10-streams/blob/main/Team%20Streams%20-%20m0.pdf)
- [Milestone 1 Report](http://github.com/CMPT-276-SUMMER-2025/final-project-10-streams/blob/main/Team%20Streams%20m1.docx)
- [Milestone 2 Report](https://docs.google.com/document/d/1DvMWMZZ4MqAJCzHzd5JXLDWJVGOgFi7IUdgWMG7PAts/edit?tab=t.0)
- [Testing Documentation](./TESTING.md) - Detailed testing information
- [Project Structure](./PROJECT_STRUCTURE.md) - Repository organization guide

---

**Built with ❤️ by Team Streams** | **Node.js • Express.js • Vanilla JavaScript • Modern Web APIs**

