import express, { Application } from 'express';
import cors from 'cors';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app: Application = express();

// Swagger configuration
const swaggerOptions = {
  info: {
    version: '1.0.0',
    title: 'Jagawarung API',
    description: `Backend API for Jagawarung using Node.js, TypeScript, Express, and Supabase.

## 🔐 Authentication

Some endpoints require authentication. Follow these steps to test protected endpoints:

### Step 1: Login to get a token
Call \`POST /api/auth/login\` with the test credentials:
\`\`\`json
{
  "email": "jagawarung@gmail.com",
  "password": "12345678"
}
\`\`\`

### Step 2: Authorize in Swagger
1. Copy the \`access_token\` from the login response
2. Click the **Authorize** button (🔓) below
3. Enter the token in the format: \`<your_access_token>\`
4. Click **Authorize**

Now you can call protected endpoints like \`POST /api/agent/transactions\`.

> **Note:** Tokens expire after 1 hour. If you get a 401 error, login again to get a new token.
`,
    license: {
      name: 'ISC',
    },
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  baseDir: __dirname,
  filesPattern: ['./**/*.ts', './**/*.js'],
  swaggerUIPath: '/api-docs',
  exposeSwaggerUI: true,
  exposeApiDocs: true,
  apiDocsPath: '/api-docs.json',
};

// Initialize Swagger
expressJSDocSwagger(app)(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
/**
 * GET /health
 * @summary Health check endpoint
 * @tags System
 * @return {object} 200 - success response
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

export default app;
