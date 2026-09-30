import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

const root = join(__dirname, '..');
const LONG_DASH = /[\u2013\u2014]/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.(test|d)\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

it('keeps em and en dashes out of every string the app can show', () => {
  const found: string[] = [];

  for (const file of sourceFiles(join(root, 'src'))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      const isText = ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node) || ts.isJsxText(node);
      if (isText && LONG_DASH.test(node.getText(source))) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        found.push(`${relative(root, file)}:${line + 1}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  for (const file of ['index.html', 'public/manifest.json']) {
    const text = readFileSync(join(root, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    if (LONG_DASH.test(text)) found.push(file);
  }

  expect(found).toEqual([]);
});
