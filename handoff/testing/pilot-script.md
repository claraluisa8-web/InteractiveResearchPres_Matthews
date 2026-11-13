# Pilot script (5 minutes)

For the Nov 13 pilot. One run end to end, with you as facilitator and a stand-in participant (or yourself, thinking aloud).

## Before (30 s)

- Open **https://claraluisa8-web.github.io/InteractiveResearchPres_Matthews/prototype/?reset&test=PILOT** in Chrome, full-size window. `?reset` clears anything left over; `test=PILOT` starts the session log. A small "Recording" mark shows top-right (add `&quiet=1` to hide it from participants).
- Start a timer. Keep this page open beside you, not on the shared screen.

## Say this (30 s)

> "You're Leila, a senior engineer. Your team's approved spec for a Recurring Investments API is already attached to you. Get it built with AI agents, make sure you trust what they produced, and get it merged. Please think out loud, and before each click tell me what you expect to happen."

Then stop talking. Don't name buttons.

## Watch for (3 min). One line per milestone, note the time

| Milestone | What they should find | Note if… |
|---|---|---|
| Add a builder | The `+` beside You, or Add node | They hunt for more than ~20 s (a hint pulses at 25 s) |
| Give the go | Start from the spec, the chip, or any message | They expect it to start on its own |
| Add a reviewer | `+` again, or "add a reviewer" in the composer | They skip it (the issue never appears without one) |
| Tester suggestion | Add tester / Not now | They read the lavender ring as an error |
| Red line | Click the line, badge or red pill | They don't connect red with "the agents disagree" |
| Sections | Open Idempotency key | They open a verified row first, or miss the subsections |
| Fix | Edit and Save, or Accept fix, or Reject | They save nonsense and how they read the reviewer's reply; whether they find Verify |
| Finish the rest | Next section or quick Verify | They try to verify issue rows from the panel |
| Receipt, then PR | Open pull request (every teammate reviews), then Create pull request | They skip reading the receipt, or choose Proceed anyway with no teammate |
| Review | Reply to each teammate's comment in the composer; it merges on its own | They look for a Merge button, or miss a second teammate's comment |

If they're stuck for over a minute, ask "What are you looking for?" before you help. Note that you helped.

## Wrap up (1 min)

Ask two questions:
1. "Which part did you trust least, and why?"
2. "What did the red line mean to you when it appeared?"

Then export the log: the **⋯** menu at top right, then **Export session log** (or Ctrl/Cmd+Shift+E). Two files download: `pmr-session-PILOT-<date>.json` and a readable `.md` with milestone timings, off-path moments, hints and everything they typed.

## Between participants

The ⋯ menu, then Start over, then **Start over, clear log**. Or open the next person's link (`?reset&test=P1`, `P2`, `P3`). Earlier logs stay in the browser until you export them, but export after each session anyway.

## If something goes wrong

- Anything looks stuck: the ⋯ menu, then Start over. Ctrl/Cmd+Shift+R also resets instantly.
- An editor or panel won't close: Esc closes the top layer, one at a time.
- Wrong window size: the app scales itself; anything 1280×720 or larger is fine.
