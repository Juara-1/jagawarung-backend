# Jagawarung Backend API

Backend API for Jagawarung built with Node.js, TypeScript, Express, and Supabase.

## 🌐 Live API

The Backend API is deployed and can be accessed at: **https://jagawarung-backend.onrender.com/**

API documentation is available at: **https://jagawarung-backend.onrender.com/api-docs**

> **Note:** This is deployed on the free tier, so there might be cold starts when the server hasn't been accessed recently. Please be patient during initial requests.

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **Supabase** - Backend as a Service (Database, Auth, Storage)
- **OpenAI-compatible AI (Kolosal AI)** - AI agent with function calling capabilities

## 📁 Project Structure

```
jagawarung-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   └── supabase.ts   # Supabase client setup
│   ├── controllers/      # Request handlers
│   │   ├── agent.controller.ts
│   │   ├── auth.controller.ts
│   │   └── transaction.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── validate.ts   # Validation middleware
│   ├── models/           # TypeScript interfaces/types
│   │   ├── agent.model.ts
│   │   ├── transaction.model.ts
│   │   └── user.model.ts
│   ├── prompts/          # AI prompts
│   │   └── debt-parser.prompt.ts
│   ├── repositories/     # Data access layer
│   │   └── transaction.repository.ts
│   ├── routes/           # API routes
│   │   ├── index.ts      # Main router
│   │   ├── agent.routes.ts
│   │   ├── auth.routes.ts
│   │   └── transaction.routes.ts
│   ├── services/         # Business logic layer
│   │   ├── agent.service.ts
│   │   ├── ai.service.ts
│   │   └── transaction.service.ts
│   ├── tests/            # Test files
│   │   ├── agent.service.unit.test.ts
│   │   ├── setup.ts
│   │   ├── transaction.controller.integration.test.ts
│   │   ├── transaction.schema.unit.test.ts
│   │   ├── transaction.service.unit.test.ts
│   │   ├── integration/  # Integration test setup
│   │   │   ├── helpers.ts
│   │   │   ├── setup.ts
│   │   │   └── testDb.ts
│   │   └── mocks/        # Test mocks
│   │       └── supabase.mock.ts
│   ├── types/            # Custom TypeScript types
│   │   └── index.ts
│   ├── utils/            # Helper functions
│   │   └── response.ts   # API response helpers
│   ├── validators/       # Input validation schemas
│   │   ├── agent.schema.ts
│   │   ├── auth.schema.ts
│   │   └── transaction.schema.ts
│   ├── app.ts            # Express app setup
│   └── index.ts          # Server entry point
├── .env.example          # Environment variables template
├── .gitignore
├── jest.config.ts        # Jest configuration
├── nodemon.json          # Nodemon configuration
├── package.json
├── render.yaml           # Render deployment configuration
├── tsconfig.json         # TypeScript configuration
└── README.md
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase project details:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

Configure AI provider credentials (Kolosal AI - OpenAI-compatible):

- `AI_PROVIDER`: Provider identifier (default: `openai-compatible`)
- `AI_BASE_URL`: Base URL for the AI API (default: Kolosal AI endpoint)
- `AI_API_KEY`: API key for the AI provider
- `AI_MODEL`: Default model (e.g., `gpt-4o-mini`)
- `AI_REQUEST_TIMEOUT_MS`: Optional timeout in ms (default: 30000)

### 3. Configure Testing Environment Variables

For running integration tests safely without affecting production data, configure the test-specific environment variables:

- `SUPABASE_TEST_URL`: Your Supabase test project URL
- `SUPABASE_TEST_ANON_KEY`: Your Supabase test anonymous key
- `SUPABASE_TEST_SERVICE_ROLE_KEY`: Your Supabase test service role key

> **Note:** These variables are used by the test suite to connect to a separate Supabase test project, ensuring that integration tests run in isolation and don't interfere with your production database. This is essential for maintaining data integrity during development and CI/CD processes.

### 4. Create Supabase Tables

Run this SQL in your Supabase SQL Editor.:

> **Note:** Also run this in your test database if you have configured `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, and `SUPABASE_TEST_SERVICE_ROLE_KEY`.


```sql
-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  debtor_name VARCHAR(255),  -- Nullable, unique constraint may be applied
  note TEXT,                 -- Nullable
  type VARCHAR(20) NOT NULL CHECK (type IN ('spending', 'earning', 'debts')),
  nominal NUMERIC NOT NULL,
  invoice_data JSONB,        -- Nullable
  invoice_url TEXT,          -- Nullable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, uncomment if needed)
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_debtor_name ON transactions(debtor_name) WHERE debtor_name IS NOT NULL;

-- Policy examples (uncomment and modify if RLS is enabled)
-- Policy: Users can view all transactions
-- CREATE POLICY "Transactions are viewable by everyone"
--   ON transactions FOR SELECT
--   USING (true);

-- Policy: Authenticated users can insert transactions
-- CREATE POLICY "Authenticated users can insert transactions"
--   ON transactions FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update transactions
-- CREATE POLICY "Authenticated users can update transactions"
--   ON transactions FOR UPDATE
--   USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete transactions
-- CREATE POLICY "Authenticated users can delete transactions"
--   ON transactions FOR DELETE
--   USING (auth.uid() IS NOT NULL);
```

### 5. Run the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 6. Test the API

Visit `http://localhost:3000/health` to check if the server is running.

You can also access the auto-generated API documentation at `http://localhost:3000/api-docs` to explore all available endpoints with detailed descriptions and examples.



## Coverage Reporting
<img width="1919" height="729" alt="image" src="https://github.com/user-attachments/assets/dd4c00ae-1d91-42fe-9764-a0b2e24ed7f1" />


## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Runs all tests
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:unit` - Runs unit tests only
- `npm run test:integration` - Runs integration tests only (requires test environment variables)
- `npm run test:integration:watch` - Runs integration tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:integration:coverage` - Generate coverage for integration tests

## 🔌 API Endpoints

### Health Check

- `GET /health` - Check server status

### Authentication

- `POST /api/auth/login` - User login

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### AI Agent

- `POST /api/agent/transactions` - Send a prompt to the AI agent with function calling capabilities for database operations related to transactions

## 🔐 Authentication

Protected routes require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

## 📦 Adding New Features

1. Create model interface in `src/models/` (TypeScript interfaces)
2. Create repository for data access in `src/repositories/`
3. Create service for business logic in `src/services/`
4. Create controller with JSDoc comments in `src/controllers/`
5. Create routes in `src/routes/`
6. Register routes in `src/routes/index.ts`
7. Add authentication middleware if needed
8. Create validation schema in `src/validators/` if needed

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC
