[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19676199&assignment_repo_type=AssignmentRepo)

# Team Streams - Anime Streaming Platform

## 🧪 Automated Testing

This project includes automated testing for all active features:

### Quick Start
```bash
# Install dependencies
npm install

# Run all automated tests
npm run test:automated

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests  
npm run test:api         # API tests
```

### Features Tested
- **Gemini AI API** - Chatbot functionality
- **Trace.moe API** - Anime image recognition  
- **MyAnimeList (MAL) API** - Anime database integration
- **Jikan API** - Alternative anime database

Tests run automatically on GitHub Actions for every push and pull request.

For detailed testing information, see [TESTING.md](./TESTING.md)
