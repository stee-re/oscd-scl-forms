import { header, writeLinesToFile } from './utils.ts';

export async function emitSpecFile(
  baseDir: string,
  elementName: string,
): Promise<void> {
  const lines = [
    `${header}// Placeholder tests for ${elementName}.`,
    '// TODO: add real generated coverage once renderers/validators are complete.',
    '',
    'export {};',
    '',
  ];

  return writeLinesToFile(
    baseDir,
    elementName,
    `${elementName}.spec.ts`,
    lines,
  );
}
