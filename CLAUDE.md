# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack yoga application with an Angular frontend and Spring Boot backend, built as part of OpenClassrooms testing curriculum. The project demonstrates comprehensive testing practices including unit tests, integration tests, and end-to-end testing.

## Architecture

### Backend (Spring Boot)
- **Location**: `back/` directory
- **Framework**: Spring Boot 2.6.1 with Java 8
- **Key Components**:
  - Controllers: Authentication, Sessions, Teachers, Users
  - Services: Business logic for session, teacher, and user management
  - Security: JWT-based authentication with Spring Security
  - Data: JPA entities and repositories with MySQL
  - Testing: JaCoCo for code coverage (90% minimum)

### Frontend (Angular)
- **Location**: `front/` directory
- **Framework**: Angular 14 with Material Design
- **Key Components**:
  - Feature modules: Auth (login/register), Sessions (CRUD operations)
  - Guards: Authentication and route protection
  - Services: API communication and state management
  - Testing: Jest for unit tests, Cypress for E2E tests

## Common Development Commands

### Backend Development
```bash
# Run from back/ directory
mvn clean test                    # Run tests with JaCoCo coverage report
mvn spring-boot:run              # Start the backend server
mvn clean compile               # Compile the project
```

### Frontend Development
```bash
# Run from front/ directory
npm install                     # Install dependencies
npm run start                   # Start development server (port 4200)
npm run test                    # Run Jest unit tests
npm run test:watch             # Run tests in watch mode
npm run lint                   # Run ESLint
npm run e2e                    # Run Cypress E2E tests
npm run e2e:coverage          # Generate E2E coverage report
npm run cypress:open          # Open Cypress test runner
npm run cypress:run           # Run Cypress tests headlessly
```

## Testing Strategy

### Coverage Requirements
- **Backend**: 90% line coverage enforced by JaCoCo
- **Frontend**: 80% statement coverage configured in Jest

### Test Types
- **Unit Tests**: Jest (frontend), JUnit (backend)
- **Integration Tests**: Spring Boot Test slices
- **E2E Tests**: Cypress with code coverage instrumentation

## Database Setup

- **Database**: MySQL
- **Schema**: Available at `ressources/sql/script.sql`
- **Default Admin**: yoga@studio.com / test!1234

## Key Configuration Files

- `back/pom.xml`: Maven configuration with testing plugins
- `front/package.json`: NPM scripts and dependencies
- `front/jest.config.js`: Jest testing configuration
- `front/cypress.config.ts`: Cypress E2E configuration
- `front/proxy.config.json`: API proxy for development

## Development Notes

- The project uses MapStruct for entity-DTO mapping in the backend
- Frontend uses Angular Material with flex-layout for responsive design
- JWT tokens are used for stateless authentication
- Both frontend and backend have comprehensive test suites with coverage reporting