// Timing constants from docs/flow-and-milestones.md, tuned in one place.
export const TIMING = {
  readyCardDelay: 600,
  recommendationDelay: 4000,
  issueDelay: 3000,
  recheckDelay: 2000,
  teammateAutoApprove: 20000,
  idleHint: 25000,
  replyThinking: [700, 1200] as const,
};

export const thinkingDelay = () => TIMING.replyThinking[0] + Math.random() * (TIMING.replyThinking[1] - TIMING.replyThinking[0]);
