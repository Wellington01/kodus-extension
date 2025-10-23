#!/bin/bash

# 🚀 Script Simples: Compilar e Abrir VSCode
# Só compila a extensão e abre o VSCode para testar

echo "🚀 Compilando extensão Kodus..."

# Compilar
yarn compile

echo "✅ Compilação concluída!"

# Abrir VSCode
echo "📂 Abrindo VSCode..."
code .

echo ""
echo "🎯 PRÓXIMO PASSO:"
echo "Pressione F5 no VSCode para testar a extensão!"
echo ""
echo "💡 Isso abrirá uma nova janela 'Extension Development Host'"
echo "   onde você pode testar todos os comandos da extensão."
