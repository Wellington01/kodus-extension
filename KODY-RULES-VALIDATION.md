# Kody Rules — validação end-to-end do hotfix #1494

Reproduz, num repo real, **todos os problemas que o cliente (Physitrack) reportou**
sobre detecção/import/enforcement de regras a partir de `AGENTS.md` / `CLAUDE.md` /
`.kody/rules`. Roda contra uma instância Kodus **com o hotfix #1494 aplicado** e
confirma que cada bug virou GREEN.

> **Pré-requisito #0 (crítico):** a instância Kodus que você vai usar precisa ter o
> commit `87a9f684a` (PR #1494) deployado. Sem ele, o teste **reproduz os bugs** em
> vez de confirmar o fix — o que também é útil como baseline RED, mas não é o objetivo.

---

## Mapa: arquivo no repo → bug do cliente que ele testa

| Arquivo (na `main`) | Bug do cliente | O que o fix deve fazer |
|---|---|---|
| `AGENTS.md` | #1 AGENTS.md invisível · #2 uppercase raiz não detectado | detectar o arquivo **e** resolver `@docs/conventions.md`, inlinando o conteúdo |
| `docs/conventions.md` | #1 `@`-reference dropada | conteúdo (token `CONV-KDX-9137`) aparece **dentro** da regra de AGENTS.md |
| `CLAUDE.md` (raiz) | baseline (#3 contraste) | importa repo-wide |
| `src/services/CLAUDE.md` | #3 CLAUDE.md aninhado não lido | descobre sem config e escopa a `src/services/**` |
| `src/webview/claude.md` | #5 matching case-sensitive | detecta apesar do nome **lowercase**, escopa a `src/webview/**` |
| `.kody/rules/architecture/naming-conventions.md` | **#4 multi-glob nunca roda** · #6 import não-verbatim | globs OR-eados casam; `**NAME1**` + Bad/Good importados **verbatim** |
| `.kody/rules/avoid-console-log.md` (já existia) | **#4 multi-glob** (`["src/**/*.ts","src/**/*.tsx"]`) | casa `.ts` **e** `.tsx` |
| `.kody/rules/require-tests-for-new-endpoints.md` (já existia) | controle (single glob) | deve funcionar antes e depois |

---

## Fase 0 — Setup (uma vez)

1. Logar no Kodus, conectar o GitHub, adicionar o repo `Wellington01/kodus-extension`.
2. **Settings → Code Review → Kody Rules**: garantir que o **sync de IDE rules está ligado**.
3. Confirmar a default branch do repo no GitHub = `main` (o sync lê da default).

## Fase 1 — Publicar os arquivos de regra na `main`

Os arquivos já foram criados no working tree pela sessão. Publique-os na `main`
(escolha UM caminho):

**Caminho A — via PR (testa também o auto-sync em merge):**
```bash
cd /Users/wellingtonsantana/Documents/kodus-git/kodus-well/kodus-extension
git checkout -b test/kody-rules-setup
git add AGENTS.md docs/conventions.md CLAUDE.md \
        src/services/CLAUDE.md src/webview/claude.md \
        .kody/rules/architecture/naming-conventions.md KODY-RULES-VALIDATION.md
git commit -m "test(kody-rules): fixtures for #1494 end-to-end validation"
git push -u origin test/kody-rules-setup
# abrir PR test/kody-rules-setup -> main e MERGEAR (o merge dispara syncFromChangedFiles)
```

**Caminho B — full re-sync manual:** commitar direto na `main`, depois clicar o
botão **Sync / Re-sync** em Settings → Kody Rules (dispara a leitura da `main` inteira —
é o "force a re-sync" que o cliente pediu).

## Fase 2 — Verificar o IMPORT (Settings → Code Review → Kody Rules)

Answer key — cada linha é um ✅ esperado **depois** do fix:

- [ ] **#2/#1** Existe uma regra com **Source = `AGENTS.md`**. (Antes: não aparecia.)
- [ ] **#1** O corpo dessa regra **contém `CONV-KDX-9137`** (o conteúdo de
      `docs/conventions.md` foi **inlinado** via `@`-ref). (Antes: dropado.)
- [ ] **#3** Existe regra com Source = `src/services/CLAUDE.md`, com **path escopado
      a `src/services/**`** (não repo-wide).
- [ ] **#5** Existe regra com Source = `src/webview/claude.md` (**lowercase**),
      escopada a `src/webview/**`. (Antes: não sincronizava no merge de PR.)
- [ ] **#4** A regra `naming-conventions` mostra **path com os DOIS globs**
      (`src/services/**/*.ts`, `src/commands/**/*.ts`) — persistido comma-joined.
- [ ] **#6** A regra `naming-conventions` preserva **`NAME1`** e as seções
      **Bad/Good example** (não foram cortadas/reescritas). (Antes: LLM condensava e
      removia o identificador + exemplos.)
- [ ] **sync-error chip**: `@docs/conventions.md` é uma referência **válida**
      (arquivo existe) → não deve haver "1 sync error" espúrio nessas regras. Se
      aparecer, é fetch da referência — não impede a regra de rodar, mas anote.

## Fase 3 — Verificar o ENFORCEMENT (abrir PRs de violação)

Abra uma PR (pode ser uma só, com os arquivos abaixo — todos pequenos e limpos, no
espírito do "Experiment 2" do cliente, pra descartar limite de context-window).
**Cada arquivo viola uma regra específica; a expectativa é um comentário do Kody
citando a regra.**

Crie a branch a partir da `main` **já com as regras publicadas** e adicione:

### 3a. `src/commands/reportExporter.ts` — testa #4 multi-glob no **SEGUNDO** glob
```typescript
// Viola NAME1: classe sem sufixo `Service` + método Pascal/snake.
// Casa o SEGUNDO glob da regra (src/commands/**/*.ts). Este é o coração do
// bug do cliente: antes do fix, o path comma-joined casava ZERO arquivos.
export class reportExporter {
    Build_Report(id: string) {
        return `report-${id}`;
    }
}
```
**Esperado:** comentário citando **NAME1** (naming-conventions). ❗Se não comentar,
o bug multi-glob NÃO está corrigido nesta instância.

### 3b. `src/utils/debugLogger.ts` — testa #4 (multi-glob existente `avoid-console-log`)
```typescript
export function debugDump(payload: unknown) {
    console.log('debug payload:', payload); // viola avoid-console-log
}
```
**Esperado:** comentário citando **Avoid console.log in production code**.

### 3c. `src/services/exportService.ts` — testa #1 AGENTS.md + `@`-ref inline
```typescript
// Função exportada SEM return type explícito → viola CONV-KDX-9137,
// que só existe se AGENTS.md foi detectado E o @docs/conventions.md inlinado.
export function buildExportUrl(base, path) {
    return base + '/' + path;
}
```
**Esperado:** comentário referenciando a convenção **CONV-KDX-9137** (ou a regra de
`AGENTS.md`). Prova detecção do AGENTS.md **e** resolução da `@`-referência.

### 3d. `src/services/paymentGateway.ts` — testa #3 CLAUDE.md aninhado (services)
```typescript
import { readFileSync } from 'fs';

export class PaymentGatewayService {
    loadConfig(path: string) {
        return readFileSync(path, 'utf-8'); // I/O sem try/catch → SERVICES-CLAUDE-marker
    }
}
```
**Esperado:** comentário alinhado ao **SERVICES-CLAUDE-marker** (regra escopada a
`src/services/**`).

### 3e. `src/webview/dispatch.ts` — testa #5 CLAUDE.md lowercase aninhado (webview)
```typescript
export function dispatch(message: any) {
    // Sem validar message.type antes de despachar → WEBVIEW-CLAUDE-lowercase-marker
    return handlers[message.command](message.payload);
}
```
**Esperado:** comentário alinhado ao **WEBVIEW-CLAUDE-lowercase-marker** (regra
vinda do `claude.md` lowercase).

## Fase 4 — Placar

| Bug | Sinal de GREEN | Resultado |
|---|---|---|
| #1 AGENTS.md + @-ref | regra de AGENTS.md com `CONV-KDX-9137` inlinado; 3c comentado | ☐ |
| #2 AGENTS.md uppercase raiz | regra com Source=`AGENTS.md` existe | ☐ |
| #3 CLAUDE.md aninhado | `src/services/CLAUDE.md` importado + scoped; 3d comentado | ☐ |
| **#4 multi-glob** | **3a (2º glob) comentado citando NAME1**; 3b comentado | ☐ |
| #5 case-insensitive | `src/webview/claude.md` importado + scoped; 3e comentado | ☐ |
| #6 import verbatim | NAME1 + Bad/Good preservados em Settings | ☐ |

> Dica de rigor (RED→GREEN): se der pra rodar as Fases 1–3 **também** numa instância
> SEM o #1494, você vê os mesmos itens falharem (multi-glob mudo, AGENTS.md ausente,
> aninhados não descobertos). Isso prova que foi o fix — não sorte de modelo.

## Notas / gotchas

- **Modelo:** o cliente perguntou qual modelo usar. O enforcement depende do LLM
  configurado (BYOK). Anote qual modelo a instância usa; regra "simples" que não
  pega pode ser detecção (corrigida) **ou** o modelo.
- **Sync não roda:** o auto-sync via PR só dispara em **PR mergeada na default** que
  **toca** arquivos de regra. Editar numa branch sem mergear não sincroniza.
- **Onde ver erro de sync:** o cliente pediu logs. Sem o fix, o chip "1 sync error"
  não abre detalhe. O #1494 melhora a observabilidade; se ainda faltar detalhe,
  registre como follow-up.
