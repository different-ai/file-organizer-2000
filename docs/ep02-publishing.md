# Episode 2 — publishing copy

Copy for the YouTube upload and the LinkedIn post. Kept in the repo because
episode 1's copy only ever existed in a chat thread, which was the wrong
place for it.

## Before anything goes out

OCR runs server-side at `/api/vision`. This episode was shot against
`feat/unified-ocr-pipeline`, which is **not merged into master** as of
2026-10-17. Until that is merged and deployed, the video shows an extraction
quality that a shipped user does not get. Do not publish before then.

Check with:

```sh
git merge-base --is-ancestor origin/feat/unified-ocr-pipeline origin/master \
  && echo MERGED || echo "NOT MERGED"
```

## YouTube

### Title, option A

> I photographed a page of messy handwriting and Obsidian read every word

Specific, first-person, and the claim is the demo. "Messy" is doing the work:
it pre-empts the obvious objection instead of waiting for it in the comments.

### Title, option B

> Handwritten notes into Obsidian, without typing them up

Lower-key and searchable. Matches what someone actually types when they have
this problem, which option A does not.

Run both. The channel is small enough that the thumbnail A/B test matters
more than the title, but there is no reason not to test both.

### Description

```
A photo of a handwritten page goes into the Note Companion inbox. Thirty
seconds later it is a markdown note in the vault: read, titled, tagged and
filed. No typing, no clicking through a wizard.

The page in this video is a real one -- abbreviations, arrows, a struck-out
word, the lot. The transcription you see is what came back, not a cleaned-up
version.

What happens between the drop and the note:

0:00  The page, and the problem -- a photo your vault cannot search
0:07  Drop it in the inbox folder
0:12  Extracting the text
0:16  Working out what the document is and where it belongs
0:21  Writing a title, adding tags
0:25  The finished note

Note Companion is an Obsidian plugin. Your notes stay local markdown files in
your own vault.

https://notecompanion.ai

Chapters are for the product steps, not for me talking -- there is no
voiceover. Captions are burned in.
```

Tags: `obsidian`, `obsidian plugin`, `handwriting ocr`, `note taking`,
`pkm`, `second brain`, `handwritten notes`, `ocr`, `markdown`.

## LinkedIn

```
I keep a paper notebook for interviews. It is faster than a laptop and it
does not put a screen between me and the person talking.

The problem is afterwards. The page is a photo in my camera roll, and a photo
is not something a vault can search. So either I retype it, or in practice I
do not, and the note quietly stops existing.

We just got Note Companion reading handwriting properly. Drop the photo in
the inbox folder, and thirty seconds later it is a markdown note -- the text
extracted, a title written, tags added, filed into the vault.

The page in the clip is a real one. Abbreviations, arrows, a word scribbled
out. The transcription in the video is exactly what came back.

Note Companion is an Obsidian plugin. Everything stays as local markdown in
your own vault.

notecompanion.ai
```

Post the vertical cut (`out/clip2.mp4`), not the YouTube one. Native video,
not a YouTube link -- a link collapses the reach.

## Thumbnails

Three variants, rendered with `remotion still`. YouTube A/B tests up to
three, so upload all of them.

| Id | Headline | Angle |
|---|---|---|
| `Ep2ThumbA` | Your handwriting. Searchable. | Benefit |
| `Ep2ThumbB` | Notebook → Obsidian | Pipeline |
| `Ep2ThumbC` | Stop retyping your notes. | Pain |

```sh
cd packages/video
npx remotion still Ep2ThumbA out/ep02-thumb-a.png
npx remotion still Ep2ThumbB out/ep02-thumb-b.png
npx remotion still Ep2ThumbC out/ep02-thumb-c.png
```

These need `public/shot-page2.png` and `public/shot-note2.png`, which are
derived from the footage and not committed. See the commit that added the
variants for the two ffmpeg lines that regenerate them.

## What not to claim

The footage does not support these, so they are absent from the copy and
should stay absent:

- **"Formats it as markdown."** The body lands inside a fenced `plaintext`
  block. The file is markdown; the content inside it is not formatted.
- **Anything about the destination folder.** It filed to `Recordings/`, not
  `Research/` next to the two sibling interview notes. Plausible -- the page
  says "record every client call" -- but not the right answer, and a viewer
  following the vault may notice.
- **"Works for any handwriting."** One page, one hand, good light. It is a
  fair demo, not a benchmark.

If a comment asks about messier writing or worse photos, the honest answer is
that it depends on the photo, and to try it on a real page.
