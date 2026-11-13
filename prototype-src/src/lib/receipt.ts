import { copy, t } from './copy';
import { lineId } from './layout';
import { sectionById, topSections, type SectionRole } from './sections';
import { firstOf } from './store';
import type { Collaborator, IssueState, SectionState } from './types';

// Frame 08's receipt and frame 11's per-line counts, all derived from state and the user's names.

export interface ReceiptRow { id: string; section: string; mono: boolean; wrote: string; reviewed: string; tested: string }

const ac = copy.allClear;

function nameFor(role: string, cs: Collaborator[]): string | undefined {
  if (role === 'you') return t(ac.you);
  if (['builder', 'reviewer', 'tester'].includes(role)) return firstOf(cs, role as Exclude<SectionRole, 'you'>)?.name;
  return undefined;
}

/** A top-level section counts as edited by you if it or any of its subsections was. */
export function editedByYou(id: string, sections: Record<string, SectionState>): boolean {
  const def = sectionById(id);
  return !!sections[id]?.editedByYou || !!def.children?.some((k) => sections[k]?.editedByYou);
}

export function receiptRows(cs: Collaborator[], sections: Record<string, SectionState>, issues: Record<number, IssueState>): ReceiptRow[] {
  return topSections(cs).map((def) => {
    const issueIds = (def.children ?? []).map((k) => sectionById(k).issue).filter(Boolean) as number[];
    const wrote = def.wrote.map((r) => nameFor(r, cs)).filter(Boolean) as string[];
    // "Builder + You" when you edited; the reviewer co-wrote it when you accepted its fix.
    if (editedByYou(def.id, sections) && !def.wrote.includes('you')) wrote.push(t(ac.you));
    if (issueIds.some((i) => issues[i]?.how === 'accepted')) {
      const r = nameFor('reviewer', cs);
      if (r && !wrote.includes(r)) wrote.push(r);
    }
    const rejected = issueIds.some((i) => issues[i]?.how === 'rejected');
    const reviewed = rejected ? t(ac.rejectedByYou) : def.reviewed === '—' || def.reviewed === 'Skimmed' ? def.reviewed : nameFor(def.reviewed, cs) ?? '—';
    const tested = def.tested === '—' ? '—' : nameFor(def.tested, cs) ?? '—';
    return { id: def.id, section: def.label, mono: def.mono, wrote: wrote.join(' + ') || '—', reviewed, tested };
  });
}

export function footnote(cs: Collaborator[], sections: Record<string, SectionState>): string {
  const n = topSections(cs).filter((d) => editedByYou(d.id, sections)).length;
  if (!firstOf(cs, 'tester') && n > 0) return t(ac.footnoteNoTester, { n: n === 1 ? '1 section' : `${n} sections` });
  if (n === 0) return t(ac.footnoteNone);
  if (n === 1) return t(ac.footnoteOne);
  if (n === 2) return t(ac.footnote, { n });
  return t(ac.footnoteMany, { n });
}

/** Plain-text receipt for the clipboard (Copy). */
export function receiptText(cs: Collaborator[], sections: Record<string, SectionState>, issues: Record<number, IssueState>): string {
  const rows = receiptRows(cs, sections, issues);
  const total = rows.length;
  const widths = [18, 24, 18];
  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(1, w - s.length));
  const [c1, c2, c3, c4] = ac.columns;
  return [
    t(ac.plainTitle, { repo: copy.project.repo, branch: copy.project.branch }).replace(/\s+·\s+/g, ' · '),
    t(ac.receiptMeta, { total }).replace(/\s+·\s+/g, ' · '),
    '',
    pad(c1, widths[0]) + pad(c2, widths[1]) + pad(c3, widths[2]) + c4,
    ...rows.map((r) => pad(r.section, widths[0]) + pad(r.wrote, widths[1]) + pad(r.reviewed, widths[2]) + r.tested),
    '',
    footnote(cs, sections),
  ].join('\n');
}

export interface CaughtLine { a: string; b: string; id: string; n: number }

/** Frame 11: caught counts only on lines that exist; missing lines' counts move to the first one, so the total stays 7. */
export function caughtPerLine(cs: Collaborator[], teammateId: string | null): CaughtLine[] {
  const idFor = (role: string) => (role === 'you' ? 'you' : role === 'teammate' ? teammateId ?? undefined : firstOf(cs, role as Exclude<SectionRole, 'you'>)?.id);
  const linked = (a: string, b: string) =>
    cs.some((c) => (c.id === a && c.connectsTo.includes(b)) || (c.id === b && c.connectsTo.includes(a)));
  const out: CaughtLine[] = [];
  let carry = 0;
  for (const row of copy.recap.perLine) {
    const a = idFor(row.a);
    const b = idFor(row.b);
    if (a && b && linked(a, b)) out.push({ a, b, id: lineId(a, b), n: row.n });
    else carry += row.n;
  }
  if (out.length) out[0].n += carry;
  return out;
}
