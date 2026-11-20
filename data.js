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
// A note can hold several paragraphs, separated by "\n". "quote" ({ text, who }) shows a participant
// quote under the note, attributed by role only.

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
      note: "Who I talked to and how I analyzed what I heard, before any mapping or design.",
      children: [
        { name: "Who I talked to", note: "7 participants: 3 engineers, 3 designers and 1 product manager.",
          children: [
            {
              name: "Engineers",
              note: "3 engineers, 102 quotes in the analysis.",
              children: [
                { name: "Engineer 1", note: "35 quotes, most often on Human Accountability, AI Conductor and AI Scaffolding." },
                { name: "Engineer 2", note: "35 quotes, most often on AI Conductor, Delegate? and Agent Derailment." },
                { name: "Engineer 3", note: "32 quotes, most often on Human Accountability, AI Conductor, AI Scaffolding and Authorship." }
              ]
            },
            {
              name: "Designers",
              note: "3 designers, 108 quotes in the analysis.",
              children: [
                { name: "Designer 1", note: "32 quotes, most often on Design - Engineering Gap, Product Purpose and Role Scope." },
                { name: "Designer 2", note: "37 quotes, most often on AI Conductor, Product Purpose and Design - Engineering Gap." },
                { name: "Designer 3", note: "39 quotes, most often on Design - Engineering Gap, Role Scope and Team/Process." }
              ]
            },
            {
              name: "Product manager",
              note: "1 product manager, 27 quotes in the analysis.",
              children: [
                { name: "Product manager", note: "27 quotes, most often on Design - Engineering Gap, AI Conductor and Role Scope." }
              ]
            }
          ]
        },
        {
          name: "How I listened",
          note: "Semi-structured interviews with engineers, designers and a product manager."
        },
        {
          name: "How I analyzed it",
          note: "Quotes were grouped by hand, the groups were named as themes, and the themes were rolled up into metathemes: 237 quotes, 20 groups, 8 themes and 3 metathemes."
        }
      ]
    },
    {
      stage: 2,
      name: "What I Heard",
      note: "Three metathemes came out of 7 interviews: 237 quotes, sorted into 20 groups and 8 themes.",
      children: [
        {
          name: "Responsibility Outpaces Visibility",
          note: "Practitioners are still on the hook for AI-assisted work, but their tools don't show what the agent did, why, or from what. Trust, traceability and context all have to be built by hand.",
          children: [
            {
              name: "Accountability Without Authorship",
              note: "People remain fully answerable for AI-assisted work, but the record of what the AI wrote, why, and from what inputs is thin or missing. Participants either build their own trail back to the source or rely on memory and conventions like co-author tags. (5 participants)",
              children: [
                {
                  name: "Human Accountability",
                  note: "The person stays answerable for AI-assisted work and has to understand it well enough to stand behind it.",
                  quote: { text: "You're the one orchestrating those agents. You're the one giving them the instructions. So if they are not meeting expectations, you're responsible at the end of the day.", who: "Engineer" }
                },
                {
                  name: "Authorship",
                  note: "Telling human-written work from AI-written work, and how ownership feels.",
                  quote: { text: "There's no way for me to look at the pull request and see, oh, this was my code and this was AI's code. It's all the same, so as you're inputting, you need to review.", who: "Engineer" }
                },
                {
                  name: "AI Provenance",
                  note: "Tracing AI work back to its inputs, sessions and decisions.",
                  quote: { text: "For me to have traceability — I can go back and search for the session that worked on this. Let me see the outputs it created. Let me see the inputs it got.", who: "Engineer" }
                }
              ]
            },
            {
              name: "Earned Trust",
              note: "Trust in AI is built gradually through review routines, not granted up front. People adjust how much they hand over based on risk, experience and confidence, and some deliberately stay hands-on. (5 participants)",
              children: [
                {
                  name: "Trust but Verify",
                  note: "Never accepting AI output without checking it.",
                  quote: { text: "If Claude writes me something, I'm definitely not going to just cut and paste and use it. Trust but verify.", who: "Product manager" }
                },
                {
                  name: "Autonomy Calibration",
                  note: "How much independence to give agents, and how that grows with trust.",
                  quote: { text: "Trust has to be built in that process. These are high-risk tasks, especially in security, so rightly there was wariness to say, hey agent, take this big task and go do it, even though the agents were able to do it.", who: "Designer" }
                },
                {
                  name: "Delegate?",
                  note: "Choosing what to hand to AI and what to keep doing yourself.",
                  quote: { text: "I'm not a big fan of long conversations with it. I'd rather have short prompts here and there and then try to figure it out myself. That's the most productive way I can do it.", who: "Engineer" }
                }
              ]
            },
            {
              name: "Context or Chaos",
              note: "Agent output is only as reliable as the context behind it. Without instruction files, knowledge bases and clear requirements, agents assume, drift and hallucinate, and giving them more context costs more. (5 participants)",
              children: [
                {
                  name: "Context First",
                  note: "Agents are only as good as the context they're given: instruction files, requirements, knowledge bases.",
                  quote: { text: "Some engineers didn't have the context of the things they were building. Here's the requirements, they just pass it to the AI, and when the AI finished, they say, yeah, it's ready.", who: "Engineer" }
                },
                {
                  name: "Agent Derailment",
                  note: "How agent output goes wrong: false assumptions, drift, hallucination, sweeping changes.",
                  quote: { text: "You can start an agent session, give it an instruction and access to the code, and it can go bananas and change as many things as possible. And you can lose track of it.", who: "Engineer" }
                },
                {
                  name: "Cost",
                  note: "The token and money cost of giving agents more context.",
                  quote: { text: "The more context the agents need to understand, the more tokens they use, which [means] spending more money.", who: "Engineer" }
                }
              ]
            }
          ]
        },
        {
          name: "The Shape of Work Is Being Renegotiated",
          note: "AI is changing who does what. Individuals shift from making to directing, disciplines cross into each other's work, and the handoffs between them are being rebuilt.",
          children: [
            {
              name: "From Maker to Director",
              note: "Across every role, the human job is moving from producing the work to directing, prompting and reviewing it. Some build elaborate infrastructure to support that shift, while others see heavy setup as more trouble than it's worth. (7 participants)",
              children: [
                {
                  name: "AI Conductor",
                  note: "The person's job shifting from making the work to directing, prompting and reviewing AI.",
                  quote: { text: "If something I'm doing is more procedural and there's already a laid-out pattern in the application, sometimes my job is honestly more AI supervisor than an actual developer.", who: "Engineer" }
                },
                {
                  name: "AI Scaffolding",
                  note: "Systems, agents and setups people build to make AI useful, and whether that setup is worth it.",
                  quote: { text: "You need to build confidence in the agent's work so you can delegate more. Now I can run 10 agents in parallel, because the way I set it up, I can quickly get the context when I need it.", who: "Engineer" }
                }
              ]
            },
            {
              name: "Roles Without Borders",
              note: "Designers write code, PMs build prototypes, and engineers make UI. Boundaries between disciplines are blurring, raising questions about how far each role should reach and what each one uniquely contributes. (6 participants)",
              children: [
                {
                  name: "Role Scope",
                  note: "Disciplines crossing into each other's work, and how far each role should stretch.",
                  quote: { text: "Just because I can doesn't mean I will.", who: "Designer" }
                },
                {
                  name: "Knowledge Sharing",
                  note: "How people learn from and teach each other across roles.",
                  quote: { text: "[Engineers] come to me if they're doing UX or UI work, which I'm finding they're doing more and more on their own to build out features. They'll come to me for feedback.", who: "Designer" }
                }
              ]
            },
            {
              name: "The Design–Engineering Seam",
              note: "Handoff, acceptance and the source of truth are being rebuilt. AI can close the old gap between design and build, but it also lets work move ahead without the right people consulted, and leaves open who decides when something is done. (6 participants)",
              children: [
                {
                  name: "Design - Engineering Gap",
                  note: "How work moves between design, product and engineering, and where it breaks: handoff, acceptance, source of truth, and who decides.",
                  quote: { text: "It has happened that they'll do something and be so far along in development that we just can't make changes to it.", who: "Designer" }
                },
                {
                  name: "Team/Process",
                  note: "Team structures, meetings and tools that shape how decisions get made.",
                  quote: { text: "That comes with working on a larger team where everyone has an opinion. It sometimes impacts the development cycle negatively.", who: "Engineer" }
                }
              ]
            }
          ]
        },
        {
          name: "Speed Meets Its Limits",
          note: "AI speeds up building, but experience quality, research, organizational rules and people's real readiness push back on how far speed alone can go.",
          children: [
            {
              name: "Speed Over Substance",
              note: "Faster building tempts teams to build everything and treat \"it works\" as done. Scoping, discovery, research and experience quality are what get squeezed. (6 participants)",
              children: [
                {
                  name: "Time",
                  note: "Speed gains and what they push out: discovery, research, review, care.",
                  quote: { text: "I definitely can't spend as much time on discovery or divergent thinking — exploring multiple ways of doing the same thing.", who: "Designer" }
                },
                {
                  name: "Product Purpose",
                  note: "Building more because you can, versus deciding what's worth building and for whom.",
                  quote: { text: "There's a reaction to building everything just because you can, instead of scoping your work to the least amount we can do to prove it out and deliver a really great experience.", who: "Designer" }
                },
                {
                  name: "Operation vs. Experience",
                  note: "Working isn't the same as a good experience.",
                  quote: { text: "Done for them means that it works. It doesn't mean experience.", who: "Designer" }
                }
              ]
            },
            {
              name: "Adoption Within Limits",
              note: "AI use happens inside organizational rules, such as approved tools, access gating and compliance, and alongside uneven readiness. There's no single right way to work with AI, and not everyone will become an expert. (5 participants)",
              children: [
                {
                  name: "Guardrails",
                  note: "Organizational rules on which AI tools can be used, who can access what, and compliance.",
                  quote: { text: "We have a very strict policy in-house around AI. We can only use AI-approved tools. No shadow AI.", who: "Product manager" }
                },
                {
                  name: "Rooted in Reality",
                  note: "Realistic views of adoption: no single answer, and not everyone becomes an expert.",
                  quote: { text: "We have this mentality as an industry that the whole world is going to become AI experts. If we look at history, the whole world hasn't become computer experts yet.", who: "Designer" }
                }
              ]
            }
          ]
        },
        {
          name: "Pain Point Map",
          note: "Where each role feels the pain, by workflow phase. Click a chart to read it.",
          map: {
            src: "maps/pain-points.svg",
            hotspots: {
              "pp-engineers": { title: "Engineers", note: "Pain peaks in Build, where agents drift and overreach, and continues into Review and Ship, where work can't be traced to its source." },
              "pp-designers": { title: "Designers", note: "Designers' pain centers on setting up their own agent workflows and on the handoff to engineering. Across every phase, the collaboration rhythm they relied on is thinning out." },
              "pp-pms": { title: "Product managers", note: "Signals rather than trends. They point to collaboration rhythm and to knowledge that lives in people rather than in tools." }
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
          note: "Everyone who shapes, pressures or depends on the senior engineer's work, in three rings. Click a ring.",
          map: {
            src: "maps/stakeholder-map.svg",
            hotspots: {
              "sh-senior-engineer": { title: "Senior software engineer", note: "At the center. She directs and audits agent output and answers for what ships, whoever wrote it." },
              "sh-produces-output": { title: "Produces output", note: "Inner ring: the agents, tools and engineers whose work she has to verify.\nCoding agent: Writes code from her direction and context. It can't be held accountable, so responsibility for its output lands on her.\nInstruction files: Standing rules loaded on every task. They constrain the coding agent, and keeping them current is now part of her job." },
              "sh-shapes-the-ask": { title: "Shapes the ask", note: "Middle ring: clients, product and management, who define what gets built and negotiate its scope.\nReview agent: A second agent that pre-reviews the coding agent's work. Engineers use it as an independent check, not a replacement for their own review.\nCode reviewers: Teammates who review her pull requests. They see what changed, but rarely what the agent did or why.\nEngineering manager: Assigns the work and signs off on it, and increasingly expects more output because AI exists.\nProduct manager: Negotiates requirements and coordinates across teams. Intent can get lost between the original ask and the agent.\nClient: Pushes requirements into the work and holds the engineer to explaining and defending the output." },
              "sh-sets-expectations": { title: "Sets expectations", note: "Outer ring: leadership, regulators, policy and vendors who set the rules, and the pressure to adopt AI.\nKnowledge base: Where approved decisions are recorded so future agents inherit them. Much of the context agents need still lives in people instead.\nCTO: Sets the organization's AI direction and partners with approved vendors. Leadership expects more output from AI." },
              "sh-external": { title: "Regulatory and external influences", note: "Policies: Shaped by regulators and industry trends, they decide which AI tools engineers may use and how.\nAuditors: Require attribution: who or what wrote a change has to be traceable after the fact.\nAI vendors: Supply the approved tools. Which vendor an organization partners with decides which agents engineers can use." }
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
              "eco-work-intake": { title: "01 Work intake", note: "Work arrives through standups, tickets and design handoff, and context is gathered for the agent.\nRequirements review: Checking requirements before work starts. Gaps left here become the agent's guesses later.\nContext gathering: Pulling designs, docs and repos together so the agent has what it needs. Much of the setup time goes here." },
              "eco-executing": { title: "02 Executing", note: "Agents build from the spec while engineers plan, monitor progress and redirect when needed.\nSpec-driven development: Writing a detailed spec first, so the agent builds against something that can be checked.\nPlan review: Reviewing the agent's plan before it writes code: the cheapest point to catch a wrong direction.\nProgress monitoring: Watching the agent work. Tools show little of what it is doing, so this is effort with low visibility.\nMid-task redirection: Steering an agent that has drifted without losing the work already done." },
              "eco-testing-review": { title: "03 Testing and review", note: "Where The Pre-Merge Review sits. Engineers review diffs, run tests and look for second opinions before sign-off.\nLine-by-line diff review: Today's default: reading every line. Thorough, but it erases the speed agents add.\nCross-model checking: Running the work past a different model to catch what the first one missed.\nFresh-session review: Asking a new agent session, with clean context, to review the work.\nPull request review: Teammates review the change. They see the diff, not the agent's reasoning.\nDev-done sign-off: The engineer declares the work done and becomes answerable for it." },
              "eco-deployment": { title: "04 Deployment", note: "Code is merged and released. Authorship and traceability have to survive past the merge, and usually don't.\nAuthorship tagging: Marking which code a person wrote and which an agent wrote. Rarely done today, and lost after merge.\nTraceability audit: Reconstructing what happened and why after the fact, for audits or incidents.\nCommit and merge: Where agent and human work become one history, and attribution usually disappears." }
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
      prototype: { src: "prototype/index.html", title: "The Pre-Merge Review" },
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
          name: "What I learned",
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
          note: "Four usability sessions, none with a software engineer (a retiree, a chemical engineer, a Marine and an experience design student), so findings about reading and judging code need confirming with the target user. Agents are scripted, not live. The interview analysis covers 7 participants: 3 engineers, 3 designers and 1 product manager."
        }
      ]
    }
  ]
};
