/**
 * The small slice of markdown the assistant actually produces: tables, bullet
 * lists, bold and paragraphs.
 *
 * Hand written rather than pulling in a markdown library, for the same reason
 * the icons are inline: this renders a handful of shapes we control through the
 * prompt, and a parser is cheaper than the dependency. It also builds React
 * elements rather than HTML, so there is no injection path for whatever a model
 * decides to emit.
 */
import type { ReactNode } from 'react';

const isTableRow = (line: string) => line.trim().startsWith('|') && line.trim().endsWith('|');
const isDivider = (line: string) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');
const isBullet = (line: string) => /^\s*[-*]\s+/.test(line);

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());

/** `**bold**` and `` `code` ``. Anything else stays literal text. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith('**')) {
      out.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      out.push(
        <code key={key} className="rounded bg-canvas px-1 py-0.5 text-[0.85em]">
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // A table is a header row, a divider, then rows until the pipes stop.
    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(cells(lines[i]));
        i += 1;
      }

      blocks.push(
        <div key={`table-${blocks.length}`} className="-mx-1 my-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line">
                {header.map((cell, index) => (
                  <th key={index} className="whitespace-nowrap px-2 py-1.5 font-medium text-muted">
                    {inline(cell, `h${index}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-line/60 last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-2 py-1.5 align-top">
                      {inline(cell, `c${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-1.5 list-disc space-y-0.5 pl-4">
          {items.map((item, index) => (
            <li key={index}>{inline(item, `li${index}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Everything else is a paragraph, running until a blank line or a table.
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !isTableRow(lines[i]) && !isBullet(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={`p-${blocks.length}`} className="whitespace-pre-wrap">
        {inline(paragraph.join('\n'), `p${blocks.length}`)}
      </p>
    );
  }

  return <div className="space-y-1.5">{blocks}</div>;
}

/** Lets the caller widen a bubble that holds a table. */
export const hasTable = (text: string) => {
  const lines = text.split('\n');
  return lines.some((line, index) => isTableRow(line) && index + 1 < lines.length && isDivider(lines[index + 1]));
};
