const { Queue, Worker, QueueEvents } = require('bullmq');
const Anthropic = require('@anthropic-ai/sdk');
const { getRedis } = require('../config/redis');

const QUEUE_NAME = 'ai-processing';
let aiQueue = null;
let aiWorker = null;

function initAIQueue() {
  const redis = getRedis();
  if (!redis) {
    console.warn('⚠️  Redis not available — AI queue disabled, using direct processing');
    return;
  }

  const connection = { host: redis.options?.host || 'localhost', port: redis.options?.port || 6379 };

  aiQueue = new Queue(QUEUE_NAME, { connection });

  aiWorker = new Worker(QUEUE_NAME, async (job) => {
    const { type, text, options = {} } = job.data;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompts = {
      'fix-grammar': `Fix grammar, punctuation and clarity. Preserve author voice. Return ONLY the corrected text:\n\n${text}`,
      'rewrite': `Rewrite with improved flow and vivid language. Same meaning, better prose. Return ONLY the rewritten text:\n\n${text}`,
      'continue': `Continue this passage naturally for ${options.paragraphs || 2} paragraph(s). Match the tone exactly:\n\n${text}`,
      'summarize': `Summarize in 2-4 sentences covering key events, character actions, mood:\n\n${text}`,
      'expand': `Expand this into richly detailed prose with sensory details and depth:\n\n${text}`,
      'simplify': `Simplify to a ${options.readingLevel || 'general'} reading level. Preserve meaning:\n\n${text}`,
    };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'You are an expert AI writing assistant. Return only the requested output — no commentary.',
      messages: [{ role: 'user', content: prompts[type] || text }],
    });

    return { result: message.content[0].text, usage: message.usage };
  }, { connection, concurrency: 3 });

  aiWorker.on('failed', (job, err) => {
    console.error(`AI job ${job.id} failed:`, err.message);
  });

  console.log('✅ AI processing queue initialized');
}

async function enqueueAIJob(type, text, options = {}) {
  if (!aiQueue) {
    // Fallback: direct processing
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: text }],
    });
    return { result: message.content[0].text };
  }

  const job = await aiQueue.add(type, { type, text, options }, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  return job.waitUntilFinished(new QueueEvents(QUEUE_NAME, {
    connection: aiQueue.opts.connection,
  }), 30000);
}

module.exports = { initAIQueue, enqueueAIJob };
