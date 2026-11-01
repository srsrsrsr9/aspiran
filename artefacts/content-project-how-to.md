# Make all the content in one claude.ai Project (2 Nov 2026)

## Set up once (10 minutes)
1. In claude.ai, choose **Projects → New project**. Name it "Aspiran content".
2. Open **Project instructions**. Paste the whole of `artefacts/aspiran-content-project/PROJECT-INSTRUCTIONS.md`.
3. Under **Project files**, upload every other file in `artefacts/aspiran-content-project/` (12 files):
   `01-brief.md`, `02-status.md`, `check_batch.py`, and the `done-…` and `example-…` JSON files.
4. In **Settings → Capabilities**, turn on **Code execution and file creation**. Without it, Claude can't run the checker
   or make the zip.
5. Model: Opus, with extended thinking on if your plan has it.

## Run it
- **One chat per batch.** A chat can't start other chats. To work in parallel, open several chats in the Project at
  once (new tabs) and type one line from `02-status.md` in each. Within a group, the batches don't depend on each other.
- Suggested order: **Group 1** first (9 chats), then **Group 2** (9 chats), then **Group 3**. If you hit your usage
  limit, the chats you've started keep their work; carry on later.
- Each chat ends with a download, e.g. `aspiran-B05.zip`. Save every zip to `~/Downloads/aspiran-batches/`.
- If a chat stops halfway, type `continue`. If it gives files but no zip, type `zip it now`.

## Then
Tell me "content zips are in". I check every file with code, list anything to fix (as lines you can paste back
into that batch's chat), and import the rest into the app as drafts. When I change `02-status.md`, re-upload it to
the Project in place of the old one.

## Videos (separate)
Video episodes need a different set-up (the kit, a voice model and video tools), so they aren't part of this Project.
Use a separate chat with code execution, upload `docs/content/files (1).zip` → `upsc-pods-kit.zip`, and paste **Prompt
A** from the kit's README with the topic rows in Part 4 of `artefacts/content-assignment-2026-11-02.md`. If that chat
can't install the voice model or video tools, tell me, and we'll find another way.
