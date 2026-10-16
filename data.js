// Research structure for the tree.
// Each item needs a "name". Add "children" to make it a category that opens and closes,
// or a "note" to show text in the side panel when it's clicked.
// Add "map" to attach an SVG that opens over the chart (marked with ✱). Any element in the
// SVG whose id is listed under "hotspots" becomes clickable and shows its note. Figma and
// Illustrator use layer names as ids when exporting SVG.
// Add "response: true" for a response to a problem (the dashed boxes in the mind map);
// it's drawn with a dashed circle and italic label.

// Shorthand for a response item.
const response = name => ({ name, response: true });

const data = {
  name: "Senior software engineers need a way to increase the verification efficacy of agent-generated outputs in order to extend agent trust while still being able to answer for what it produces.",
  note: "Click a category to open it. Click it again to close it.",
  children: [
    {
      name: "How Might We...",
      children: [
        { name: "...help users differentiate their code from agent code?" },
        { name: "...demonstrate user-based vs. agent errors when output is unexpected or broken?" },
        { name: "...expand the user's prompt/context testing in multiple agent models?" },
        { name: "...allow the user to course-correct a derailed agent session without losing the verification they've already established?" }
      ]
    },
    {
      name: "Mapping",
      children: [
        {
          name: "Stakeholder Map",
          map: {
            src: "maps/stakeholder-map.svg",
            hotspots: {
              "senior-engineer": { title: "Senior engineer", note: "Placeholder: at the centre, answerable for what ships." },
              "team": { title: "Engineering team", note: "Placeholder: reviewers and collaborators who rely on the output." },
              "organization": { title: "Organization", note: "Placeholder: leadership, policy and compliance." },
              "agent": { title: "Agent", note: "Placeholder: produces code, but can't be held accountable." }
            }
          }
        },
        {
          name: "Ecosystem Map",
          map: {
            src: "maps/ecosystem-map.svg",
            hotspots: {
              "engineer": { title: "Engineer", note: "Placeholder: the person every tool and output flows through." },
              "agent": { title: "Agent", note: "Placeholder: generates code from prompts and context." },
              "ide": { title: "IDE", note: "Placeholder: where agent output first lands." },
              "ci": { title: "CI / tests", note: "Placeholder: automated checks on agent output." },
              "code-review": { title: "Code review", note: "Placeholder: human verification by teammates." },
              "version-control": { title: "Version control", note: "Placeholder: history of who (or what) wrote each change." },
              "production": { title: "Production", note: "Placeholder: where accountability becomes real." }
            }
          }
        },
        {
          name: "Journey Map",
          map: {
            src: "maps/journey-map.svg",
            hotspots: {
              "stage-prompt": { title: "Prompt", note: "Placeholder: engineer frames the task and context." },
              "stage-generate": { title: "Generate", note: "Placeholder: agent produces output." },
              "stage-review": { title: "Review", note: "Placeholder: engineer reads and judges the output. Confidence dips here." },
              "stage-test": { title: "Test", note: "Placeholder: checks run against the output." },
              "stage-ship": { title: "Ship", note: "Placeholder: output goes out under the engineer's name." },
              "stage-own": { title: "Own", note: "Placeholder: engineer answers for the result." }
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
    }
  ]
};
