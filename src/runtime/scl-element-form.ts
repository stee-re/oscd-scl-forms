import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { ZodTypeAny } from 'zod';
import { FormState } from '../form-state.js';
import type { AttributeModel, Occurs } from '../../scripts/model.js';

type OccursMap = Record<string, Occurs>;

export class SclElementForm extends LitElement {
  // TODO: consider refactoring into smaller sub-components (attributes/children/occurs)
  // that can be slotted into a parent wrapper for composability and testing.
  @property({ type: String })
  elementName = '';

  @property({ attribute: false })
  attrDefs: AttributeModel[] = [];

  @property({ attribute: false })
  childNames: string[] = [];

  @property({ attribute: false })
  occursMap: OccursMap = {};

  @property({ attribute: false })
  validator?: ZodTypeAny;

  @state()
  private formState?: FormState<Record<string, unknown>>;

  connectedCallback(): void {
    super.connectedCallback();
    this.initState();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('attrDefs') || changed.has('validator')) {
      this.initState();
    }
  }

  private initState(): void {
    if (!this.validator) {
      return;
    }
    const initial: Record<string, unknown> = {};
    this.attrDefs.forEach(attr => {
      if (attr.defaultValue !== undefined) {
        initial[attr.name] = attr.defaultValue;
      } else if (attr.type.toLowerCase().includes('boolean')) {
        initial[attr.name] = false;
      } else {
        initial[attr.name] = '';
      }
    });
    this.formState = new FormState(initial, this.validator);
    this.formState.subscribe(() => this.requestUpdate());
    this.formState.validate();
  }

  private onInput(attr: AttributeModel, event: Event): void {
    if (!this.formState) {
      return;
    }
    const target = event.target as HTMLInputElement;
    let value: unknown = target.value;
    if (attr.type.toLowerCase().includes('boolean')) {
      value = target.checked;
    }
    if (
      attr.type.toLowerCase().includes('int') ||
      attr.type.toLowerCase().includes('decimal')
    ) {
      value = target.value === '' ? undefined : Number(target.value);
    }
    this.formState.setValue(attr.name, value);
  }

  private renderAttribute(attr: AttributeModel) {
    const state = this.formState?.fieldState(attr.name);
    const typeLower = attr.type.toLowerCase();
    const isBool = typeLower.includes('boolean');
    const isNumber = typeLower.includes('int') || typeLower.includes('decimal');

    return html`
      <label class="field">
        <span>${attr.name}</span>
        ${isBool
          ? html`<input
              type="checkbox"
              .checked=${Boolean(state?.value)}
              @change=${(e: Event) => this.onInput(attr, e)}
            />`
          : html`<input
              type=${isNumber ? 'number' : 'text'}
              .value=${state?.value?.toString() ?? ''}
              @input=${(e: Event) => this.onInput(attr, e)}
            />`}
        ${state?.touched && state.error
          ? html`<span class="error">${state.error}</span>`
          : html``}
      </label>
    `;
  }

  render() {
    return html`
      <section class="wrapper">
        <header>
          <h3>${this.elementName}</h3>
        </header>
        <div class="body">
          ${this.attrDefs.length
            ? html`<div class="group">
                <h4>Attributes</h4>
                ${this.attrDefs.map(attr => this.renderAttribute(attr))}
              </div>`
            : html`<p class="muted">No attributes</p>`}
          ${this.childNames.length
            ? html`<div class="group">
                <h4>Children</h4>
                <ul>
                  ${this.childNames.map(child => {
                    const occ = this.occursMap?.[child];
                    return html`<li>
                      ${child}
                      ${occ
                        ? html`<small
                            >(min ${occ.min}, max
                            ${occ.max === 'unbounded' ? '∞' : occ.max})</small
                          >`
                        : ''}
                    </li>`;
                  })}
                </ul>
              </div>`
            : html``}
        </div>
      </section>
    `;
  }

  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--oscd-divider-color, #e0e4ea);
      border-radius: 8px;
      padding: 12px;
      font-family: sans-serif;
    }

    h3 {
      margin: 0 0 8px;
      font-size: 16px;
    }

    h4 {
      margin: 12px 0 8px;
      font-size: 14px;
    }

    .group {
      margin-bottom: 8px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 10px;
    }

    input[type='text'],
    input[type='number'] {
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid var(--oscd-divider-color, #cbd2dc);
    }

    .error {
      color: #b00020;
      font-size: 12px;
    }

    .muted {
      color: #7a8494;
      margin: 0;
    }

    ul {
      margin: 0;
      padding-left: 18px;
    }

    small {
      color: #7a8494;
    }
  `;
}

if (!customElements.get('scl-element-form')) {
  customElements.define('scl-element-form', SclElementForm);
}
