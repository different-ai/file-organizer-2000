# Episode 2 — the handwritten page

The physical prop for `packages/video/src/episodes/ep02-handwriting-to-notes.ts`.
Copy it out by hand, photograph it, and that photo is what goes into the inbox
on camera.

It picks up a thread the demo vault already has open: `Interview themes.md`
ends with a third "protecting a system" interview still outstanding, and two
sibling interview notes already sit in `Research/`. So the note has an obvious
place to land, and the folder suggestion should come back at high confidence
rather than the low-confidence guesses you get when the content does not belong
to the vault.

## The page

Print it. Do not join the letters.

```
INTERVIEW - RAVI M.          24 SEP

Freelance editor. 5 clients.
Vault is 2 years old, 900 notes.

Records every client call.
Transcribes maybe 1 in 3.
The rest sit in a folder he calls "the pile".

Files everything by hand, 20 minutes a day.
Says it is the only reason the vault still works.

"I do not need it to be clever.
I need it to be right every time."

Same pattern as Dana. Precision over recall.
```

## Why it is shaped like that

The quoted line is the payoff -- quoted speech reads well in the output note,
so the before/after contrast is strongest there. The last line names Dana, who
is already in `Research/`, so the extracted note may surface a real connection
rather than sitting alone.

Everything else about the shape is a reaction to two failed takes. The first
draft of this page used abbreviations, arrows, a star and an aside, on the
theory that clean block capitals prove nothing about OCR and messy real notes
do. That was wrong. Across two shoots the extraction came back roughly 35%
accurate, and the lines it mangled were the ones the cut depends on:
`precision > recall` became "Persian vocal", and the quoted payoff became
"I don't need the have drive".

What actually failed, in order of damage:

- **Symbols.** `->`, `<-`, `*`, `>`, `#`. The line
  `everything came back #notes / #ideas <- useless` came back as
  "everything can't back #need | files etc leverers". This page now has none.
- **Joined letters.** Hybrid cursive compresses a word into one stroke and the
  model has nothing to segment. "transcribes" became "mansuibes", then
  "promising money". Print, with visible gaps between letters.
- **Abbreviations.** `~2yrs`, `20 min/day`, `1 in 3`. Shorthand carries no
  redundancy for the model to recover from, so a single bad character loses the
  whole token. Full words instead.
- **Corrections.** A struck-out word over "actually" killed that line in both
  takes. If you make a mistake, start the page again.
- **A sloping last line.** Keep the baselines flat; use the ruled lines.

The auto-tagging bullet is gone entirely. It failed four times across two
takes, and its punchline -- everything came back `#notes` / `#ideas`, useless --
read badly on camera when the plugin then tagged the output note `#notes`.

This is a deliberately easier page than the first one, and worth being honest
about: it supports the claim "it reads clear handwriting", not "it reads any
handwriting". It is still a phone photo of a real page in a real hand, so the
demo is not staged -- it is just not the hardest case. If the episode ever
wants to claim the hard case, that is a different page and probably a different
product state.

## Photographing it

The second shoot got this part right; keep doing it. Bright even light, dark
pen, page filling the frame, shot straight down, in focus. Crop out the spiral
binding if it is easy. Name the file something unhelpful, e.g. `IMG_4821.jpeg`,
so the rename at the end of the pipeline has something to push against.

## Test before you record

Dropping a photo in and reading the output takes about two minutes. Recording a
take takes fifteen. Do the cheap one first, every time: drop it in the inbox,
read the note, delete it, reset, adjust the handwriting, repeat. Only start the
recorder once an extraction comes back clean.

## The shot

Take 2 lost its own premise: the centre pane sat on an empty "New tab" for the
first 34 of 56 seconds, so the viewer never saw the handwritten page. The whole
episode is a before and after, and the before was missing.

Open the photo in the main pane first and leave it there. The order is:

1. Click the staged photo so it fills the centre pane. Hold on it.
2. Drag it into the inbox. The image stays open, so the page is still on screen
   while the panel works.
3. When processing completes, open the output note.

Know which note to open before you record. Take 2 opened two wrong notes before
finding the right one, and the hunting is in the footage.

## Where the photo lives between takes

Commit it into the vault at a staging path **outside** the inbox folder --
`demo-vault/Attachments/IMG_4821.jpeg` works. Two reasons:

1. The inbox processes whatever lands in it, immediately. If the photo is
   already there when you hit record, the interesting part has already
   happened. Worse, the plugin enqueues the *entire* inbox folder on load
   (`processBacklog()`, `packages/plugin/index.ts:1715`), so a photo sitting
   there gets eaten the moment you open the vault, before the recorder is even
   running.
2. `git checkout demo-vault/` only restores tracked files. The pipeline moves
   and renames the photo during processing, so if it is untracked you have to
   copy it back by hand before every take. Committed, the ordinary reset puts
   it back.

## Which folder is the inbox

Not `demo-vault/Unsorted/`. That folder holds three human notes for the
organizer demo and is deliberately *not* the inbox — see `docs/demo-vault.md`.

The inbox is whatever `pathToWatch` says in Settings -> Note Companion -> File
config, and the default is `_NoteCompanion/Inbox`. Leave it there. It is
gitignored, it starts every take empty, and it is the same path a viewer will
have after installing the plugin, so the footage matches their screen.

So on camera the drag is `Attachments/IMG_4821.jpeg` ->
`_NoteCompanion/Inbox/`, inside Obsidian, without a Finder window entering
frame. Expand `_NoteCompanion/` in the file tree *before* you start recording
so the drop target is already visible and the drag is one clean movement.

## Resetting between takes

`git checkout demo-vault/` restores the tracked notes and puts the photo back at
its staging path, but it will not touch `_NoteCompanion/` -- that whole tree is
gitignored, so the processed note, the moved attachment, the logs and the
backups all survive into the next take. Clear them explicitly:

```sh
git checkout demo-vault/
rm -rf demo-vault/_NoteCompanion
```

Then reopen the vault. The plugin recreates the folders it needs on load.
