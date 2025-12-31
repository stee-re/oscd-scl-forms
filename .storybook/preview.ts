import type { Preview } from '@storybook/web-components';

function getInitialSclDoc(): XMLDocument {
  return new DOMParser().parseFromString(
    `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2003" revision="B">
  <Header id="sample-scl" version="1.0.0" toolID="oscd-scl-forms-sample" />
  <IED name="IED1">
    <AccessPoint name="AP1">
      <Server>
        <LDevice inst="LD1" />
      </Server>
    </AccessPoint>
  </IED>
</SCL>`,
    'application/xml',
  );
}

const preview: Preview = {
  globalTypes: {
    sclDoc: {
      name: 'SCL Document',
      description: 'Sample SCL XML Document',
      defaultValue: getInitialSclDoc(),
      toolbar: {
        icon: 'document',
        items: [],
      },
    },
  },
  initialGlobals: {
    sclDoc: getInitialSclDoc(),
  },
  parameters: {
    controls: { expanded: true },
    actions: { argTypesRegex: '^on[A-Z].*' },
    options: { showPanel: true },
  },
};

export default preview;
