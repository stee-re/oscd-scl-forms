import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { availableVersions } from '../src/generated/versions.js';
import { formRenderers } from '../src/generated/forms.js';
import '../src/runtime/scl-element-form.js';

const meta: Meta = {
  title: 'Generated/Forms',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<{
  version: (typeof availableVersions)[number];
  element: string;
}>;

const elementsByVersion = Object.fromEntries(
  availableVersions.map(v => [v, Object.keys(formRenderers[v] ?? {})]),
) as Record<(typeof availableVersions)[number], string[]>;

export const Playground: Story = {
  args: {
    version: availableVersions[availableVersions.length - 1],
    element:
      elementsByVersion[availableVersions[availableVersions.length - 1]][0],
  },
  argTypes: {
    version: { control: 'select', options: availableVersions },
    element: { control: 'select' },
  },
  render: ({ version, element }) => {
    const options = elementsByVersion[version] ?? [];
    const renderer = formRenderers[version]?.[element];
    const body = renderer
      ? renderer(null)
      : html`<p>No renderer for ${element} in ${version}</p>`;

    return html`
      <section style="padding: 16px; font-family: sans-serif;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <label>
            <div>Version</div>
            <select
              @change=${(e: Event) => {
                const target = e.target as HTMLSelectElement;
                const newVersion =
                  target.value as (typeof availableVersions)[number];
                const newElement = elementsByVersion[newVersion]?.[0] ?? '';
                const ev = new CustomEvent('argChange', {
                  detail: { version: newVersion, element: newElement },
                  bubbles: true,
                  composed: true,
                });
                target.dispatchEvent(ev);
              }}
            >
              ${availableVersions.map(
                v =>
                  html`<option value=${v} ?selected=${v === version}>
                    ${v}
                  </option>`,
              )}
            </select>
          </label>
          <label>
            <div>Element</div>
            <select
              @change=${(e: Event) => {
                const target = e.target as HTMLSelectElement;
                const ev = new CustomEvent('argChange', {
                  detail: { element: target.value },
                  bubbles: true,
                  composed: true,
                });
                target.dispatchEvent(ev);
              }}
            >
              ${options.map(
                opt =>
                  html`<option value=${opt} ?selected=${opt === element}>
                    ${opt}
                  </option>`,
              )}
            </select>
          </label>
        </div>
        ${body}
      </section>
    `;
  },
};
