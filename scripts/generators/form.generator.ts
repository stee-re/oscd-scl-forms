import { join } from 'path';
import type { ElementModel } from '../model.ts';
import { sanitizeId, header, writeLinesToFile, writeToFile } from './utils.ts';

export async function emitFormsIndex(
  baseDir: string,
  elementsByName: Map<string, Record<string, ElementModel>>,
  versions: string[],
): Promise<void> {
  const imports: string[] = [];
  const body: string[] = [];

  Array.from(elementsByName.keys())
    .sort()
    .forEach(name => {
      const id = `forms_${sanitizeId(name)}`;
      imports.push(
        `import { forms as ${id} } from './${name}/${name}.form.js';`,
      );
    });

  versions.forEach(version => {
    const entries: string[] = [];
    elementsByName.forEach((map, name) => {
      if (map[version]) {
        const id = `forms_${sanitizeId(name)}`;
        entries.push(`    '${name}': ${id}['${version}'],`);
      }
    });
    body.push(`  '${version}': {\n${entries.join('\n')}\n  }`);
  });

  const content = `${header}${imports.join('\n')}\n\nimport type { TemplateResult } from 'lit';\n\nexport type GeneratedRenderer = (doc?: XMLDocument | null) => TemplateResult;\nexport const formRenderers: Record<string, Record<string, GeneratedRenderer>> = {\n${body.join(',\n')}\n};\n`;

  return writeToFile(join(baseDir, `forms.ts`), content);
}

export async function emitFormFile(
  baseDir: string,
  elementName: string,
  versionsMap: Record<string, ElementModel>,
): Promise<void> {
  const importValidatorId = `validators_${sanitizeId(elementName)}`;
  const lines: string[] = [
    `${header}import { html, TemplateResult } from 'lit';`,
    "import '../../runtime/scl-element-form.js';",
    `import { validators as ${importValidatorId} } from './${elementName}.validation.js';`,
    '',
  ];

  Object.entries(versionsMap).forEach(([version, el]) => {
    lines.push(
      `const attributes_${version} = ${JSON.stringify(el.attributes, null, 2)} as const;`,
    );
    lines.push(
      `const children_${version} = ${JSON.stringify(el.children, null, 2)} as const;`,
    );
    lines.push(
      `const occurs_${version} = ${JSON.stringify(el.occurs ?? {}, null, 2)} as const;`,
    );
    lines.push('');
  });

  lines.push(
    'export type GeneratedRenderer = (doc?: XMLDocument | null) => TemplateResult;',
    'export const forms: Record<string, GeneratedRenderer> = {',
  );

  Object.keys(versionsMap).forEach(version => {
    lines.push(
      `  '${version}': (doc?: XMLDocument | null) => html\``,
      '    <scl-element-form',
      `      elementName="${elementName}"`,
      `      .attrDefs=\${attributes_${version}}`,
      `      .childNames=\${children_${version}}`,
      `      .occursMap=\${occurs_${version}}`,
      `      .validator=\${${importValidatorId}['${version}']}`,
      '      .doc=${doc}',
      '    ></scl-element-form>',
      '  `,',
    );
  });

  lines.push('};', '');

  return writeLinesToFile(
    baseDir,
    elementName,
    `${elementName}.form.ts`,
    lines,
  );
}
