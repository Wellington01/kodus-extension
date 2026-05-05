import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('kodus-card')
export class KodusCard extends LitElement {
  @property({ type: String }) override title = '';
  @property({ type: String }) description = '';
  @property({ type: Boolean }) interactive = false;

  static override styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.2s ease;
    }

    .card.interactive {
      cursor: pointer;
    }

    .card.interactive:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
    }

    .title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0 0 0.5rem 0;
    }

    .description {
      font-size: 0.875rem;
      color: var(--vscode-descriptionForeground);
      margin: 0;
      line-height: 1.4;
    }

    .content {
      margin-top: 1rem;
    }

    ::slotted(*) {
      margin: 0;
    }
  `;

  override render() {
    return html`
      <div
        class="card ${this.interactive ? 'interactive' : ''}"
        @click=${this._handleClick}
      >
        ${this.title ? html`<h3 class="title">${this.title}</h3>` : ''}
        ${this.description ? html`<p class="description">${this.description}</p>` : ''}
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  private _handleClick() {
    if (this.interactive) {
      this.dispatchEvent(new CustomEvent('kodus-card-click', {
        detail: { title: this.title },
        bubbles: true,
        composed: true
      }));
    }
  }
}
