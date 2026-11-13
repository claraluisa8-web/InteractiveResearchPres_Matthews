import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { copy, t } from './copy';
import { pickSlot } from './layout';
import type { AgentRole, Collaborator, Milestones, View } from './types';

export const IDENTITY_VIEW: View = { x: 0, y: 0, k: 1 };

const NO_MILESTONES: Milestones = {
  builderAdded: false, reviewerAdded: false, buildStarted: false, recommendationShown: false,
  issueRaised: false, sectionsOpened: false, sectionEdited: false, sectionSaved: false,
  allSectionsVerified: false, prOpened: false, teammateApproved: false, merged: false,
};

export interface Reply {
  id: number;
  speaker: string;
  role: AgentRole | 'bob';
  text: string;
  thinking: boolean;
}

export type MenuAnchor = 'plus' | 'composer';

interface ConfigureState {
  id: string;
  mode: 'new' | 'edit';
  focusName: boolean;
  prefillName?: string;
}

interface ScenarioState {
  collaborators: Collaborator[];
  milestones: Milestones;
  /** M1: the coach card is gone for good once anyone is added. */
  firstAdded: boolean;
  view: View;
  seq: number;

  // UI layers (not persisted)
  addMenu: { anchor: MenuAnchor; highlight?: AgentRole } | null;
  configure: ConfigureState | null;
  popover: string | null;
  /** Orb ringed from elsewhere (team rail row hover). */
  hoverId: string | null;
  specOpen: boolean;
  replies: Reply[];

  openAddMenu: (anchor: MenuAnchor, highlight?: AgentRole) => void;
  closeAddMenu: () => void;
  startDraft: (role: AgentRole, otherType?: string) => void;
  editCollaborator: (id: string, opts?: { focusName?: boolean; prefillName?: string }) => void;
  updateDraft: (patch: Partial<Collaborator>) => void;
  commitConfigure: (form: Partial<Collaborator>) => void;
  cancelConfigure: () => void;
  removeCollaborator: (id: string) => void;
  openPopover: (id: string | null) => void;
  setHoverId: (id: string | null) => void;
  setSpecOpen: (open: boolean) => void;
  setView: (view: View) => void;
  pushReply: (reply: Omit<Reply, 'id'>) => number;
  updateReply: (id: number, patch: Partial<Reply>) => void;
  dismissReply: (id: number) => void;
}

export const active = (cs: Collaborator[]) => cs.filter((c) => c.status !== 'draft');
export const firstOf = (cs: Collaborator[], role: AgentRole) =>
  active(cs).filter((c) => c.role === role).sort((a, b) => a.addedAt - b.addedAt)[0];

export function defaultName(role: AgentRole, otherType?: string) {
  if (role === 'other' && otherType && otherType !== 'Custom…') {
    return t(copy.constellation.otherDefaultName, { type: otherType });
  }
  return copy.roles[role].defaultName;
}

/** Auto-connect rules (flow-and-milestones.md): prefilled into CONNECTS TO, still toggleable. */
export function defaultConnects(role: AgentRole, cs: Collaborator[]): string[] {
  const builder = firstOf(cs, 'builder');
  const reviewer = firstOf(cs, 'reviewer');
  const list = active(cs);
  switch (role) {
    case 'builder':
      return [
        'you',
        ...(reviewer ? [reviewer.id] : []),
        // Other agents added before any builder pick it up now.
        ...list.filter((c) => c.role === 'other' && !list.some((b) => b.role === 'builder' && c.connectsTo.includes(b.id))).map((c) => c.id),
      ];
    case 'reviewer':
      return [
        'you',
        ...(builder ? [builder.id] : []),
        ...list.filter((c) => c.role === 'tester' && !list.some((r) => r.role === 'reviewer' && c.connectsTo.includes(r.id))).map((c) => c.id),
      ];
    case 'tester':
      return reviewer ? [reviewer.id] : ['you'];
    case 'teammate':
      return ['you'];
    case 'other':
      return ['you', ...(builder ? [builder.id] : [])];
  }
}

/** A collaborator with no lines left (e.g. its reviewer was removed) falls back to You. */
function reattachOrphans(cs: Collaborator[]): Collaborator[] {
  return cs.map((c) => {
    const linked = c.connectsTo.length > 0 || cs.some((o) => o.connectsTo.includes(c.id));
    return linked ? c : { ...c, connectsTo: ['you'] };
  });
}

function roleMilestones(cs: Collaborator[], m: Milestones): Milestones {
  const list = active(cs);
  return {
    ...m,
    builderAdded: m.builderAdded || list.some((c) => c.role === 'builder'),
    reviewerAdded: m.reviewerAdded || list.some((c) => c.role === 'reviewer'),
  };
}

export const useScenario = create<ScenarioState>()(
  persist(
    (set, get) => ({
      collaborators: [],
      milestones: NO_MILESTONES,
      firstAdded: false,
      view: IDENTITY_VIEW,
      seq: 1,
      addMenu: null,
      configure: null,
      popover: null,
      hoverId: null,
      specOpen: false,
      replies: [],

      openAddMenu: (anchor, highlight) => set({ addMenu: { anchor, highlight }, popover: null }),
      closeAddMenu: () => set({ addMenu: null }),

      startDraft: (role, otherType) => {
        const { collaborators, seq } = get();
        const kept = collaborators.filter((c) => c.status !== 'draft');
        const id = `${role}-${seq}`;
        const draft: Collaborator = {
          id,
          role,
          name: defaultName(role, otherType),
          otherType: role === 'other' ? otherType ?? copy.roles.other.subtypes[0] : undefined,
          configuration: role === 'teammate' ? '' : copy.roles[role].defaultConfig ?? copy.configurePanel.fields.configurationOptions[0],
          allowedToEdit: [...((copy.roles[role] as { allowedToEdit?: string[] }).allowedToEdit ?? [])],
          crossTeamRequests: false,
          connectsTo: defaultConnects(role, kept),
          status: 'draft',
          addedAt: Date.now(),
          slot: pickSlot(role, kept.map((c) => c.slot)),
        };
        set({
          collaborators: [...kept, draft],
          seq: seq + 1,
          addMenu: null,
          popover: null,
          configure: { id, mode: 'new', focusName: false },
        });
      },

      editCollaborator: (id, opts = {}) =>
        set((s) => ({
          collaborators: s.collaborators.filter((c) => c.status !== 'draft'),
          configure: { id, mode: 'edit', focusName: !!opts.focusName, prefillName: opts.prefillName },
          popover: null,
          addMenu: null,
        })),

      updateDraft: (patch) =>
        set((s) => ({
          collaborators: s.collaborators.map((c) => (c.id === s.configure?.id && c.status === 'draft' ? { ...c, ...patch } : c)),
        })),

      commitConfigure: (form) => {
        const { configure, collaborators, milestones } = get();
        if (!configure) return;
        const target = collaborators.find((c) => c.id === configure.id);
        if (!target) return set({ configure: null });
        const name = form.name?.trim() || defaultName(target.role, form.otherType ?? target.otherType);
        const next = reattachOrphans(
          collaborators.map((c) =>
            c.id === target.id
              ? { ...c, ...form, name, status: c.status === 'draft' ? 'active' : c.status }
              // Dropping a connection in CONNECTS TO removes it from both ends.
              : form.connectsTo && !form.connectsTo.includes(c.id) && c.connectsTo.includes(target.id)
                ? { ...c, connectsTo: c.connectsTo.filter((x) => x !== target.id) }
                : c,
          ),
        );
        set({ collaborators: next, configure: null, firstAdded: true, milestones: roleMilestones(next, milestones) });
      },

      cancelConfigure: () =>
        set((s) => ({ collaborators: s.collaborators.filter((c) => c.status !== 'draft'), configure: null })),

      removeCollaborator: (id) =>
        set((s) => ({
          collaborators: reattachOrphans(
            s.collaborators.filter((c) => c.id !== id).map((c) => ({ ...c, connectsTo: c.connectsTo.filter((x) => x !== id) })),
          ),
          popover: null,
        })),

      openPopover: (id) => set({ popover: id, addMenu: null }),
      setHoverId: (id) => set({ hoverId: id }),
      setSpecOpen: (open) => set({ specOpen: open, popover: null }),
      setView: (view) => set({ view }),

      pushReply: (reply) => {
        const id = get().seq;
        set((s) => ({ seq: s.seq + 1, replies: [...s.replies, { ...reply, id }].slice(-3) }));
        return id;
      },
      updateReply: (id, patch) => set((s) => ({ replies: s.replies.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      dismissReply: (id) => set((s) => ({ replies: s.replies.filter((r) => r.id !== id) })),
    }),
    {
      name: 'pmr:state',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        collaborators: s.collaborators.filter((c) => c.status !== 'draft'),
        milestones: s.milestones,
        firstAdded: s.firstAdded,
        view: s.view,
        seq: s.seq,
      }),
    },
  ),
);
