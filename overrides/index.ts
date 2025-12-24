import type { OverrideConfig } from '../scripts/model.ts';

// Version-aware overrides for labels, order, control types, visibility, etc.
// Populate per element/tag as needed. Keys are schema versions, values are
// element-specific overrides.
export const overrides: OverrideConfig = {
  global: {},
  versions: {
    // Example:
    // '2007B': {
    //   SCL: {
    //     label: 'Substation Configuration',
    //     fields: {
    //       version: { label: 'Schema Version', readonly: true },
    //     },
    //   },
    // },
  },
};
