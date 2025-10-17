# Testing Documentation

This document provides comprehensive information about the testing setup and practices for this project.

## Overview

This project uses **Vitest** as the testing framework, which is the recommended testing solution for Vite-based projects. The test suite includes unit tests, integration tests, and mocking strategies for external dependencies.

## Test Setup

### Testing Framework
- **Vitest**: Fast unit test framework with native ESM support
- **jsdom**: DOM environment for testing browser-specific code
- **@vitest/ui**: Optional UI for test visualization

### Configuration Files
- `vitest.config.ts` - Vitest configuration
- `src/test/setup.ts` - Global test setup and mocks

## Running Tests

### NPM Scripts

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Watch Mode
By default, `npm test` runs Vitest in watch mode, which:
- Re-runs tests when files change
- Provides an interactive CLI
- Shows only failed tests after first run

## Test Structure

### File Organization

Tests are co-located with source files using the `.test.ts` or `.test.tsx` extension: