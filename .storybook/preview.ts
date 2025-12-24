import type { Preview } from '@storybook/web-components';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    actions: { argTypesRegex: '^on[A-Z].*' },
    options: { showPanel: true },
  },
};

export default preview;
