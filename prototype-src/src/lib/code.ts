// Dummy source files, bundled as raw text (BRIEF: files are seeded from handoff/data/code).
const files = import.meta.glob('../../../handoff/data/code/**/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function codeFile(name: string): string {
  const key = Object.keys(files).find((k) => k.endsWith(`/${name}`));
  return key ? files[key] : '';
}
