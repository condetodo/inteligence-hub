import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { instancesRoutes } from './routes/instances.routes';
import { brandVoiceRoutes } from './routes/brandVoice.routes';
import { inputsRoutes } from './routes/inputs.routes';
import { contentRoutes } from './routes/content.routes';
import { insightsRoutes } from './routes/insights.routes';
import { corpusRoutes } from './routes/corpus.routes';
import { processingRoutes } from './routes/processing.routes';
import { startScheduler } from './scheduler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      hasAnthropicKey: !!env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 5,
      anthropicKeyPrefix: env.ANTHROPIC_API_KEY?.substring(0, 10) + '...',
      hasGoogleKey: !!env.GOOGLE_AI_API_KEY && env.GOOGLE_AI_API_KEY.length > 5,
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instances', instancesRoutes);
app.use('/api/instances', brandVoiceRoutes);
app.use('/api/instances', inputsRoutes);
app.use('/api/instances', contentRoutes);
app.use('/api/instances', insightsRoutes);
app.use('/api/instances', corpusRoutes);
app.use('/api/instances', processingRoutes);

// Error handler (must be last)
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
  app.listen(Number(env.PORT), () => {
    console.log(`Intelligence Hub API running on port ${env.PORT}`);
    startScheduler();
  });
}

export { app };
