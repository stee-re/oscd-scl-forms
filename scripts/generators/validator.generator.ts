import { join } from 'path';
import type { ElementModel } from '../model.ts';
import { sanitizeId, header, writeLinesToFile, writeToFile } from './utils.ts';

export async function emitValidatorsIndex(
  baseDir: string,
  elementsByName: Map<string, Record<string, ElementModel>>,
  versions: string[],
): Promise<void> {
  const imports: string[] = [];
  const body: string[] = [];

  Array.from(elementsByName.keys())
    .sort()
    .forEach(name => {
      const id = `validators_${sanitizeId(name)}`;
      imports.push(
        `import { validators as ${id} } from './${name}/${name}.validation.js';`,
      );
    });

  versions.forEach(version => {
    const entries: string[] = [];
    elementsByName.forEach((map, name) => {
      if (map[version]) {
        const id = `validators_${sanitizeId(name)}`;
        entries.push(`    '${name}': ${id}['${version}'],`);
      }
    });
    body.push(`  '${version}': {\n${entries.join('\n')}\n  }`);
  });

  const content = `${header}${imports.join('\n')}\n\nimport type { ZodTypeAny } from 'zod';\n\nexport const validatorSchemas: Record<string, Record<string, ZodTypeAny>> = {\n${body.join(',\n')}\n};\n`;

  return writeToFile(join(baseDir, `validators.ts`), content);
}

export async function emitValidatorFile(
  baseDir: string,
  elementName: string,
  versionsMap: Record<string, ElementModel>,
): Promise<void> {
  const lines: string[] = [`${header}import { z } from 'zod';`, ''];

  Object.entries(versionsMap).forEach(([version, el]) => {
    const fields =
      el.attributes.length === 0
        ? ''
        : el.attributes
            .map(attr => {
              const type = attr.type.toLowerCase();
              let base = 'z.string()';
              if (type.includes('boolean')) {
                base = 'z.boolean()';
              } else if (type.includes('int') || type.includes('decimal')) {
                base = 'z.number()';
              } else if (type.includes('date') || type.includes('time')) {
                base = 'z.string()';
              }

              if (attr.fixedValue) {
                base = `${base}.refine(v => v === '${attr.fixedValue}', { message: 'Must equal ${attr.fixedValue}' })`;
              }
              if (attr.defaultValue) {
                base = `${base}.default('${attr.defaultValue}')`;
              }
              if (attr.use !== 'required') {
                base = `${base}.optional()`;
              }
              return `  ${JSON.stringify(attr.name)}: ${base}`;
            })
            .join(',\n');

    const childFields =
      el.children.length === 0
        ? ''
        : el.children
            .map(child => {
              const occ = el.occurs?.[child];
              const min = occ?.min ?? 0;
              const max = occ?.max;
              const arr =
                max && max !== 'unbounded'
                  ? `z.array(z.any()).min(${min}).max(${max})`
                  : `z.array(z.any()).min(${min})`;
              return `  ${JSON.stringify(child)}: ${arr}.optional()`;
            })
            .join(',\n');

    const shapeEntries = [fields, childFields].filter(Boolean).join(',\n');
    const shape = shapeEntries ? `{\n${shapeEntries}\n}` : '{}';
    lines.push(`const shape_${version} = ${shape};`, '');
  });

  lines.push('export const validators: Record<string, z.ZodTypeAny> = {');
  Object.keys(versionsMap).forEach(version => {
    lines.push(`  '${version}': z.object(shape_${version}) as z.ZodTypeAny,`);
  });
  lines.push('};', '');

  return writeLinesToFile(
    baseDir,
    elementName,
    `${elementName}.validation.ts`,
    lines,
  );
}
