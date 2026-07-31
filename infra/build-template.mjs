/**
 * Produces the deployable CloudFormation template.
 *
 * site-stack.yaml carries the placeholder line
 *
 *     ZipFile: '@@QUOTE_FORM_HANDLER@@'
 *
 * and this script replaces it with the compiled contents of
 * infra/lambda/quote-form/index.js as a YAML block scalar. Keeping one copy of
 * the handler means the deployed Lambda and the file you can read, lint and
 * test are the same code by construction.
 *
 * CloudFormation caps inline function code at 4096 characters and the
 * commented source is longer than that, so comments and redundant whitespace
 * are stripped on the way through. esbuild does that with a real parser —
 * a regex-based comment stripper would corrupt the `https://` string literals
 * and the character-class regexes in the handler.
 *
 *   node infra/build-template.mjs   ->  infra/site-stack.generated.yaml
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));

const PLACEHOLDER = "ZipFile: '@@QUOTE_FORM_HANDLER@@'";
const INDENT = ' '.repeat(10);
const INLINE_LIMIT = 4096;

const template = await readFile(join(here, 'site-stack.yaml'), 'utf8');
const sourcePath = join(here, 'lambda', 'quote-form', 'index.js');
const source = await readFile(sourcePath, 'utf8');

if (!template.includes(PLACEHOLDER)) {
  console.error(`Placeholder not found in site-stack.yaml:\n  ${PLACEHOLDER}`);
  process.exit(1);
}

const { code } = await esbuild.transform(source, {
  loader: 'js',
  format: 'cjs',
  target: 'node22',
  // Identifiers and syntax are left alone so the deployed code still reads as
  // the original logic; only comments and layout go.
  minifyWhitespace: true,
  minifyIdentifiers: false,
  minifySyntax: false,
  legalComments: 'none',
});

const handler =
  '// Generated from infra/lambda/quote-form/index.js - edit that file, not this.\n' + code;

// A raw control character or tab would break the YAML block scalar.
const illegal = handler.match(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/);
if (illegal) {
  const hex = illegal[0].charCodeAt(0).toString(16).padStart(2, '0');
  console.error(`Handler contains control character 0x${hex}, which cannot go in a YAML block scalar.`);
  process.exit(1);
}
if (handler.includes('\t')) {
  console.error('Handler contains a tab; YAML block scalars require spaces.');
  process.exit(1);
}

if (handler.length > INLINE_LIMIT) {
  console.error(
    `Compiled handler is ${handler.length} characters; the inline limit is ${INLINE_LIMIT}.\n` +
      'Either trim the handler or switch to an S3-packaged deployment ' +
      '(`aws cloudformation package`).',
  );
  process.exit(1);
}

const block = [
  'ZipFile: |',
  ...handler.split('\n').map((line) => (line ? INDENT + line : '')),
].join('\n');

const outPath = join(here, 'site-stack.generated.yaml');
await writeFile(outPath, template.replace(PLACEHOLDER, block), 'utf8');

console.log(
  `Wrote ${outPath}\n` +
    `  handler: ${source.length} chars source -> ${handler.length} deployed ` +
    `(${Math.round((handler.length / INLINE_LIMIT) * 100)}% of the ${INLINE_LIMIT} limit)`,
);
