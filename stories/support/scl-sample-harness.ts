import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getForm, SclVersion } from '../../src/form-api.js';
import 'ace-custom-element';

const aceBasePath = new URL(
  '../../node_modules/ace-custom-element/dist/ace/',
  import.meta.url,
).href;

function parseXml(xml: string): XMLDocument {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(xml, 'application/xml');
  const parseError = parsed.querySelector('parsererror');
  if (parseError) {
    throw new Error(parseError.textContent ?? 'Invalid XML');
  }
  return parsed;
}

export class SclSampleHarness extends LitElement {
  @property({ type: String }) sample = '';

  @property({ type: String }) version = '2003';

  @property({ type: String }) elementName = 'SCL';

  @state() private doc: XMLDocument | null = null;

  @state() private error?: string;

  @state() private xmlText = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.resetToSample();
  }

  private resetToSample(): void {
    try {
      this.doc = parseXml(this.sample);
      this.xmlText = this.sample;
      this.error = undefined;
    } catch (err) {
      this.error = (err as Error).message;
      this.doc = null;
      this.xmlText = '';
    }
  }

  private async handleUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    try {
      this.doc = parseXml(text);
      this.xmlText = text;
      this.error = undefined;
    } catch (err) {
      this.error = (err as Error).message;
      this.doc = null;
      this.xmlText = text;
    }
  }

  private handleAceChange(event: CustomEvent<string>): void {
    const text = event.detail;
    this.xmlText = text;
    try {
      this.doc = parseXml(text);
      this.error = undefined;
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  render() {
    return html`
      <section class="controls">
        <div class="left">
          <button type="button" @click=${() => this.resetToSample()}>
            Reset to sample
          </button>
          <label class="file-input">
            <span>Upload SCL</span>
            <input
              type="file"
              accept=".scd,.ssd,.icd,.cid,.xml"
              @change=${this.handleUpload}
            />
          </label>
        </div>
        <div class="right"><strong>Version:</strong> ${this.version}</div>
      </section>
      ${this.error
        ? html`<p class="error">XML parse error: ${this.error}</p>`
        : html``}
      <div class="content">
        <section class="form">
          ${getForm(this.elementName, {
            version: this.version as SclVersion,
            doc: this.doc,
          })}
        </section>
        <section class="editor">
          <div class="editor-header">SCL XML (live)</div>
          <ace-editor
            mode="ace/mode/xml"
            theme="ace/theme/solarized_light"
            .value=${this.xmlText}
            base-path=${aceBasePath}
            style="width: 100%; height: 100%;"
            @change=${(e: CustomEvent<string>) => this.handleAceChange(e)}
          ></ace-editor>
        </section>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family: sans-serif;
      color: var(--oscd-body-color, #1f2a3d);
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--oscd-divider-color, #e0e4ea);
    }

    .left {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    button {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--oscd-button-border, #c0c7d1);
      background: var(--oscd-button-bg, #f5f7fa);
      cursor: pointer;
    }

    .file-input {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--oscd-button-border, #c0c7d1);
      background: var(--oscd-button-bg, #f5f7fa);
    }

    .file-input input {
      display: none;
    }

    .error {
      color: #b00020;
      margin: 8px 0 0;
    }

    .form {
      padding: 12px 0;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 12px 0;
    }

    .editor {
      min-height: 320px;
      border: 1px solid var(--oscd-divider-color, #e0e4ea);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .editor-header {
      padding: 8px 10px;
      background: #f6f8fb;
      border-bottom: 1px solid var(--oscd-divider-color, #e0e4ea);
      font-weight: 600;
    }

    ace-editor {
      flex: 1;
    }

    @media (max-width: 900px) {
      .content {
        grid-template-columns: 1fr;
      }
    }
  `;
}

if (!customElements.get('scl-sample-harness')) {
  customElements.define('scl-sample-harness', SclSampleHarness);
}
