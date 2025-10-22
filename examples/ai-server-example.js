/**
 * Exemplo de servidor Node.js para integração com AI
 * Este é um exemplo básico usando Express e Server-Sent Events
 *
 * Para usar com a extensão VSCode, configure o serverUrl no comando "Configure AI Assistant"
 *
 * Instalação:
 * npm install express cors
 *
 * Execução:
 * node ai-server-example.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simular configuração de AI
const AI_CONFIG = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2048,
};

// Armazenar conexões SSE ativas
const activeConnections = new Set();

/**
 * Endpoint para Server-Sent Events (streaming)
 */
app.get('/api/ai/stream', (req, res) => {
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Adicionar conexão à lista de conexões ativas
  activeConnections.add(res);

  // Enviar mensagem de conexão
  res.write(
    `data: ${JSON.stringify({
      type: 'metadata',
      content: 'Connected to AI streaming service',
      timestamp: Date.now(),
    })}\n\n`
  );

  // Simular heartbeat a cada 30 segundos
  const heartbeat = setInterval(() => {
    if (!res.destroyed) {
      res.write(
        `data: ${JSON.stringify({
          type: 'metadata',
          content: 'Heartbeat',
          timestamp: Date.now(),
        })}\n\n`
      );
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  // Cleanup quando conexão é fechada
  req.on('close', () => {
    activeConnections.delete(res);
    clearInterval(heartbeat);
  });
});

/**
 * Endpoint para enviar mensagens para AI
 */
app.post('/api/ai/chat', async (req, res) => {
  const { message, context, config } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Simular processamento de AI com streaming
    await simulateAIResponse(message, context, config);

    res.json({
      success: true,
      message: 'Message sent to AI service',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error processing AI request:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      details: error.message,
    });
  }
});

/**
 * Simular resposta de AI com streaming
 */
async function simulateAIResponse(message, context, config) {
  const responseText = `AI Response to: "${message}"\n\nThis is a simulated AI response. In a real implementation, this would be:\n\n1. Sent to an AI service (OpenAI, Claude, etc.)\n2. Streamed back in real-time\n3. Processed and formatted\n\nContext provided: ${JSON.stringify(context || {}, null, 2)}\nConfig: ${JSON.stringify(config || {}, null, 2)}`;

  // Simular streaming da resposta
  const words = responseText.split(' ');
  let currentText = '';

  for (const word of words) {
    currentText += word + ' ';

    // Enviar chunk para todas as conexões ativas
    const chunk = {
      type: 'text',
      content: word + ' ',
      timestamp: Date.now(),
    };

    activeConnections.forEach(res => {
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    });

    // Simular delay entre palavras
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Enviar sinal de fim
  const doneSignal = {
    type: 'done',
    content: 'Response complete',
    timestamp: Date.now(),
  };

  activeConnections.forEach(res => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify(doneSignal)}\n\n`);
    }
  });
}

/**
 * Endpoint para obter status do servidor
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    activeConnections: activeConnections.size,
    timestamp: Date.now(),
    config: AI_CONFIG,
  });
});

/**
 * Endpoint para testar conexão
 */
app.get('/api/test', (req, res) => {
  res.json({
    message: 'AI server is working!',
    timestamp: Date.now(),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 AI Server running on http://localhost:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/api/ai/stream`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/ai/chat`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AI server...');

  // Fechar todas as conexões SSE
  activeConnections.forEach(res => {
    if (!res.destroyed) {
      res.write(
        `data: ${JSON.stringify({
          type: 'metadata',
          content: 'Server shutting down',
          timestamp: Date.now(),
        })}\n\n`
      );
      res.end();
    }
  });

  process.exit(0);
});

/**
 * Exemplo de integração com OpenAI (descomente para usar)
 */
/*
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getOpenAIResponse(message, config) {
  const stream = await openai.chat.completions.create({
    model: config.model || 'gpt-4',
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: config.temperature || 0.7,
    max_tokens: config.maxTokens || 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    
    if (content) {
      const message = {
        type: 'text',
        content: content,
        timestamp: Date.now(),
      };

      activeConnections.forEach(res => {
        if (!res.destroyed) {
          res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
      });
    }
  }

  // Enviar sinal de fim
  const doneSignal = {
    type: 'done',
    content: 'Response complete',
    timestamp: Date.now(),
  };

  activeConnections.forEach(res => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify(doneSignal)}\n\n`);
    }
  });
}
*/
