import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import sampleScl from './assets/sample.scd?raw';
import './support/scl-sample-harness.js';

const meta: Meta = {
  title: 'SCL/Root',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const Playground: Story = {
  args: {
    version: '2003',
  },
  argTypes: {
    version: { control: 'text' },
  },
  render: ({ version }) =>
    html`<scl-sample-harness
      .sample=${sampleScl}
      .version=${version}
    ></scl-sample-harness>`,
};
