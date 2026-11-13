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
}

export type LineKind = 'connected' | 'working' | 'issue' | 'pending' | 'suggested' | 'cleared';

export interface Line {
  id: string;
  a: string;
  b: string;
  kind: LineKind;
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
}

export interface View {
  x: number;
  y: number;
  k: number;
}

/** M3: the reviewer's tester suggestion. 'skipped' when a tester already existed. */
export type Recommendation = 'none' | 'shown' | 'dismissed' | 'accepted' | 'skipped';
