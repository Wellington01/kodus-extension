# Integração com Agentes de AI - Kodus Extension

Este documento explica como usar e configurar a integração com agentes de AI na extensão Kodus.

## 🚀 Visão Geral

A extensão implementa um sistema robusto de streaming para integração com agentes de AI, oferecendo:

- **Server-Sent Events (SSE)** para streaming em tempo real
- **WebSocket** para comunicação bidirecional
- **Fetch com ReadableStream** para streaming simples
- **Reconexão automática** com backoff exponencial
- **Interface webview** integrada para chat AI
- **Análise de código** com AI

## 📋 Melhores Práticas Implementadas

### 1. **Server-Sent Events (SSE) - Recomendado para AI**

```typescript
// Configuração automática de SSE
const eventSource = new EventSource('/api/ai/stream');
eventSource.onmessage = event => {
  const data = JSON.parse(event.data);
  // Processar dados em tempo real
};
```

**Vantagens:**

- ✅ Ideal para streaming de texto (perfeito para AI)
- ✅ Reconexão automática nativa
- ✅ Baixa latência
- ✅ Compatível com proxies e firewalls

### 2. **Gerenciamento de Conexões**

```typescript
// Múltiplas conexões AI simultâneas
const aiManager = new AIManager(context);
const provider1 = aiManager.createProvider('chat', config1);
const provider2 = aiManager.createProvider('analysis', config2);
```

### 3. **Tratamento de Erros Robusto**

```typescript
// Reconexão automática com backoff exponencial
private attemptReconnect(): void {
  const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
  setTimeout(() => this.connect(), delay);
}
```

## 🛠️ Como Usar

### 1. **Configurar AI Assistant**

1. Abra o Command Palette (`Ctrl+Shift+P`)
2. Execute `Kodus: Configure AI Assistant`
3. Configure:
   - **Server URL**: URL do seu servidor AI
   - **API Key**: Chave de autenticação (opcional)
   - **Model**: Modelo AI a usar (gpt-4, gpt-3.5-turbo, etc.)
   - **Temperature**: Criatividade (0.0 - 1.0)
   - **Max Tokens**: Tamanho máximo da resposta

### 2. **Iniciar Chat AI**

1. Execute `Kodus: Start AI Chat`
2. Uma nova aba será aberta com interface de chat
3. Digite sua mensagem e pressione Enter
4. A resposta será streamada em tempo real

### 3. **Analisar Código**

1. Selecione código no editor
2. Execute `Kodus: Analyze Code with AI`
3. Escolha o tipo de análise:
   - Code Review
   - Bug Detection
   - Performance Analysis
   - Security Review
   - Documentation Generation

## 🔧 Implementação do Servidor

### Exemplo Básico (Node.js + Express)

```javascript
const express = require('express');
const app = express();

// Endpoint SSE para streaming
app.get('/api/ai/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Simular streaming de AI
  const streamAIResponse = async () => {
    const response = 'Esta é uma resposta simulada do AI...';

    for (const word of response.split(' ')) {
      res.write(
        `data: ${JSON.stringify({
          type: 'text',
          content: word + ' ',
          timestamp: Date.now(),
        })}\n\n`
      );

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        content: 'Response complete',
        timestamp: Date.now(),
      })}\n\n`
    );
  };

  streamAIResponse();
});

// Endpoint para enviar mensagens
app.post('/api/ai/chat', (req, res) => {
  const { message } = req.body;
  // Processar mensagem e iniciar streaming
  res.json({ success: true });
});
```

### Integração com OpenAI

```javascript
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function streamOpenAIResponse(message) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';

    if (content) {
      // Enviar chunk via SSE
      res.write(
        `data: ${JSON.stringify({
          type: 'text',
          content: content,
          timestamp: Date.now(),
        })}\n\n`
      );
    }
  }
}
```

## 📡 Formatos de Mensagem

### Mensagens SSE

```typescript
interface AIStreamMessage {
  type: 'text' | 'error' | 'done' | 'metadata';
  content: string;
  timestamp: number;
  id?: string;
}
```

### Exemplos de Mensagens

```json
// Chunk de texto
{
  "type": "text",
  "content": "Olá, como posso ajudar?",
  "timestamp": 1703123456789
}

// Sinal de fim
{
  "type": "done",
  "content": "Response complete",
  "timestamp": 1703123456790
}

// Erro
{
  "type": "error",
  "content": "Connection failed",
  "timestamp": 1703123456791
}

// Metadados
{
  "type": "metadata",
  "content": "Connected to AI service",
  "timestamp": 1703123456792
}
```

## 🔒 Segurança

### 1. **Validação de Input**

```typescript
// Validar entrada do usuário
const validateMessage = (message: string): boolean => {
  return message.length > 0 && message.length < 10000;
};
```

### 2. **Autenticação**

```typescript
// Headers de autenticação
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}
```

### 3. **Rate Limiting**

```typescript
// Implementar rate limiting no servidor
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
});
```

## 📊 Performance

### 1. **Otimizações Implementadas**

- **Lazy Loading**: Carrega componentes apenas quando necessário
- **Debouncing**: Evita múltiplas requisições simultâneas
- **Connection Pooling**: Reutiliza conexões quando possível
- **Memory Management**: Cleanup automático de recursos

### 2. **Métricas Recomendadas**

```typescript
// Monitorar performance
const metrics = {
  connectionTime: Date.now() - startTime,
  messagesPerSecond: messageCount / duration,
  errorRate: errorCount / totalRequests,
  memoryUsage: process.memoryUsage(),
};
```

## 🧪 Testando

### 1. **Servidor de Exemplo**

Execute o servidor de exemplo incluído:

```bash
cd examples
node ai-server-example.js
```

### 2. **Testar Conexão**

```bash
curl http://localhost:3000/api/test
curl http://localhost:3000/api/status
```

### 3. **Testar Streaming**

```bash
curl -N http://localhost:3000/api/ai/stream
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Conexão Recusada**
   - Verifique se o servidor está rodando
   - Confirme a URL no comando "Configure AI Assistant"

2. **Streaming Não Funciona**
   - Verifique headers CORS no servidor
   - Confirme formato das mensagens SSE

3. **Erro de Autenticação**
   - Verifique API key no comando de configuração
   - Confirme permissões no servidor

4. **Performance Lenta**
   - Reduza tamanho dos chunks
   - Implemente compression
   - Use CDN se necessário

### Logs de Debug

```typescript
// Habilitar logs detalhados
console.log('AI Stream connected');
console.log('Message received:', data);
console.log('Reconnection attempt:', this.reconnectAttempts);
```

## 🔮 Próximos Passos

1. **Integração com Claude/Anthropic**
2. **Suporte a múltiplos modelos**
3. **Cache de conversas**
4. **Análise de código em tempo real**
5. **Integração com GitHub Copilot**

## 📚 Recursos Adicionais

- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [WebSocket vs SSE](https://stackoverflow.com/questions/5195452/websockets-vs-server-sent-events-eventsource)

---

**Nota**: Esta implementação segue as melhores práticas para extensões VSCode e garante máxima performance e confiabilidade para integração com agentes de AI.
