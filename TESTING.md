# Testing Guide

## 🧪 Automated Test Suite

This project includes automated testing for all active features:

### Quick Start
```bash
# Run all automated tests
npm run test:automated

# Run specific test categories
npm run test:unit        # Unit tests for APIs
npm run test:integration # Integration tests
npm run test:api         # External API tests
npm run test:coverage    # Generate coverage report
```

### Features Tested
- **Gemini AI API** - Chatbot functionality
- **MyAnimeList (MAL) API** - Anime database search
- **Trace.moe API** - Anime image recognition

### Environment Setup
Environment variables are automatically loaded from `backend/.env`:
- `MAL_CLIENT_ID` - MyAnimeList API client ID
- `GEMINI_API_KEY` - Google Gemini AI API key

### CI/CD Integration
Tests run automatically on GitHub Actions when code is pushed or pull requests are created.
