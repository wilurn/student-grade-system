# Student Grade Management System

A React TypeScript application built with Clean Architecture principles for managing student grades and grade correction requests.

## Architecture

This project follows Clean Architecture with the following structure:

```
src/
├── entities/           # Business entities and domain models
├── usecases/          # Application business rules and use cases
├── adapters/          # Interface adapters (controllers, presenters)
│   ├── controllers/   # React hooks and state management
│   ├── presenters/    # View models and data transformation
│   └── gateways/      # API interfaces and implementations
├── frameworks/        # External frameworks and drivers
│   ├── web/          # React components and UI
│   ├── api/          # HTTP client and API implementations
│   └── storage/      # Local storage and session management
└── shared/           # Shared utilities and constants
```

## Available Scripts

- `npm start` - Starts the development server
- `npm run build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run lint` - Runs ESLint
- `npm run lint:fix` - Fixes ESLint issues automatically
- `npm run format` - Formats code with Prettier
- `npm run format:check` - Checks code formatting

## Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Run tests: `npm test`

## Code Quality

This project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Jest and React Testing Library for testing