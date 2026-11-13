import { codeFile } from './code';
import { copy } from './copy';
import type { Collaborator, IssueState, SectionState } from './types';

// Sections, issues and their live line ranges (frames 06b and 07).
// Ranges come from the current file text through the anchors in scenario.json,
// so they stay correct while the user edits.

export type SectionRole = 'you' | 'builder' | 'reviewer' | 'tester';

export interface SectionDef {
  id: string;
  label: string;
  mono: boolean;
  file: string;
  /** Files shown as tabs in the editor (generated DTOs span four). */
  files: string[];
  line: SectionRole[];
  wrote: SectionRole[];
  reviewed: string;
  tested: string;
  initial: SectionState['status'];
  issue: number | null;
  tag?: string;
  parent?: string;
  children?: string[];
  onlyIfRole?: SectionRole;
  summary?: string;
  specLines?: [number, number];
}

const DTO_FILES = ['CreatePlanRequest.java', 'PlanResponse.java', 'PlanStatus.java', 'UpdatePlanStatusRequest.java'];

type RawSub = { id: string; label: string; issue: number | null; tag: string; summary?: { text: string }; specExcerpt?: { lines: number[] } };
type RawSection = (typeof copy.sections)[number] & {
  subsections?: RawSub[];
  summary?: { text: string };
  specExcerpt?: { lines: number[] };
  onlyIfRolePresent?: string;
};

function build(): SectionDef[] {
  const out: SectionDef[] = [];
  for (const raw of copy.sections as RawSection[]) {
    const files = raw.id === 'generatedDtos' ? DTO_FILES : [raw.file];
    const base: SectionDef = {
      id: raw.id,
      label: raw.label,
      mono: raw.mono,
      file: files[0],
      files,
      line: raw.line as SectionRole[],
      wrote: raw.wrote as SectionRole[],
      reviewed: raw.reviewed,
      tested: raw.tested,
      initial: raw.initial as SectionState['status'],
      issue: null,
      onlyIfRole: raw.onlyIfRolePresent as SectionRole | undefined,
      summary: raw.summary?.text,
      specLines: raw.specExcerpt ? [raw.specExcerpt.lines[0], raw.specExcerpt.lines[1]] : undefined,
      children: raw.subsections?.map((s) => s.id),
    };
    out.push(base);
    for (const sub of raw.subsections ?? []) {
      out.push({
        ...base,
        id: sub.id,
        label: sub.label,
        mono: false,
        issue: sub.issue,
        tag: sub.tag,
        parent: raw.id,
        children: undefined,
        initial: sub.issue ? 'issues' : 'open',
        summary: sub.summary?.text,
        specLines: sub.specExcerpt ? [sub.specExcerpt.lines[0], sub.specExcerpt.lines[1]] : undefined,
      });
    }
  }
  return out;
}

export const SECTIONS = build();
export const sectionById = (id: string) => SECTIONS.find((s) => s.id === id)!;
export const ISSUES = copy.issues;
export const issueById = (n: number) => ISSUES.find((i) => i.id === n)!;
export const ISSUE_SECTION_IDS = SECTIONS.filter((s) => s.issue).map((s) => s.id);

/** Top-level sections that exist for this team (contract tests only with a tester). */
export function topSections(cs: Collaborator[]): SectionDef[] {
  return SECTIONS.filter((s) => !s.parent && (!s.onlyIfRole || cs.some((c) => c.role === s.onlyIfRole && c.status === 'active')));
}

export function initialSections(): Record<string, SectionState> {
  return Object.fromEntries(SECTIONS.map((s) => [s.id, { id: s.id, status: s.initial, editedByYou: false }]));
}

export function initialIssues(): Record<number, IssueState> {
  return Object.fromEntries(ISSUES.map((i) => [i.id, { id: i.id, status: 'open' }]));
}

// ---------------------------------------------------------------------------
// Ranges

const findLine = (lines: string[], needle: string, from = 0) => {
  for (let i = from; i < lines.length; i++) if (lines[i].includes(needle)) return i;
  return -1;
};

/** Brace-matched end of the method whose signature starts at or after `from`. */
function braceEnd(lines: string[], from: number): number {
  let depth = 0;
  let opened = false;
  for (let i = from; i < lines.length; i++) {
    // Braces inside string literals ("/plans/{id}") and comments don't count.
    const code = lines[i].replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
    for (const ch of code) {
      if (ch === '{') { depth++; opened = true; }
      if (ch === '}') depth--;
    }
    if (opened && depth <= 0) return i;
  }
  return lines.length - 1;
}

export interface Range { start: number; end: number } // 1-based, inclusive

function range0(s: number, e: number): Range | null {
  return s < 0 ? null : { start: s + 1, end: Math.max(s, e) + 1 };
}

/** The create call; matches the original and the reviewer's fix (create(request, key)). */
const createLine = (lines: string[], from: number) => findLine(lines, 'planService.create(', from);

export function sectionRange(id: string, text: string): Range | null {
  const lines = text.split('\n');
  const n = lines.length;
  const whole = { start: 1, end: Math.max(1, n - (lines[n - 1] === '' ? 1 : 0)) };
  const post = findLine(lines, '@PostMapping("/plans")');
  switch (id) {
    case 'createPlan':
      return range0(post, braceEnd(lines, post));
    case 'idempotencyKey':
      return range0(post, createLine(lines, post));
    case 'planCreation': {
      const c = createLine(lines, post);
      return range0(c, c);
    }
    case 'createdResponse': {
      // The first return after the create call, through the line that ends the statement.
      const c = createLine(lines, post);
      const end = post >= 0 ? braceEnd(lines, post) : -1;
      let r = -1;
      for (let i = Math.max(c, post) + 1; i <= end; i++) if (lines[i].trim().startsWith('return')) { r = i; break; }
      if (r < 0) return null;
      let e = r;
      while (e < end && !lines[e].trim().endsWith(';')) e++;
      return range0(r, e);
    }
    case 'listPlans': {
      const s = findLine(lines, '@GetMapping("/plans")');
      return range0(s, braceEnd(lines, s));
    }
    case 'updatePlanStatus': {
      const s = findLine(lines, '@PatchMapping');
      return range0(s, braceEnd(lines, s));
    }
    case 'amountHandling': {
      const s = findLine(lines, '// Amounts are stored in cents');
      return range0(s, braceEnd(lines, s));
    }
    case 'errorResponses': {
      const s = findLine(lines, '@ExceptionHandler');
      let last = -1;
      for (let i = n - 1; i > s; i--) if (/^ {2}}\s*$/.test(lines[i])) { last = i; break; }
      return range0(s, last);
    }
    default:
      return whole;
  }
}

/** Never null: a lost anchor falls back to the whole file rather than failing. */
export function safeRange(id: string, text: string): Range {
  const r = sectionRange(id, text);
  if (r) return r;
  const n = text.split('\n').length;
  return { start: 1, end: n };
}

// ---------------------------------------------------------------------------
// Issue checks (scenario.json issues[].resolvedWhen)

function createPlanBody(text: string): string[] {
  const lines = text.split('\n');
  const r = sectionRange('createPlan', text);
  return r ? lines.slice(r.start - 1, r.end) : [];
}

export function issueMet(issue: number, text: string): boolean {
  const body = createPlanBody(text);
  if (issue === 1) {
    // Any reasonable check of the key, in the method body, before the plan is created.
    const sigEnd = body.findIndex((l) => l.trim().endsWith(') {'));
    const create = body.findIndex((l) => l.includes('planService.create('));
    const before = body.slice(sigEnd + 1, create < 0 ? body.length : create);
    return before.some(
      (l) => !l.trim().startsWith('//') && /idempotencyKey/.test(l) && /\bif\b|\?|while|throw|exists|contains|equals|check|valid|find|get|seen|isDuplicate|requireNonNull/i.test(l),
    );
  }
  if (issue === 2) return body.some((l) => !l.trim().startsWith('//') && /Location|URI|ResponseEntity\s*\.\s*created\s*\(/.test(l));
  return false;
}

// ---------------------------------------------------------------------------
// The reviewer's fixes, applied to whatever the user has now (data/code/PlanController.reviewer-fix.java)

export function applyFix(issue: number, text: string): string {
  const lines = text.split('\n');
  if (issue === 1) {
    const post = findLine(lines, '@PostMapping("/plans")');
    const c = createLine(lines, post);
    if (c < 0) return text;
    const indent = lines[c].match(/^\s*/)?.[0] ?? '    ';
    const block = [
      `${indent}// The spec returns 409 when a key is reused, so the handler checks it.`,
      `${indent}if (planService.existsByKey(idempotencyKey)) {`,
      `${indent}  return ResponseEntity.status(HttpStatus.CONFLICT)`,
      `${indent}      .body(PlanResponse.duplicate(idempotencyKey));`,
      `${indent}}`,
    ];
    const gateway = findLine(lines, '// Gateway rejects duplicate requests upstream', post);
    lines[c] = lines[c].replace('planService.create(request)', 'planService.create(request, idempotencyKey)');
    if (gateway >= 0 && gateway < c) lines.splice(gateway, 1, ...block);
    else lines.splice(c, 0, ...block);
    return lines.join('\n');
  }
  if (issue === 2) {
    const post = findLine(lines, '@PostMapping("/plans")');
    const r = findLine(lines, 'return ResponseEntity.status(HttpStatus.CREATED)', post);
    if (r < 0) return text;
    lines[r] = lines[r].replace('ResponseEntity.status(HttpStatus.CREATED)', 'ResponseEntity.created(URI.create("/v1/plans/" + plan.id()))');
    if (findLine(lines, 'import java.net.URI;') < 0) {
      const anchor = findLine(lines, 'import jakarta.validation.Valid;');
      lines.splice(anchor >= 0 ? anchor + 1 : 2, 0, 'import java.net.URI;');
    }
    return lines.join('\n');
  }
  return text;
}

// ---------------------------------------------------------------------------
// Line diff (LCS), used for authorship marks, "not saved yet" notes and the fix preview

export type DiffRow = { kind: 'same' | 'add' | 'del'; text: string; newLine?: number };

export function diffLines(a: string, b: string): DiffRow[] {
  const x = a.split('\n');
  const y = b.split('\n');
  const m = x.length;
  const n = y.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (x[i] === y[j]) { rows.push({ kind: 'same', text: y[j], newLine: j + 1 }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ kind: 'del', text: x[i] }); i++; }
    else { rows.push({ kind: 'add', text: y[j], newLine: j + 1 }); j++; }
  }
  while (i < m) rows.push({ kind: 'del', text: x[i++] });
  while (j < n) { rows.push({ kind: 'add', text: y[j], newLine: j + 1 }); j++; }
  return rows;
}

/** 1-based lines in `b` that aren't in `a`. */
export function changedLines(a: string, b: string): Set<number> {
  return new Set(diffLines(a, b).filter((r) => r.kind === 'add').map((r) => r.newLine!));
}

/** The builder's original text for a file, before anyone touched it. */
export function originalFile(file: string, builderName: string): string {
  return codeFile(file).replace(/Generated by Builder/g, `Generated by ${builderName}`);
}

/** Lines of the spec (read-only excerpts in the editor's left column). */
export function specLines(from: number, to: number): { n: number; text: string }[] {
  const lines = codeFile('recurring-investments.yaml').split('\n');
  return lines.slice(from - 1, to).map((text, i) => ({ n: from + i, text }));
}
