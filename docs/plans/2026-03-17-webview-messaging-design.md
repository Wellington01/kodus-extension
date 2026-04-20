# Webview-Extension Messaging System Design

## Overview

This document outlines the architectural refactoring for the communication system between the VS Code Extension and its Webviews in the Kodus Development Tools project. The goal is to replace the existing untyped, monolithic `switch/case` structures with a scalable, type-safe messaging bus.

## Architecture and Components

- **Typed Channels:** The system will define static TypeScript interfaces for every message type (`WebviewToExtensionMessage` and `ExtensionToWebviewMessage`).
- **MessageHandler / MessageBus:** A centralized mediator class will replace the `switch` statements. Handlers for specific commands will be registered dynamically (e.g., `messageHandler.register('formatJson', handleFormatJson)`), ensuring the Single Responsibility Principle.
- **Validation:** Payloads will be validated using Type Guards or Zod to ensure type safety at the boundaries before being processed by the extension.

## Data Flow

1. The Webview sends a message via `postMessage({ command: 'actionName', data: payload })`.
2. A generic listener in the Extension receives the message and forwards it to the `MessageHandler`.
3. The `MessageHandler` validates the payload and routes it to the registered handler function.
4. If a response is required, the handler uses the typed `postMessage` API to reply (e.g., `{ command: 'actionNameResult', data: responseData }`).

## Error Handling

- **Centralized Try/Catch:** The `MessageHandler` will wrap all handler executions in a `try/catch` block.
- **Error Feedback:** Instead of silent failures or generic VS Code notifications, if a handler throws an error, the Extension will automatically dispatch an `error` message back to the Webview.
- **Webview UI:** The Webview can listen for these `error` messages and present contextual toasts, alerts, or inline notifications to the user.

## Testing Strategy

- **E2E / Integration Tests:** Rather than relying on mocked Webview instances in unit tests, the system will be validated using End-to-End (E2E) integration tests running inside the actual VS Code Extension Test Host.
- This ensures the entire communication loop—from the simulated Webview environment, through the `MessageHandler`, and back—works flawlessly in a real-world scenario.
