import { useSyncExternalStore } from 'react';
import { questionFor, reviewersOf, useScenario } from './store';
import { topSections } from './sections';
import type { Collaborator } from './types';
import { resetLog } from './log';
import { startOver } from './reset';

// Feedback round 4: "Save constellation" keeps the team (and, if asked, this session's history) so it
// can be used again. Stored apart from the scenario state so a plain Start over keeps it; ?reset and
// "Start over, clear log" clear it with everything else.
const KEY = 'pmr:saved-teams';

export interface SavedSession {
  title: string;
  savedAt: number;
  merged: boolean;
  verified: number;
  total: number;
  reviewers: string[];
  conversations: { name: string; messages: { from: 'you' | 'teammate'; text: string }[] }[];
}

export interface SavedTeam {
  id: string;
  name: string;
  savedAt: number;
  members: Collaborator[];
  options: { agents: boolean; teammates: boolean; history: boolean; isDefault: boolean };
  sessions: SavedSession[];
}

const listeners = new Set<() => void>();
let cache: SavedTeam[] | null = null;

function read(): SavedTeam[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedTeam[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(teams: SavedTeam[]) {
  cache = teams;
  try {
    localStorage.setItem(KEY, JSON.stringify(teams));
  } catch {
    // Storage blocked: the list still lives for this page.
  }
  listeners.forEach((l) => l());
}

export function useSavedTeams(): SavedTeam[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
  );
}

/** This session as a history entry: progress, reviewers and each review conversation. */
export function snapshotSession(title: string): SavedSession {
  const s = useScenario.getState();
  const tops = topSections(s.collaborators);
  const mates = reviewersOf(s.collaborators).filter((m) => m.reviewStage);
  return {
    title,
    savedAt: Date.now(),
    merged: s.milestones.merged,
    verified: tops.filter((sec) => s.sections[sec.id]?.status === 'verified').length,
    total: tops.length,
    reviewers: mates.map((m) => m.name),
    conversations: mates.map((m) => ({
      name: m.name,
      messages: [
        { from: 'teammate' as const, text: questionFor(m).body },
        ...s.thread.filter((x) => x.with === m.id && s.thread.indexOf(x) >= (m.commentAt ?? 0)).map((x) => ({ from: x.from, text: x.text })),
      ],
    })),
  };
}

/** Members to keep: configuration only, none of this session's review state. */
function membersFor(cs: Collaborator[], opts: SavedTeam['options']): Collaborator[] {
  return cs
    .filter((c) => c.status === 'active' && (c.role === 'teammate' ? opts.teammates : opts.agents))
    .map(({ review: _r, reviewStage: _s, commentAt: _c, question: _q, ...c }) => ({ ...c, status: 'active' as const }));
}

export function saveTeam(input: { id?: string | null; name: string; options: SavedTeam['options']; sessionTitle: string }): SavedTeam {
  const teams = read();
  const existing = input.id ? teams.find((t) => t.id === input.id) : undefined;
  const session = input.options.history ? snapshotSession(input.sessionTitle) : null;
  const team: SavedTeam = {
    id: existing?.id ?? `team-${Date.now().toString(36)}`,
    name: input.name,
    savedAt: Date.now(),
    members: membersFor(useScenario.getState().collaborators, input.options),
    options: input.options,
    // Saving again replaces this session's entry rather than adding a duplicate.
    sessions: [
      ...(existing?.sessions ?? []).filter((x) => x.title !== input.sessionTitle),
      ...(session ? [session] : []),
    ],
  };
  const others = teams.filter((t) => t.id !== team.id).map((t) => (input.options.isDefault ? { ...t, options: { ...t.options, isDefault: false } } : t));
  write([team, ...others]);
  return team;
}

/**
 * Feedback round 5: after the merge, "Start a new session" resets the prototype (team, code, review)
 * like Start over. The session log and saved constellations stay; a saved constellation first takes
 * this finished session into its history, so the receipt and recap aren't lost.
 */
export function startNewSession(sessionTitle: string) {
  const s = useScenario.getState();
  const team = s.savedTeamId ? read().find((x) => x.id === s.savedTeamId) : undefined;
  if (team?.options.history) saveTeam({ id: team.id, name: team.name, options: team.options, sessionTitle });
  resetLog(true);
  startOver(true);
}
