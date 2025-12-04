import dotenv from 'dotenv';
import app from './app';
import { config } from './config';

// Load environment variables
dotenv.config();

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
