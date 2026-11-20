// Research structure for the tree.
// Each item needs a "name". Add "children" to make it a category that opens and closes,
// or a "note" to show text in the side panel when it's clicked. Add "short" for a shorter
// label in the sidebar outline (the tree and notes panel still show the full name).
// Add "map" to attach an SVG that opens over the chart (marked with a map icon). Any element in the
// SVG whose id is listed under "hotspots" becomes clickable and shows its note. Figma and
// Illustrator use layer names as ids when exporting SVG.
// Add "prototype" ({ src, title }) to make the topic the pearl orb that opens a live prototype
// in an overlay (see prototypeviewer.js).
// Add "response: true" for a response to a problem (the dashed boxes in the mind map);
// it's drawn with a dashed circle and italic label.
// Add "stage" (1-8) on a top-level branch to put it on the guided path, in that order.
// "revised" on a How Might We question stores alternative wording; it isn't shown.
// A note can hold several paragraphs, separated by "\n".

// Shorthand for a response item.
const response = name => ({ name, response: true });

const data = {
  name: "Senior software engineers need a way to increase the verification efficacy of agent-generated outputs in order to extend agent trust while still being able to answer for what it produces.",
  short: "Problem statement",
  note: "This is the problem the research arrived at. Follow the stages in order, or open any branch to explore.",
  children: [
    {
      stage: 1,
      name: "Research Approach",
      note: "Who we heard from and how the research was analyzed, before any mapping or design.",
      children: [
        {
          name: "Who we heard from",
          note: "32 participants: 20 engineers, 7 product designers, 2 product managers and 3 students.\nEngineers ranged from early-career to principal and director level, at fintech platforms, a large regulated brokerage and IBM Research."
        },
        {
          name: "How we listened",
          note: "Semi-structured interviews with engineers, designers and a product manager, followed by a short engineer survey focused on the concrete details of day-to-day AI-assisted work."
        },
        {
          name: "How we analyzed it",
          note: "Quotes were grouped by hand, the groups were named as themes, and the themes were rolled up into metathemes. Five separate codebooks were merged into one master codebook of 14 themes and 5 metathemes."
        }
      ]
    },
    {
      stage: 2,
      name: "What We Heard",
      note: "Five metathemes came out of the research. The first two show up for almost every engineer: the job has shifted from writing code to directing and checking it.",
      children: [
        {
          name: "Directing, Not Doing",
          note: "The work is shifting from producing code to defining intent and equipping agents to carry it out.\nRaised by 19 of 20 engineers. Writing specs, gathering context and building personal agent setups are now core parts of the job."
        },
        {
          name: "Checking Is the Job",
          note: "People stay answerable for agent output, so verification grows into the bulk of the work, while the tools show little of what agents actually did.\nRaised by 19 of 20 engineers. Agents drifting off course is the single most common pain point."
        },
        {
          name: "Judgment Comes From Experience",
          note: "AI is only as good as the person overseeing it, and that judgment depends on expertise the new workflow may stop building.\nRaised by 15 of 20 engineers."
        },
        {
          name: "Work Moves Between People",
          note: "AI is redrawing who does what. Handoffs, visibility and the flow of knowledge are being rebuilt around it.\nRaised by 17 of 20 engineers. Much of the knowledge agents lack still lives in people."
        },
        {
          name: "Speed Meets Its Limits",
          note: "AI speeds up building, but expectations, quality and the parts of the process that need time push back.\nRaised by 10 of 20 engineers. Review and teammates struggle to keep pace with generation."
        },
        {
          name: "Pain Point Map",
          note: "Where each role feels the pain, by workflow phase. Click a chart to read it.",
          map: {
            src: "maps/pain-points.svg",
            hotspots: {
              "pp-engineers": { title: "Engineers", note: "Pain peaks in Build, where agents drift and overreach (6 of 10 engineers), and continues into Review and Ship, where work can't be traced to its source (3 of 10). Based on the 10 engineers whose interviews were coded for pain." },
              "pp-designers": { title: "Designers", note: "Designers' pain centers on setting up their own agent workflows and on the handoff to engineering. Across every phase, the collaboration rhythm they relied on is thinning out." },
              "pp-pms": { title: "Product managers", note: "Only two PMs, so these are signals rather than trends. Both point to collaboration rhythm and to knowledge that lives in people rather than in tools." }
            }
          }
        }
      ]
    },
    {
      stage: 3,
      name: "Mapping",
      note: "Four maps of the system around the senior engineer: who influences her, what she touches, how her work unfolds, and why things go wrong.",
      children: [
        {
          name: "Stakeholder Map",
          note: "Everyone who shapes, pressures or depends on the senior engineer's work, in three rings. Click any highlighted item.",
          map: {
            src: "maps/stakeholder-map.svg",
            hotspots: {
              "sh-senior-engineer": { title: "Senior software engineer", note: "At the center. She directs and audits agent output and answers for what ships, whoever wrote it." },
              "sh-sets-expectations": { title: "Sets expectations", note: "Outer ring: leadership, regulators, policy and vendors who set the rules, and the pressure to adopt AI." },
              "sh-shapes-the-ask": { title: "Shapes the ask", note: "Middle ring: clients, product and management, who define what gets built and negotiate its scope." },
              "sh-produces-output": { title: "Produces output", note: "Inner ring: the agents, tools and engineers whose work she has to verify." },
              "sh-coding-agent": { title: "Coding agent", note: "Writes code from her direction and context. It can't be held accountable, so responsibility for its output lands on her." },
              "sh-review-agent": { title: "Review agent", note: "A second agent that pre-reviews the coding agent's work. Engineers use it as an independent check, not a replacement for their own review." },
              "sh-instruction-files": { title: "Instruction files", note: "Standing rules loaded on every task. They constrain the coding agent, and keeping them current is now part of her job." },
              "sh-knowledge-base": { title: "Knowledge base", note: "Where approved decisions are recorded so future agents inherit them. Much of the context agents need still lives in people instead." },
              "sh-code-reviewers": { title: "Code reviewers", note: "Teammates who review her pull requests. They see what changed, but rarely what the agent did or why." },
              "sh-engineering-manager": { title: "Engineering manager", note: "Assigns the work and signs off on it, and increasingly expects more output because AI exists." },
              "sh-product-manager": { title: "Product manager", note: "Negotiates requirements and coordinates across teams. Intent can get lost between the original ask and the agent." },
              "sh-client": { title: "Client", note: "Pushes requirements into the work and holds the engineer to explaining and defending the output." },
              "sh-cto": { title: "CTO", note: "Sets the organization's AI direction and partners with approved vendors. Leadership expects more output from AI." },
              "sh-policies": { title: "Policies", note: "Shaped by regulators and industry trends, they decide which AI tools engineers may use and how." },
              "sh-auditors": { title: "Auditors", note: "Require attribution: who or what wrote a change has to be traceable after the fact." },
              "sh-ai-vendors": { title: "AI vendors", note: "Supply the approved tools. Which vendor an organization partners with decides which agents engineers can use." }
            }
          }
        },
        {
          name: "Ecosystem Map",
          note: "The needs, interactions and touchpoints around one goal: auditable, transparent agent output. Four phases, read clockwise from Work Intake.",
          map: {
            src: "maps/ecosystem-map.svg",
            hotspots: {
              "eco-center": { title: "Auditable agentic output and transparency", note: "The need at the center of every phase: agent output the engineer can audit and explain." },
              "eco-work-intake": { title: "01 Work intake", note: "Work arrives through standups, tickets and design handoff, and context is gathered for the agent." },
              "eco-executing": { title: "02 Executing", note: "Agents build from the spec while engineers plan, monitor progress and redirect when needed." },
              "eco-testing-review": { title: "03 Testing and review", note: "Where The Pre-Merge Review sits. Engineers review diffs, run tests and look for second opinions before sign-off." },
              "eco-deployment": { title: "04 Deployment", note: "Code is merged and released. Authorship and traceability have to survive past the merge, and usually don't." },
              "eco-requirements-review": { title: "Requirements review", note: "Checking requirements before work starts. Gaps left here become the agent's guesses later." },
              "eco-context-gathering": { title: "Context gathering", note: "Pulling designs, docs and repos together so the agent has what it needs. Much of the setup time goes here." },
              "eco-spec-driven-development": { title: "Spec-driven development", note: "Writing a detailed spec first, so the agent builds against something that can be checked." },
              "eco-plan-review": { title: "Plan review", note: "Reviewing the agent's plan before it writes code: the cheapest point to catch a wrong direction." },
              "eco-progress-monitoring": { title: "Progress monitoring", note: "Watching the agent work. Tools show little of what it is doing, so this is effort with low visibility." },
              "eco-mid-task-redirection": { title: "Mid-task redirection", note: "Steering an agent that has drifted without losing the work already done." },
              "eco-line-by-line-diff-review": { title: "Line-by-line diff review", note: "Today's default: reading every line. Thorough, but it erases the speed agents add." },
              "eco-cross-model-checking": { title: "Cross-model checking", note: "Running the work past a different model to catch what the first one missed." },
              "eco-fresh-session-review": { title: "Fresh-session review", note: "Asking a new agent session, with clean context, to review the work." },
              "eco-pull-request-review": { title: "Pull request review", note: "Teammates review the change. They see the diff, not the agent's reasoning." },
              "eco-dev-done-sign-off": { title: "Dev-done sign-off", note: "The engineer declares the work done and becomes answerable for it." },
              "eco-authorship-tagging": { title: "Authorship tagging", note: "Marking which code a person wrote and which an agent wrote. Rarely done today, and lost after merge." },
              "eco-traceability-audit": { title: "Traceability audit", note: "Reconstructing what happened and why after the fact, for audits or incidents." },
              "eco-commit-merge": { title: "Commit and merge", note: "Where agent and human work become one history, and attribution usually disappears." }
            }
          }
        },
        {
          name: "Journey Map",
          note: "One task, six phases, from directing the agent to revising after it goes wrong. Click a phase.",
          map: {
            src: "maps/journey-map.svg",
            hotspots: {
              "jm-direction": { title: "Direction", note: "She gives the agent the spec and context. Clear constraints help, but gathering context takes time." },
              "jm-generation": { title: "Generation", note: "She watches the agent build. Optimistic about the speed, anxious about whether it's right, with little visibility into what it's doing." },
              "jm-pre-merge-review": { title: "Pre-merge review", note: "Review is meticulous and line by line, and judgment lands entirely on her. This is the moment the concept is designed for." },
              "jm-integration": { title: "Integration", note: "She commits the code. Her work and the agent's become indistinguishable, and overlooked mistakes get buried." },
              "jm-realization": { title: "Realization", note: "She finds the agent took a wrong path that review missed. Trust in the agent, and in herself, drops. The low point of the journey." },
              "jm-revision": { title: "Revision", note: "She fixes the context or prompt and reruns. Repetitive and tiring, but each fix can make the next run better." }
            }
          }
        },
        {
          name: "Mind Map",
          children: [
            {
              name: "Verification Efficacy",
              children: [
                {
                  name: "Fault",
                  children: [
                    {
                      name: "Human/Context Error",
                      children: [
                        {
                          name: "Prompt",
                          children: [
                            { name: "Ambiguous/incomplete instructions", children: [response("Reset")] },
                            { name: "Conflicting instructions" }
                          ]
                        },
                        {
                          name: "Session Management",
                          children: [
                            { name: "Handoff gaps", children: [response("Ask a coworker")] },
                            { name: "Context window drift", children: [response("Ask original ticket author")] }
                          ]
                        },
                        {
                          name: "Requirements & Scope",
                          children: [
                            { name: "Under-specification" },
                            { name: "Scope creep", children: [response("Manual check/review")] }
                          ]
                        },
                        {
                          name: "Environment/Configuration",
                          children: [
                            { name: "Overly broad agent permissions" },
                            { name: "Local environment/version mismatch" }
                          ]
                        },
                        {
                          name: "Libraries",
                          children: [
                            { name: "Deprecated/mismatched version", children: [response("Manual check/review")] },
                            { name: "Unapproved library introduction", children: [response("Flagged by manager")] }
                          ]
                        },
                        {
                          name: "Repositories",
                          children: [
                            { name: "Outdated pattern referenced", children: [response("Ask a coworker")] },
                            { name: "Wrong repo/model used for reference" }
                          ]
                        },
                        {
                          name: "Review Discipline",
                          children: [
                            { name: "Overtrust & blind approval" },
                            { name: "Undertrust & redundant rework" }
                          ]
                        }
                      ]
                    },
                    {
                      name: "Agent Error",
                      children: [
                        {
                          name: "Domain/Business Logic",
                          children: [
                            { name: "Business logic mismatch", children: [response("Ask domain expert")] },
                            { name: "Edge case blindness" }
                          ]
                        },
                        {
                          name: "Code Quality/Redundancy",
                          children: [
                            { name: "Dead-unreachable code", children: [response("Manual check/review")] },
                            { name: "Duplicate code" }
                          ]
                        },
                        {
                          name: "Memory/Continuity",
                          children: [
                            { name: "Dropped/forgotten constraints", children: [response("Manual check/review")] },
                            { name: "Memory errors", children: [response("Reset")] }
                          ]
                        },
                        {
                          name: "Error Handling/Robustness",
                          children: [
                            { name: "Lack of error communication", children: [response("Manual check/review")] }
                          ]
                        },
                        {
                          name: "Fabrication/Confidence",
                          children: [
                            { name: "Overconfidence, no uncertainty signal" },
                            { name: "Hallucination/fabricated detail", children: [response("Retry in new model + Manual check/review")] },
                            { name: "Lies/false claim maintained under challenge" }
                          ]
                        },
                        {
                          name: "External Integration",
                          children: [
                            {
                              name: "API & External service integration",
                              children: [
                                { name: "Fake inputs" },
                                { name: "Wrong endpoint/version assumed", children: [response("Manual check/review")] }
                              ]
                            }
                          ]
                        },
                        {
                          name: "Codebase Awareness/Scale",
                          children: [
                            { name: "Creates algorithm from scratch → file overwhelm", children: [response("Manual check/review")] },
                            { name: "Misses existing utility → reinvents", children: [response("Manual check/review")] }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "Authorship",
                  children: [
                    {
                      name: "Governance & Visibility",
                      children: [
                        { name: "Not visible to reviewers" },
                        { name: "Not queryable for audit/compliance" }
                      ]
                    },
                    {
                      name: "Capture Timing",
                      children: [
                        { name: "No retroactive capture for backlog" },
                        { name: "Only live, lost after merge", children: [response("Only live, lost after merge")] }
                      ]
                    },
                    {
                      name: "Attribution Granularity",
                      children: [
                        { name: "Line-level insufficient for mixed edits" }
                      ]
                    },
                    {
                      name: "Persistence Across Changes",
                      children: [
                        { name: "Lost when merged" },
                        { name: "Lost through refactors/rebases" }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      stage: 4,
      name: "The User",
      note: "Who the concept is for: the senior engineer who directs agents and answers for their output.",
      children: [
        {
          name: "User Model: The Conductor",
          short: "User model",
          note: "Who she is, how she works today, what she's trying to achieve, and how she thinks about agents. Click a column.",
          map: {
            src: "maps/user-model.svg",
            hotspots: {
              "um-who": { title: "Who", note: "A senior to principal engineer in a large, often regulated enterprise. She still codes, but spends more of her day directing and checking agents than writing." },
              "um-workflow": { title: "Current workflow", note: "Define, set up and plan, build, verify, hand off and ship. Agents speed up building; review is where the time goes." },
              "um-goal": { title: "Goal", note: "Catch agent mistakes before merge, avoid costly rework, and keep a consistent, trustworthy workflow." },
              "um-mental-model": { title: "Mental model", note: "She directs, the agents execute, and she answers for the result. Agent output is fast and capable, and wrong until proven right." }
            }
          }
        }
      ]
    },
    {
      stage: 5,
      name: "How Might We...",
      note: "Four questions that turn the problem into design opportunities. Each note says where the prototype answers it.",
      children: [
        {
          name: "...help users differentiate their code from agent code?",
          revised: "...help users differentiate their code from agent code?",
          note: "In the prototype: dashed lines mark agent-written code and solid lines mark yours, the editor says who wrote and who edited each file, and the verification receipt records who wrote each section."
        },
        {
          name: "...demonstrate user-based vs. agent errors when output is unexpected or broken?",
          revised: "...show where an unexpected result came from: the spec, the context the user gave, or the agent?",
          note: "In the prototype: a red line appears between the two agents that disagree, and each issue shows what the builder says, what the spec says and what the reviewer says, side by side, so the spec settles it."
        },
        {
          name: "...expand the user's prompt/context testing in multiple agent models?",
          revised: "...give users an independent second check on agent output without leaving their workflow?",
          note: "In the prototype: a reviewer agent checks the builder's work against the spec, a tester covers what neither caught, and a human teammate reviews the pull request. All agents run on one approved model, IBM Bob."
        },
        {
          name: "...allow the user to course-correct a derailed agent session without losing the verification they've already established?",
          revised: "...let users correct an agent's work without losing the verification they've already done?",
          note: "In the prototype: code is verified section by section. Editing one section rechecks only that section, so everything already verified stays verified."
        }
      ]
    },
    {
      stage: 6,
      name: "The Solution: The Pre-Merge Review",
      short: "The solution",
      note: "A constellation, not a chat window: the engineer adds agents and teammates around her, sees disagreements as red lines between them, and verifies the code section by section before it merges.",
      children: [
        {
          name: "Design Evolution",
          note: "From a review panel inside VS Code to a team of collaborators. Click a frame.",
          map: {
            src: "maps/design-evolution.svg",
            hotspots: {
              "evo-1": { title: "Round 1, low-fi", note: "The first concept lived in a VS Code sidebar: the agent's code grouped into sections to review by priority, with accept, edit or reject per finding." },
              "evo-2": { title: "Round 1, hi-fi", note: "Section review beside the code, with the spec shown inline and a reason asked for every rejection. It still treated review as one person checking one agent." },
              "evo-3": { title: "Round 2, low-fi", note: "The pivot: the engineer becomes one dot in a team of agents and people, and problems appear on the lines between them, where collaborators disagree." },
              "evo-4": { title: "Round 2, hi-fi: sections", note: "The section view returns as the bridge between a simple constellation and complex code. Clicking a red line lists the sections it touches, in plain names." },
              "evo-5": { title: "Round 2, hi-fi: code", note: "Each section opens just its own code, with the builder's view, the spec and the reviewer's view beside it. The engineer saves, both agents recheck, and she verifies." }
            }
          }
        },
        {
          name: "Key decisions",
          children: [
            {
              name: "A team, not a chat",
              note: "Review isn't one agent's output. Disagreements between collaborators are where the risk is, so they're made visible as lines."
            },
            {
              name: "Sections as the bridge",
              note: "The constellation stays simple and the code stays complex. Named sections let the engineer jump from one to the other without losing her place."
            },
            {
              name: "Constellation, Cluster, Galaxy",
              note: "An engineer's setup is a constellation. A team's setups form a cluster, and the organization's service network is a galaxy. The metaphor stays selective, not playful."
            },
            {
              name: "Enterprise calm",
              note: "Agents run on one approved model with strictness set by policy. No automatic camera moves, and red is reserved for issues."
            },
            {
              name: "Accessible by default",
              note: "Text meets WCAG AAA contrast. Hierarchy comes from size and weight, not from darker greys."
            }
          ]
        },
        {
          name: "Solution: The Pre-Merge Review",
          short: "Solution",
          note: "Open the working prototype.",
          prototype: { src: "prototype/index.html", title: "The Pre-Merge Review" }
        }
      ]
    },
    {
      stage: 7,
      name: "Testing",
      note: "Round 2 tested the coded prototype with four people. Each session led to fixes, and the fixes worked: time to merge dropped from about 15 minutes to under 7.",
      children: [
        {
          name: "Method",
          note: "Cognitive walkthrough with think-aloud on the live prototype, plus each session's own log of clicks, hints and off-path moments. P5 was moderated; the others ran on their own."
        },
        {
          name: "Sessions",
          children: [
            {
              name: "P1",
              note: "A retiree. Log only. Hit the issue while a panel was open, was blocked for having no human reviewer on the pull request, and the pull request merged without a Merge click."
            },
            {
              name: "P3",
              note: "A Marine, not an engineer. Merged in 14:54 with 6 hints. Spent about 5 minutes editing generated files instead of adding a reviewer, and hand edits failed three times before finding the reviewer's fix."
            },
            {
              name: "P5",
              note: "An experience design master's student, moderated. Merged in 10:56 with 9 hints. Unsure the reviewer was an agent, missed an issue that appeared behind an open panel, needed help adding a reviewer, and took 1.5 minutes to find Save."
            },
            {
              name: "P2",
              note: "A chemical engineer, after the P5 fixes. Merged in 6:42 with 4 hints. Added a reviewer unprompted and saved in seconds, but applied fixes and verified sections without reading the code."
            }
          ]
        },
        {
          name: "What changed",
          note: "Clear next steps on every card, the reviewer's fix moved where people look, a toast when an issue appears, a teammate suggested for the pull request, a labeled Save button, an explicit Merge button, and settings that match each agent's role."
        },
        {
          name: "What we learned",
          note: "As the flow got easier, review got shallower. Every participant verified the remaining sections in bulk, and three answered the teammate's question with a single word. The next design problem is making verification meaningful, not just possible."
        }
      ]
    },
    {
      stage: 8,
      name: "What's Next",
      children: [
        {
          name: "Cluster and Galaxy",
          note: "Scaling up from one engineer's constellation to a team's cluster, and to the organization's service network, where configurations and decisions can be shared."
        },
        {
          name: "A lead's view",
          note: "A view for team leads to see verification across everyone's work, without reading every line themselves."
        },
        {
          name: "Verification with evidence",
          note: "Asking for a small sign of review before a section counts as verified, so speed doesn't turn into rubber-stamping."
        },
        {
          name: "Limitations",
          note: "Four usability sessions, none with a software engineer (a retiree, a chemical engineer, a Marine and an experience design student), so findings about reading and judging code need confirming with the target user. Agents are scripted, not live. Pain-point percentages come from the 10 engineers coded for pain, and only two PMs were interviewed."
        }
      ]
    }
  ]
};
