# Jagawarung Backend - AI Assistant Instructions

## Architecture Overview
This is a Node.js/TypeScript REST API using Express and Supabase as the backend database. The project follows a clean MVC pattern with clear separation of concerns.

### Key Components
- **Supabase Integration**: Uses two clients - `supabase` (RLS-enabled) and `supabaseAdmin` (bypasses RLS)
- **Authentication**: JWT-based using Supabase auth tokens with Bearer scheme
- **API Documentation**: Auto-generated Swagger docs at `/api-docs` using JSDoc comments
- **Error Handling**: Custom `AppError` class with centralized error handler middleware

### Project Structure
```
src/
├── config/          # Environment and service configuration
├── controllers/     # Request handlers with JSDoc for Swagger
├── middleware/      # Auth, error handling, 404 handlers
├── models/          # TypeScript interfaces and DTOs
├── routes/          # Express route definitions
├── tests/           # Separate unit and integration test setups
└── utils/           # Helper functions (response formatting)
```

## Development Workflow

### Testing Commands
- `npm test` - Runs all tests (currently only integration tests work)
- `npm run test:unit` - Should run unit tests (needs fixing)
- `npm run test:integration` - Runs integration tests
- `npm run test:coverage` - Generate coverage report

### Test Configuration
- Unit tests: `**/*.unit.test.ts` files
- Integration tests: `**/*.integration.test.ts` files
- Test database: Uses separate SUPABASE_TEST_* env vars if available
- Test timeouts: 10s for unit, 30s for integration

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
2. Create controller with JSDoc comments in `src/controllers/`
3. Create routes in `src/routes/`
4. Register routes in `src/routes/index.ts`
5. Add authentication middleware if needed

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