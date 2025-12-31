import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { schemas } from '../schemas/schemas.ts';
import { buildSchemaModel } from './extract-elements.ts';
import type { ElementModel, SchemaModel } from './model.ts';
import { header } from './generators/utils.ts';
import {
  emitValidatorFile,
  emitValidatorsIndex,
} from './generators/validator.generator.ts';
import { emitFormFile, emitFormsIndex } from './generators/form.generator.ts';
import { emitSpecFile } from './generators/spec.generator.ts';
import { emitStoryFile } from './generators/stories.generator.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const generatedDir = join(repoRoot, 'src', 'generated');

function buildElementPaths(model: SchemaModel): Record<string, string[]> {
  const childMap = new Map<string, string[]>(
    model.elements.map(el => [el.name, el.children]),
  );
  const paths: Record<string, string[]> = {};

  const visit = (name: string, path: string[]) => {
    if (paths[name]) {
      return;
    }
    paths[name] = path;
    (childMap.get(name) ?? []).forEach(child => visit(child, [...path, child]));
  };

  if (childMap.has('SCL')) {
    visit('SCL', ['SCL']);
  }

  model.elements.forEach(el => {
    if (!paths[el.name]) {
      paths[el.name] = [el.name];
    }
  });

  return paths;
}

function genVersions(): string {
  return `${header}export const availableVersions = ${JSON.stringify(versions, null, 2)} as const;\nexport type AvailableVersion = typeof availableVersions[number];\n`;
}

const versions = Object.keys(schemas);
const models: SchemaModel[] = versions.map(version =>
  buildSchemaModel(version, schemas[version as keyof typeof schemas]),
);

// elementName -> version -> element
const elementsByName = new Map<string, Record<string, ElementModel>>();
models.forEach(model => {
  model.elements.forEach(el => {
    const existing = elementsByName.get(el.name) ?? {};
    existing[model.version] = el;
    elementsByName.set(el.name, existing);
  });
});

// Start fresh.
await rm(generatedDir, { recursive: true, force: true });
await mkdir(generatedDir, { recursive: true });

// Build element paths from latest model to keep titles stable.
const latestModel = models[models.length - 1];
const paths = buildElementPaths(latestModel);

// Emit per-element bundles.
for (const [elementName, versionMap] of elementsByName.entries()) {
  await emitValidatorFile(generatedDir, elementName, versionMap);
  await emitFormFile(generatedDir, elementName, versionMap);
  const pathSegments = paths[elementName] ?? [elementName];
  const elementVersions = Object.keys(versionMap).sort(
    (a, b) => versions.indexOf(a) - versions.indexOf(b),
  );
  await emitStoryFile(generatedDir, elementName, pathSegments, elementVersions);
  await emitSpecFile(generatedDir, elementName);
}

// Emit indexes.
await emitValidatorsIndex(generatedDir, elementsByName, versions);
await emitFormsIndex(generatedDir, elementsByName, versions);

await writeFile(join(generatedDir, 'versions.ts'), genVersions(), 'utf8');

console.log(
  `Generated placeholder artifacts for versions: ${versions.join(', ')}`,
);
