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
  name: "How has the spec-driven development workflow changed with AI agents, and how could it work better for engineers?",
  short: "The Ask",
  note: "As agentic systems grow more capable and more affordable for enterprise teams, the software engineer's role in spec-driven development has changed dramatically.\nThis service design project looks at how that workflow has changed and how it could evolve to better support developers. It proposes an agentic solution that makes verification more effective and meets developers where they are, however comfortable they are with AI and however far they've adopted it.",
  children: [
    {
      stage: 1,
      name: "Research Approach",
      note: "Who I talked to and how I analyzed what I heard, before any mapping or design.",
      children: [
        {
          name: "Who I talked to",
          note: "7 participants: 3 engineers, 3 product designers and 1 product manager.",
          children: [
            { name: "3 Engineers", note: "102 quotes in the analysis." },
            { name: "3 Product Designers", note: "108 quotes in the analysis." },
            { name: "1 Product Manager", note: "27 quotes in the analysis." }
          ]
        },
        { name: "How I listened", note: "Semi-structured interviews with engineers, designers and a product manager." },
        {
          name: "What I Found",
          note: "During thematic analysis, quotes were grouped by hand, the groups were named as themes, and the themes were rolled up into metathemes: 237 quotes, 20 groups, 8 themes and 3 metathemes.",
          children: [
            {
              name: "Responsibility Outpaces Visibility",
              note: "Practitioners are still on the hook for AI-assisted work, but their tools don't always show what the agent did, why, or from what. If they do, they're custom built by the engineer. Trust, traceability and context all have to be built by hand.",
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
                  note: "Trust in AI is built gradually through review routines, not granted up front. People adjust how much they delegate based on risk, experience and confidence, and some deliberately stay hands-on. (5 participants)",
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
                  note: "Across every role, the human job is moving from producing the work to directing, prompting and reviewing. Some build elaborate infrastructure to support that shift, while others see heavy setup as more trouble than it's worth. (7 participants)",
                  children: [
                    {
                      name: "AI Conductor",
                      note: "The person's job shifting from making the work to directing, prompting and reviewing AI.",
                      quote: { text: "If something I'm doing is more procedural and there's already a laid-out pattern in the application, sometimes my job is honestly more AI supervisor than an actual developer.", who: "Engineer" }
                    },
                    {
                      name: "AI Scaffolding",
                      note: "Systems, agents and setups people build to make AI useful, plus the tradeoffs.",
                      quote: { text: "You need to build confidence in the agent's work so you can delegate more. Now I can run 10 agents in parallel, because the way I set it up, I can quickly get the context...", who: "Engineer" }
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
              note: "AI speeds up building, but experience quality, research, organizational rules and people's real readiness push back on how far speed alone can take the workflow before problems appear.",
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
      stage: 2,
      name: "Mapping",
      note: "Four maps of the system around the senior engineer: who influences her, what she touches, how her work unfolds, and why things go wrong.",
      children: [
        {
          name: "Stakeholder Map",
          note: "Everyone who shapes, pressures or depends on the senior engineer's work, in three rings. Click a ring.",
          map: {
            src: "maps/stakeholder-map.svg",
            step: "ring",
            hotspots: {
              "sh-senior-engineer": { title: "Senior software engineer", note: "At the center. She directs and audits agent output and answers for what ships, whoever wrote it." },
              "sh-produces-output": { title: "Produces output", note: "Inner ring: the agents, tools and engineers whose work she has to verify." },
              "sh-shapes-the-ask": { title: "Shapes the ask", note: "Middle ring: clients, product and management, who define what gets built and negotiate its scope." },
              "sh-sets-expectations": { title: "Sets expectations", note: "Outer ring: leadership, regulators, policy and vendors who set the rules, and the pressure to adopt AI." },
              "sh-external": { title: "Regulatory and external influences", note: "Outside the rings: the regulators, auditors and AI vendors whose rules and tools decide what engineers may use." }
            }
          }
        },
        {
          name: "Ecosystem Map",
          note: "The needs, interactions and touchpoints around one goal: auditable, transparent agent output. Four phases, read clockwise from Work Intake.",
          map: {
            src: "maps/ecosystem-map.svg",
            step: "segment",
            hotspots: {
              "eco-center": { title: "Auditable agentic output and transparency", note: "The need at the center of every phase: agent output the engineer can audit and explain." },
              "eco-work-intake": { title: "01 Work intake", note: "Work arrives through standups, tickets and design handoff, and context is gathered for the agent." },
              "eco-executing": { title: "02 Executing", note: "Agents build from the spec while engineers plan, monitor progress and redirect when needed." },
              "eco-testing-review": { title: "03 Testing and review", note: "Where The Pre-Merge Review sits. Engineers review diffs, run tests and look for second opinions before sign-off." },
              "eco-deployment": { title: "04 Deployment", note: "Code is merged and released. Authorship and traceability have to survive past the merge, and usually don't." }
            }
          }
        },
        {
          name: "Journey Map",
          note: "One task, six phases, from directing the agent to revising after it goes wrong. Click a phase.",
          map: {
            src: "maps/journey-map.svg",
            enlarge: false,
            hotspots: {
              "jm-direction": { title: "Direction", note: "She gives the agent the spec and context. Clear constraints help, but gathering context takes time." },
              "jm-generation": { title: "Generation", note: "She watches the agent build. Optimistic about the speed, anxious about whether it's right, with little visibility into what it's doing." },
              "jm-pre-merge-review": { title: "Pre-merge review", note: "Review is meticulous and line by line, and judgment lands entirely on her. This is the space where the solution lives." },
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
                            {
                              name: "Ambiguous/incomplete instructions",
                              children: [
                                response("Reset")
                              ]
                            },
                            { name: "Conflicting instructions" }
                          ]
                        },
                        {
                          name: "Session Management",
                          children: [
                            {
                              name: "Handoff gaps",
                              children: [
                                response("Ask a coworker")
                              ]
                            },
                            {
                              name: "Context window drift",
                              children: [
                                response("Ask original ticket author")
                              ]
                            }
                          ]
                        },
                        {
                          name: "Requirements & Scope",
                          children: [
                            { name: "Under-specification" },
                            {
                              name: "Scope creep",
                              children: [
                                response("Manual check/review")
                              ]
                            }
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
                            {
                              name: "Deprecated/mismatched version",
                              children: [
                                response("Manual check/review")
                              ]
                            },
                            {
                              name: "Unapproved library introduction",
                              children: [
                                response("Flagged by manager")
                              ]
                            }
                          ]
                        },
                        {
                          name: "Repositories",
                          children: [
                            {
                              name: "Outdated pattern referenced",
                              children: [
                                response("Ask a coworker")
                              ]
                            },
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
                            {
                              name: "Business logic mismatch",
                              children: [
                                response("Ask domain expert")
                              ]
                            },
                            { name: "Edge case blindness" }
                          ]
                        },
                        {
                          name: "Code Quality/Redundancy",
                          children: [
                            {
                              name: "Dead-unreachable code",
                              children: [
                                response("Manual check/review")
                              ]
                            },
                            { name: "Duplicate code" }
                          ]
                        },
                        {
                          name: "Memory/Continuity",
                          children: [
                            {
                              name: "Dropped/forgotten constraints",
                              children: [
                                response("Manual check/review")
                              ]
                            },
                            {
                              name: "Memory errors",
                              children: [
                                response("Reset")
                              ]
                            }
                          ]
                        },
                        {
                          name: "Error Handling/Robustness",
                          children: [
                            {
                              name: "Lack of error communication",
                              children: [
                                response("Manual check/review")
                              ]
                            }
                          ]
                        },
                        {
                          name: "Fabrication/Confidence",
                          children: [
                            { name: "Overconfidence, no uncertainty signal" },
                            {
                              name: "Hallucination/fabricated detail",
                              children: [
                                response("Retry in new model + Manual check/review")
                              ]
                            },
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
                                {
                                  name: "Wrong endpoint/version assumed",
                                  children: [
                                    response("Manual check/review")
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          name: "Codebase Awareness/Scale",
                          children: [
                            {
                              name: "Creates algorithm from scratch → file overwhelm",
                              children: [
                                response("Manual check/review")
                              ]
                            },
                            {
                              name: "Misses existing utility → reinvents",
                              children: [
                                response("Manual check/review")
                              ]
                            }
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
                        {
                          name: "Only live, lost after merge",
                          children: [
                            response("Only live, lost after merge")
                          ]
                        }
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
      stage: 3,
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
              "um-who": { title: "Who", note: "A senior to principal engineer in a large, often regulated enterprise. She still codes, but spends more of her day directing and checking agents than writing.", zoom: "maps/img/user-model-who.png" },
              "um-workflow": { title: "Current workflow", note: "Define, set up and plan, build, verify, hand off and ship. Agents speed up building; review is where the time goes.", zoom: "maps/img/user-model-workflow.png" },
              "um-goal": { title: "Goal", note: "Catch agent mistakes before merge, avoid costly rework, and keep a consistent, trustworthy workflow.", zoom: "maps/img/user-model-goal.png" },
              "um-mental-model": { title: "Mental model", note: "She directs, the agents execute, and she answers for the result. Agent output is fast and capable, and wrong until proven right.", zoom: "maps/img/user-model-mental-model.png" }
            }
          }
        }
      ]
    },
    {
      stage: 4,
      name: "Problem Definition",
      note: "Mapping the ecosystem, the journey and the user narrowed 237 quotes down to one point of view. From there, the problem became four questions to design for.",
      children: [
        {
          name: "POV Statement",
          note: "Senior software engineers need a way to increase the verification efficacy of agent-generated outputs in order to extend agent trust while still being able to answer for what it produces."
        },
        {
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
        }
      ]
    },
    {
      stage: 5,
      name: "The Solution",
      short: "The solution",
      note: "A constellation, not a chat window: the engineer adds agents and teammates around her, sees disagreements as red lines between them, and verifies the code section by section before it merges.",
      children: [
        {
          name: "User Story",
          note: "As a senior software engineer coding collaboratively with AI, I want to catch mistakes in its code before it merges so that I can avoid costly rework down the line and deliver more consistent, trustworthy productivity."
        },
        {
          name: "User Flow",
          note: "The engineer starts as a single dot in a spatial grid and builds a team around it: build, review and testing agents, plus human teammates. Each dot is configured with its own model and rules. Work flows along the lines between dots, and when two collaborators disagree, the issue shows up in red on the line between them. The engineer zooms into that line to resolve it, opens a pull request with a receipt of who wrote and verified each section, and merges once a teammate approves.",
          map: {
            src: "maps/user-flow.svg",
            flow: true,
            hotspots: {
              "uf-start": { title: "Engineer opens a branch with an approved spec", note: "", next: "uf-space" },
              "uf-space": { title: "The Constellation", note: "Start a session in the space.\nThe editor gives way to a perspective grid.\nYou appear as a single dot, with the approved spec attached.\nCode stays one click away and floats in when opened.\nThe engineer starts from their own intent, not a file tree.", next: "uf-add-node" },
              "uf-add-node": { title: "Add a Node", note: "Add and configure a collaborator.\nClick + next to any dot.\nPick a type: build, review or testing agent, or a human teammate.\nSet its model, the spec it checks, how strict it is and what it can change.\nEvery collaborator, human or agent, is placed and set up the same way.", next: "uf-d-another" },
              "uf-d-another": { title: "Add another node?", note: "", yes: "uf-add-node", no: "uf-build" },
              "uf-build": { title: "Build in the Space", note: "Build alongside the agents.\nLines pulse as work passes between dots.\nOpen any dot to see its code floating over the grid.\nEvery change is tagged to the dot that wrote it.\nAuthorship is captured as work happens, so nothing is reconstructed later.", next: "uf-d-recommend" },
              "uf-d-recommend": { title: "Does an agent recommend a new node?", note: "", yes: "uf-approve", no: "uf-d-issue" },
              "uf-approve": { title: "Approve a Recommendation", note: "Approve or decline a suggested node.\nThe proposed dot appears ghosted, dashed to the agent that suggested it.\nSee why, e.g. the review agent wants a testing agent for the contract.\nApprove, adjust its settings, or decline.\nAgents can grow the team, but the engineer decides who joins.", next: "uf-build" },
              "uf-d-issue": { title: "Is a line showing an issue?", note: "", yes: "uf-line-zoom", no: "uf-all-clear" },
              "uf-line-zoom": { title: "Line Zoom", note: "Resolve an issue on a line.\nClick the red mark; the camera zooms in between the two dots.\nEach side of the disagreement sits at its end, with the spec in the middle.\nThe code floats in: accept, edit it yourself, or reject with a reason.\nEach issue is judged in context, between the two collaborators who disagree.", next: "uf-d-red" },
              "uf-d-red": { title: "Are any lines still red?", note: "", yes: "uf-line-zoom", no: "uf-all-clear" },
              "uf-all-clear": { title: "All Clear", note: "Confirm the space is clear.\nEach line settles to neutral once its issues are resolved.\nA receipt records which dot wrote, reviewed and tested each section.\nZoom out to see the whole team at a glance.\nThe engineer can show who wrote and who verified every section.", next: "uf-open-pr" },
              "uf-open-pr": { title: "Open a Pull Request", note: "Bring in a human reviewer.\nAdd a teammate as a human dot.\nThe pull request opens with the receipt attached.\nTheir line stays pending until they approve.\nThe human reviewer sees the same space, not a wall of diffs.", next: "uf-teammate" },
              "uf-teammate": { title: "Teammate Review", note: "Wait for the human reviewer.\nYour teammate’s dot opens the same space and the receipt.\nTheir comments appear on their line, marked as theirs instead of red.\nApproval settles their line and clears the space.\nThe pull request is reviewed in the same space it was built in.", next: "uf-d-approve" },
              "uf-d-approve": { title: "Did the teammate approve?", note: "", yes: "uf-recap", no: "uf-line-zoom" },
              "uf-recap": { title: "Productivity Recap", note: "See what catching issues early saved.\nIssues caught on each line, by pair of collaborators.\nEstimated hours of rework saved.\nRepeat pull requests avoided this month.\nThe payoff of early review is tied to the team the engineer built.", next: "uf-end" },
              "uf-end": { title: "Code merges trusted, with its receipt", note: "" },
              "uf-trace": { title: "Trace on the Line", note: "Trace a failure back to where it started.\nThe failing test lights up the testing dot and the line it came from.\nFollow it to the section, prompt and session.\nOnly that line reopens; everything else stays verified.\nThe root cause is found without re-reviewing the whole branch.", next: "uf-line-zoom" }
            }
          }
        },
        {
          name: "Design Evolution",
          note: "From a review panel inside VS Code to a team of collaborators.",
          children: [
            {
              name: "Version 1",
              note: "A review panel inside VS Code.",
              map: {
                gallery: true,
                hotspots: {
                  "v1-sketch-1": { title: "Sketch 1", note: "The engineer can review. They go to click on the “must review” section.", image: "maps/img/sketches/v1-sketch-1.jpg" },
                  "v1-sketch-2": { title: "Sketch 2", note: "The engineer starts reviewing “must review” items and can edit, accept, or reject agent-generated sections.", image: "maps/img/sketches/v1-sketch-2.jpg" },
                  "v1-sketch-3": { title: "Sketch 3", note: "Later, the engineer initiates the pull request for merge into the main branch with verification files attached.", image: "maps/img/sketches/v1-sketch-3.jpg" },
                  "v1-sketch-4": { title: "Sketch 4", note: "The merge begins.", image: "maps/img/sketches/v1-sketch-4.jpg" },
                  "v1-lowfi": { title: "Low-fi wireframe", note: "The first concept lived in a VS Code sidebar: the agent's code grouped into sections to review by priority, with accept, edit or reject per finding.", image: "maps/img/evo-1-v1-lowfi.png" },
                  "v1-midfi": { title: "Mid-fi wireframe", note: "In createPlan, the spec opens inline next to the drift, and she settles a disagreement between the build agent and the reviewer.", image: "maps/img/v1-midfi.png" },
                  "v1-hifi": { title: "Hi-fi screen", note: "Section review beside the code, with the spec shown inline and a reason asked for every rejection. It still treated review as one person checking one agent.", image: "maps/img/evo-2-v1-hifi.png" }
                }
              }
            },
            {
              name: "Version 2: Final",
              note: "A team of collaborators.",
              map: {
                gallery: true,
                hotspots: {
                  "v2-sketch-1": { title: "Sketch 1", note: "The engineer adds a build agent to the grid.", image: "maps/img/sketches/v2-sketch-1.jpg" },
                  "v2-sketch-2": { title: "Sketch 2", note: "The engineer adds a review agent to the grid.", image: "maps/img/sketches/v2-sketch-2.jpg" },
                  "v2-sketch-3": { title: "Sketch 3", note: "The agent adds a testing agent to the grid after the review agent recommends adding one.", image: "maps/img/sketches/v2-sketch-3.jpg" },
                  "v2-sketch-4": { title: "Sketch 4", note: "An additional sketch for the code viewer during review and verification.", image: "maps/img/sketches/v2-sketch-4.png" },
                  "v2-lowfi": { title: "Low-fi wireframe", note: "The pivot: the engineer becomes one dot in a team of agents and people, and problems appear on the lines between them, where collaborators disagree.", image: "maps/img/evo-3-v2-lowfi.png" },
                  "v2-midfi": { title: "Mid-fi wireframe", note: "An early mid-fi wireframe that was changed for the final prototype. \nClicking the issue zooms in between the two agents, with each side’s argument at its end and the spec in the middle. Leila clicks into the code to edit it directly, then saves.", image: "maps/img/v2-midfi.png" },
                  "v2-hifi-sections": { title: "Hi-fi: sections", note: "The section view returns as the bridge between a simple constellation and complex code. Clicking a red line lists the sections it touches, in plain names.", image: "maps/img/evo-4-v2-sections.png" },
                  "v2-hifi-code": { title: "Hi-fi: code", note: "Each section opens just its own code, with the builder's view, the spec and the reviewer's view beside it. The engineer saves, both agents recheck, and she verifies.", image: "maps/img/evo-5-v2-code.png" }
                }
              }
            }
          ]
        },
        {
          name: "The Pre-Merge Review",
          prototype: { src: "prototype/index.html", title: "The Pre-Merge Review" }
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
      stage: 6,
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
      stage: 7,
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
