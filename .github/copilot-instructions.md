# Jagawarung Backend - AI Assistant Instructions

## Architecture Overview
This is a Node.js/TypeScript REST API using Express and Supabase as the backend database. The project follows a clean layered architecture pattern with clear separation of concerns.

### Key Components
- **Supabase Integration**: Uses two clients - `supabase` (RLS-enabled) and `supabaseAdmin` (bypasses RLS)
- **Authentication**: JWT-based using Supabase auth tokens with Bearer scheme
- **API Documentation**: Auto-generated Swagger docs at `/api-docs` using JSDoc comments
- **Error Handling**: Custom `AppError` class with centralized error handler middleware

### Project Structure
```
src/
├── config/          # Environment and service configuration
├── controllers/     # Request handlers with JSDoc for Swagger (agent, transaction)
├── middleware/      # Auth, error handling, validation, 404 handlers
├── models/          # TypeScript interfaces and DTOs (transaction, user)
├── repositories/    # Data access layer for database operations
├── routes/          # Express route definitions (agent, transaction)
├── services/        # Business logic layer (ai, mcp, transaction)
├── tests/           # Unit and integration tests with separate folders
├── types/           # Shared TypeScript type definitions
├── utils/           # Helper functions (response formatting)
└── validators/      # Input validation schemas using Zod
```

## Development Workflow

### Testing Commands
- `npm test` - Runs all tests
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:unit` - Runs unit tests only
- `npm run test:integration` - Runs integration tests only
- `npm run test:integration:watch` - Runs integration tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:integration:coverage` - Generate coverage for integration tests

### Test Configuration
- Unit tests: `**/*.unit.test.ts` files (e.g., transaction.service.unit.test.ts)
- Integration tests: `**/*.integration.test.ts` files (e.g., transaction.controller.integration.test.ts)
- Test setup: Separate setup files in tests/ and tests/integration/ directories
- Test mocks: Located in tests/mocks/ directory
- Test database: Uses separate SUPABASE_TEST_* env vars if available
- Test timeouts: Configured in Jest setup files

### Development Server
- `npm run dev` - Starts with nodemon and ts-node
- Server runs on `http://localhost:3000`
- Health check at `/health`

## Coding Patterns

### Controller Pattern
```typescript
// Use JSDoc for Swagger documentation
/**
 * GET /api/resource
 * @summary Get resource
 * @tags ResourceName
 * @return {ResourceType} 200 - Success
 */
export const getResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation
    if (!param) throw new AppError('Missing param', 400);
    
    // Supabase operation
    const { data, error } = await supabase.from('table').select('*');
    
    // Response
    sendSuccess(res, data, 'Success message');
  } catch (error) {
    next(error);
  }
};
```

### Database Operations
- Use `supabase` client for user-specific operations (respects RLS)
- Use `supabaseAdmin` client for admin operations (bypasses RLS)
- Handle Supabase errors appropriately (PGRST116 = not found)
- Use `.upsert()` with `onConflict` for unique constraints

### Authentication
- Protected routes require `Authorization: Bearer <token>` header
- Use `authenticate` middleware to validate tokens
- Access user info via `req.user` (extends Request interface)

### Response Format
```typescript
// Success: { success: true, message: string, data: T }
sendSuccess(res, data, message, statusCode);

// Error: { success: false, error: string }
sendError(res, message, statusCode);
```

## Adding New Features

1. Create model interface in `src/models/`
2. Create repository for data access in `src/repositories/`
3. Create service for business logic in `src/services/`
4. Create controller with JSDoc comments in `src/controllers/`
5. Create routes in `src/routes/`
6. Register routes in `src/routes/index.ts`
7. Add authentication middleware if needed
8. Create validation schema in `src/validators/` if needed

## Environment Configuration
- Main config: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Test config: `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, `SUPABASE_TEST_SERVICE_ROLE_KEY`
- Always validate required env vars in config files

## GitHub Projects Default Configuration

When creating new tasks in GitHub Projects, use these default settings unless specified otherwise:
- **Repository**: `jagawarung-backend`
- **Project**: `Warung`
- **Assignee**: `daffaalex22`

## Git Commit Message Standards

When creating git commits, use professional commit messages following these guidelines:

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples
- `feat(auth): add JWT token validation middleware`
- `fix(debts): handle null values in upsert operation`
- `docs(api): update Swagger documentation for debt endpoints`
- `test(unit): add tests for response utility functions`
- `refactor(config): extract Supabase client initialization`

### Best Practices
- Use present tense: "add" not "added"
- Keep description under 50 characters
- Include scope when applicable
- Reference issue numbers in footer: `Closes #123`