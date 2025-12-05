# Jagawarung Backend API

Backend API for Jagawarung built with Node.js, TypeScript, Express, and Supabase.

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **Supabase** - Backend as a Service (Database, Auth, Storage)
- **OpenAI-compatible AI + MCP** - AI agent endpoint plus Supabase MCP tool invocations

## 📁 Project Structure

```
jagawarung-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   └── supabase.ts   # Supabase client setup
│   ├── controllers/      # Request handlers
│   │   └── example.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── models/           # TypeScript interfaces/types
│   │   ├── example.model.ts
│   │   └── user.model.ts
│   ├── routes/           # API routes
│   │   ├── index.ts      # Main router
│   │   └── example.routes.ts
│   ├── types/            # Custom TypeScript types
│   │   └── index.ts
│   ├── utils/            # Helper functions
│   │   └── response.ts   # API response helpers
│   ├── app.ts            # Express app setup
│   └── index.ts          # Server entry point
├── .env.example          # Environment variables template
├── .gitignore
├── nodemon.json          # Nodemon configuration
├── package.json
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

Configure AI provider credentials (OpenAI-compatible by default):
- `AI_PROVIDER`: Provider identifier (default: `openai-compatible`)
- `AI_BASE_URL`: Base URL for the AI API (default: `https://api.openai.com/v1`)
- `AI_API_KEY`: API key for the AI provider
- `AI_MODEL`: Default model (e.g., `gpt-4o-mini`)
- `AI_REQUEST_TIMEOUT_MS`: Optional timeout in ms (default: 30000)

Optional MCP client settings:
- `MCP_SERVER_URL`: Supabase MCP server endpoint (e.g. `https://mcp.supabase.com/mcp?project_ref=...`)
- `MCP_API_KEY`: Bearer token for the MCP server

### 3. Create Supabase Table (Example)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create examples table
CREATE TABLE examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE examples ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all examples
CREATE POLICY "Examples are viewable by everyone"
  ON examples FOR SELECT
  USING (true);

-- Policy: Users can insert their own examples
CREATE POLICY "Users can insert their own examples"
  ON examples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own examples
CREATE POLICY "Users can update their own examples"
  ON examples FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own examples
CREATE POLICY "Users can delete their own examples"
  ON examples FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Run the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Test the API

Visit `http://localhost:3000/health` to check if the server is running.

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests (not configured yet)

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check server status

### Examples (Template)
- `GET /api/examples` - Get all examples
- `GET /api/examples/:id` - Get example by ID
- `POST /api/examples` - Create new example (requires auth)
- `PUT /api/examples/:id` - Update example (requires auth)
- `DELETE /api/examples/:id` - Delete example (requires auth)

### AI Agent
- `POST /api/agent` - Send a prompt to the AI agent, or set `useMcp=true` with `toolName` to call Supabase MCP tools

## 🔐 Authentication

Protected routes require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

## 📦 Adding New Routes

1. Create a model in `src/models/` (TypeScript interfaces)
2. Create a controller in `src/controllers/` (business logic)
3. Create routes in `src/routes/` (endpoint definitions)
4. Register routes in `src/routes/index.ts`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC
