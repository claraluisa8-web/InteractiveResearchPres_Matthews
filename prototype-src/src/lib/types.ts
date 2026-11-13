export type AgentRole = 'builder' | 'reviewer' | 'tester' | 'teammate' | 'other';
export type Role = 'you' | AgentRole;

export interface Collaborator {
  id: string;
  role: AgentRole;
  name: string;
  /** Other agents only: Accessibility, Security, Docs, Performance, Custom… */
  otherType?: string;
  configuration: string;
  allowedToEdit: string[];
  crossTeamRequests: boolean;
  /** Ids this collaborator links to ('you' included). Lines are undirected. */
  connectsTo: string[];
  status: 'draft' | 'suggested' | 'active' | 'verified';
  addedAt: number;
  /** Index into the layout's slot table, fixed when the collaborator is created. */
  slot: number;
  /** Human teammates: their work email (feedback: a second identifier beside the name). */
  email?: string;
  /** Human teammate reviewing the pull request (frames 10–11). */
  review?: 'pending' | 'approved';
}

/** Not yet in the constellation: a draft being configured, or a teammate being added for the PR. */
export const isGhost = (c: { status: string }) => c.status === 'draft' || c.status === 'suggested';

export type LineKind = 'connected' | 'working' | 'issue' | 'pending' | 'suggested' | 'cleared';

export interface Line {
  id: string;
  a: string;
  b: string;
  kind: LineKind;
  /** Open issues on this line (issue kind only). */
  count?: number;
}

export interface Milestones {
  builderAdded: boolean;
  reviewerAdded: boolean;
  buildStarted: boolean;
  recommendationShown: boolean;
  issueRaised: boolean;
  sectionsOpened: boolean;
  sectionEdited: boolean;
  sectionSaved: boolean;
  allSectionsVerified: boolean;
  prOpened: boolean;
  teammateApproved: boolean;
  merged: boolean;
  /** M9: "Create pull request" clicked; the teammate's review is under way. */
  prCreated: boolean;
}

export interface ThreadMessage {
  from: 'you' | 'teammate';
  text: string;
  /** The teammate this message is with (threads live on each You and teammate line). */
  with?: string;
  attachments?: string[];
}

export type RightPanel = 'receipt' | 'pr' | 'recap' | null;

/** The teammate's review: reading the PR, comment posted, reading the user's reply, approved. */
export type ReviewStage = 'none' | 'reviewing' | 'commented' | 'reading' | 'approved';

export interface View {
  x: number;
  y: number;
  k: number;
}

/** M3: the reviewer's tester suggestion. 'skipped' when a tester already existed. */
export type Recommendation = 'none' | 'shown' | 'dismissed' | 'accepted' | 'skipped' | 'expired';

export interface SectionState {
  id: string;
  status: 'issues' | 'open' | 'verified';
  editedByYou: boolean;
}

export interface IssueState {
  id: number;
  status: 'open' | 'fixPreview' | 'savedAwaitingAgents' | 'resolved' | 'rejected';
  /** How it was resolved; the receipt reads this (phase 4). */
  how?: 'edited' | 'accepted' | 'rejected';
  /** The reviewer's last word after a recheck that didn't resolve it. */
  note?: string;
  /** Lines the accepted fix added, highlighted until the section is verified. */
  fixLines?: { line: number; text: string }[];
}
