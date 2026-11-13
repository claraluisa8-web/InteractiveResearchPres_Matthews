# Scripted agent replies

There is **no live AI**. The composer (and replies to the teammate's comment) run on `data/intents.json`: a small intent matcher that always answers, in character, with the user's own agent names.

## How it works

1. Work out the **context** from milestones: `empty | build | issue | editor | review | done`.
2. Normalize the input (lowercase, strip punctuation, expand contractions).
3. Score each intent allowed in the context (keywords +2, phrases +3, +1 if it's the intent the current step expects; fuzzy match within 1 edit for words of 5+ letters).
4. The highest score wins. With no hits, use the **fallback**, which ends with the hint for the current state, so even nonsense moves the user forward.
5. Show a "{agent} is thinking…" row for 700–1200 ms, then the reply as a message bubble from the addressed agent (orb icon + name). "To: Team" picks the most relevant agent for the intent.
6. Some intents have an **effect** (open the add menu, open the configure panel, preview a fix). Effects only open UI. They **never commit** anything without the user's click.

## Where replies appear

- **Composer replies** appear as a short stack of message bubbles just above the composer (glass, max 3 visible, newest at the bottom, auto-fade after 12 s unless hovered). The full conversation is in a "History" popover from the composer.
- **Inside the editor**, replies from the builder or reviewer also update the matching left-column card's latest line.
- **Teammate replies** appear in the comment card thread.

## Tone

1–3 sentences, plain words, no emoji, no hype. Agents frame suggestions as **opportunities they spotted**, not instructions ("Adding a tester could cover them", not "You must add a tester"). Agent role names read as names, not calls to action.

## Placeholders

`{builder} {reviewer} {tester} {teammate} {teammateFirst} {role} {verified} {total} {issues} {nextStep} {nextStepHint}`. `{nextStep}` comes from the same table as the idle hints in `flow-and-milestones.md`.

## Test phrases (must all get a sensible reply)

"hi" · "what do I do" · "build it" · "add a security agent" · "why is it red" · "the gateway handles that" · "just fix it" · "what does the spec say" · "are tests passing" · "how much is left" · "can I merge" · "rename the builder to Codey" · "asdfgh" · "thanks"
