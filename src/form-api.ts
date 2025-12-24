import { html, TemplateResult } from 'lit';
import { z, ZodTypeAny } from 'zod';
import { formRenderers, GeneratedRenderer } from './generated/forms.js';
import { validatorSchemas } from './generated/validators.js';
import { availableVersions, AvailableVersion } from './generated/versions.js';

export type SclVersion = AvailableVersion | 'latest';

export interface GetFormOptions {
  version?: SclVersion;
  doc?: XMLDocument | null;
}

function resolveVersion(version?: SclVersion): AvailableVersion | undefined {
  if (!version || version === 'latest') {
    return availableVersions[availableVersions.length - 1];
  }
  return availableVersions.includes(version) ? version : undefined;
}

function pickRenderer(tag: string, version?: SclVersion): GeneratedRenderer {
  const resolved = resolveVersion(version);
  if (resolved && formRenderers[resolved]?.[tag]) {
    return formRenderers[resolved][tag];
  }
  // Fallback renderer for missing tag/version.
  return () => html`
    <div
      style="border: 1px dashed var(--oscd-hint-color, #888); padding: 12px;"
    >
      No renderer found for <strong>${tag}</strong> (version:
      <strong>${version ?? 'latest'}</strong>).
    </div>
  `;
}

function pickValidator(tag: string, version?: SclVersion): ZodTypeAny {
  const resolved = resolveVersion(version);
  if (resolved && validatorSchemas[resolved]?.[tag]) {
    return validatorSchemas[resolved][tag];
  }
  return z.any();
}

export function getForm(
  sclTagName: string,
  options: GetFormOptions = {},
): TemplateResult {
  const renderer = pickRenderer(sclTagName, options.version);
  return renderer(options.doc ?? null);
}

export function getValidator(
  sclTagName: string,
  version: SclVersion = 'latest',
): ZodTypeAny {
  return pickValidator(sclTagName, version);
}
