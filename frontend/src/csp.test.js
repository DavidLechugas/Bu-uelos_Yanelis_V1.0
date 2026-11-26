import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('Content-Security-Policy', () => {
  it('autoriza solo el script inline del tema, con su hash actual', () => {
    const scripts = [...read('../index.html').matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    const hash = `sha256-${createHash('sha256').update(scripts[0][1]).digest('base64')}`;
    const csp = read('../public/_headers').match(/Content-Security-Policy: (.*)/)[1];
    expect(csp).toContain(`'${hash}'`);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
  });
});
