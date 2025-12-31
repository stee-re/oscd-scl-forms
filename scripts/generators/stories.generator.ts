import { header, writeLinesToFile } from './utils.ts';

function storyTitle(pathSegments: string[], elementName: string): string {
  const base = pathSegments.length > 0 ? pathSegments.join('/') : elementName;
  return base.startsWith('SCL') ? base : `SCL/${base}`;
}

export async function emitStoryFile(
  baseDir: string,
  elementName: string,
  pathSegments: string[],
  elementVersions: string[],
): Promise<void> {
  const title = storyTitle(pathSegments, elementName);
  const defaultVersion = elementVersions[elementVersions.length - 1];
  const lines: string[] = [
    `${header}import type { Meta, StoryObj } from '@storybook/web-components';`,
    `import { html } from 'lit';`,
    `import '../../../stories/support/scl-sample-harness.js';`,
    '',
    `const elementVersions = ${JSON.stringify(elementVersions)} as const;`,
    '',
    `const meta: Meta = {`,
    `  title: '${title}',`,
    `  parameters: { layout: 'fullscreen' },`,
    `};`,
    '',
    'export default meta;',
    '',
    'type Story = StoryObj<{ version: (typeof elementVersions)[number] }>; ',
    '',
    'export const Playground: Story = {',
    `  args: { version: '${defaultVersion}' as (typeof elementVersions)[number] },`,
    "  argTypes: { version: { control: 'select', options: elementVersions } },",
    '  render: ({ version }) => html`',
    '    <scl-sample-harness',
    '      .version=${version}',
    `      elementName=${JSON.stringify(elementName)}`,
    '    ></scl-sample-harness>',
    '  `,',
    '};',
    '',
  ];

  return writeLinesToFile(
    baseDir,
    elementName,
    `${elementName}.stories.ts`,
    lines,
  );
}
