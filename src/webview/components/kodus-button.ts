import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kodus-button')
export class KodusButton extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) icon = '';
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) variant: 'primary' | 'secondary' | 'danger' =
    'primary';

  static override styles = css`
    :host {
      display: inline-block;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: 1px solid var(--vscode-button-border);
    }

    .btn:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    .btn:active:not(:disabled) {
      background: var(--vscode-button-activeBackground);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn.secondary:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .btn.danger {
      background: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
    }

    .btn.danger:hover:not(:disabled) {
      background: var(--vscode-inputValidation-errorBorder);
    }

    .icon {
      width: 1rem;
      height: 1rem;
      display: inline-block;
    }
  `;

  override render() {
    return html`
      <button
        class="btn ${this.variant}"
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        ${this.icon ? html`<span class="icon">${this.icon}</span>` : ''}
        ${this.label}
      </button>
    `;
  }

  private _handleClick() {
    if (!this.disabled) {
      this.dispatchEvent(
        new CustomEvent('kodus-click', {
          detail: { label: this.label, variant: this.variant },
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

// VIOLATION: Custom one-off component that violates style rules and the MCP guideline.
@customElement('kodus-legacy-button')
export class KodusLegacyButton extends LitElement {
  @property({ type: String }) text = 'Legacy Button';

  static override styles = css`
    .legacy-btn {
      padding: 10px;
      border-radius: 5px;
      background-color: #ff0000;
      color: #ffffff;
      font-family: 'Comic Sans MS';
    }
  `;

  override render() {
    var buttonText = this.text;
    return html`<button class="legacy-btn">${buttonText}</button>`;
  }
}
