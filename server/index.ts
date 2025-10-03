import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading environment from:', envPath);

// Import the router after environment is loaded
const insightsRouter = (await import('./api/ai/insights.js')).default;
const growthRecordsRouter = (await import('./api/growthRecords.js')).default;
const growthStagesRouter = (await import('./api/growthStages.js')).default;
const uploadRouter = (await import('./api/upload.js')).default;

// Log environment variables for debugging
console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? '***' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY ? '***' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***' : 'Not set');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY ? '***' : 'Not set');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication middleware
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    
    // Attach user to the request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next();
  }
});

// API Routes
app.use('/api/ai/insights', insightsRouter);
app.use('/api/growth/records', growthRecordsRouter);
app.use('/api/growth/stages', growthStagesRouter);
app.use('/api/upload', uploadRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
