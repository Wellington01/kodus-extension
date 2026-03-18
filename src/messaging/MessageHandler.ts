import { WebviewMessage, MessageHandlerFunction } from './types';

export class MessageHandler {
  private handlers = new Map<string, MessageHandlerFunction>();

  register(command: string, handler: MessageHandlerFunction): void {
    this.handlers.set(command, handler);
  }

  async handleMessage(message: WebviewMessage): Promise<any> {
    const handler = this.handlers.get(message.command);

    if (!handler) {
      console.warn(`No handler registered for command: ${message.command}`);
      return;
    }

    try {
      // Pass data if exists, else pass the whole message for backwards compatibility
      return await handler(message.data !== undefined ? message.data : message);
    } catch (error: any) {
      throw new Error(
        `Handler error for ${message.command}: ${error.message}`,
        { cause: error }
      );
    }
  }
}
