// Timing constants from docs/flow-and-milestones.md, tuned in one place.
export const TIMING = {
  readyCardDelay: 600,
  recommendationDelay: 4000,
  issueDelay: 3000,
  recheckDelay: 2000,
  // Dana reviews before commenting, then reads the user's reply before approving (feedback round 1:
  // no approval without a reply; the old 20 s auto-approve is gone, the idle hint covers a stall).
  teammateReview: 4000,
  teammateReadReply: 3500,
  // Feedback round 4: several reviewers comment a little apart; approval merges after a beat of success.
  reviewStagger: 2500,
  autoMerge: 2200,
  idleHint: 25000,
  replyThinking: [700, 1200] as const,
};

export const thinkingDelay = () => TIMING.replyThinking[0] + Math.random() * (TIMING.replyThinking[1] - TIMING.replyThinking[0]);
