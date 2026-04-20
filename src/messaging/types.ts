export interface WebviewMessage<T = any> {
  command: string;
  data?: T;
  [key: string]: any; // fallback backwards compatibility for older payloads
}

export interface ExtensionMessage<T = any> {
  command: string;
  data?: T;
  error?: string;
}

export type MessageHandlerFunction = (data: any) => Promise<any> | any;
