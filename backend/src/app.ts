import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health & welcome
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to RecoverAI Revenue Recovery Platform API',
    status: 'UP',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api', routes);

// 404 and Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
