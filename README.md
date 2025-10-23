# Kodus Development Tools

🚀 **Open source development tools and utilities for enhanced productivity**

A powerful, cross-platform VSCode extension that provides essential development utilities without any licensing restrictions. Built with modern tools and practices.

## ✨ Features

### 🔧 Quick Actions

- **Format JSON** - Format JSON files with proper indentation
- **Convert Case** - Convert text between different cases (camelCase, PascalCase, kebab-case, etc.)
- **Insert Timestamp** - Insert current ISO timestamp at cursor position

### 📝 Code Snippets

- **JavaScript/TypeScript** - Common patterns and functions
- **React** - Hooks, components, and lifecycle methods
- **CSS** - Layout utilities, media queries, and common styles
- **HTML** - Boilerplate templates and semantic markup
- **General** - Comments, TODOs, and documentation snippets

### ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) - Format JSON
- `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`) - Convert Case
- `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) - Insert Timestamp

## 🚀 Installation

### From Source

1. Clone this repository
2. Install dependencies: `yarn install`
3. Start development: `yarn start`
4. Press `F5` to run in Extension Development Host

### Package Installation

```bash
vsce package
code --install-extension kodus-extension-0.0.1.vsix
```

## 🛠️ Development

### Prerequisites

- Node.js 16+
- Yarn package manager
- VSCode 1.74+

### Setup

```bash
yarn install
yarn start
```

### Build

```bash
yarn build
vsce package
```

## 📋 Commands

Access all commands via `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) and search for "Kodus":

- `Kodus: Welcome to Kodus Tools` - Show welcome message
- `Kodus: Format JSON` - Format current JSON file
- `Kodus: Convert Case` - Convert selected text case
- `Kodus: Insert Timestamp` - Insert ISO timestamp
- `Kodus: Insert Code Snippet` - Insert code snippets

## 🔧 Configuration

This extension is designed to work out of the box with sensible defaults. No additional configuration is required.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Why Open Source?

This extension is built with open source principles in mind:

- **No vendor lock-in** - Works with any editor that supports VSCode extensions
- **No licensing restrictions** - Use freely in any project
- **Community-driven** - Contributions and feedback welcome
- **Transparent** - Full source code available

## 🆚 Comparison with Proprietary Tools

Unlike proprietary extensions that may have licensing restrictions, Kodus Development Tools:

- ✅ Works with VSCode, Cursor, and other compatible editors
- ✅ No Microsoft-only restrictions
- ✅ Free for commercial and personal use
- ✅ Community maintained and improved
- ✅ Full source code transparency

## 📞 Support

- 🐛 [Report Issues](https://github.com/kodustech/kodus-extension/issues)
- 💬 [Discussions](https://github.com/kodustech/kodus-extension/discussions)
- 📧 [Contact](mailto:support@kodustech.com)

---

Made with ❤️ by the Kodus team
