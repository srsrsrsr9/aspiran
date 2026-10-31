# Switching offline Chotu Lite to Gemma 3 1B

Oct 13, 2026 · @Edureka

## Why

Offline Chotu Lite currently runs Qwen3 0.6B (about 497 MB). Google's Gemma 3 1B (about 557 MB) gives noticeably better answers for only about 60 MB more. Google gates it behind a licence on Hugging Face, so the app's server can't download it on its own. You accept the licence once, then host the file yourself in Cloudflare R2.

The bigger Chotu Standard and Large models (Gemma 4 E2B and E4B) are Apache-2.0 and not gated, so nothing changes for them.

## The licence

- **Licence:** Gemma Terms of Use (Google). It allows commercial use, including shipping the model inside an app, as long as you follow Google's Prohibited Use Policy and pass the same terms on to anyone you redistribute the model to.
- **What this means for us:** link to the Gemma Terms of Use from the app's About or Licences page, and don't use Chotu for anything on Google's prohibited-use list. A study and support companion is fine.
- Read the full terms on the model page before you click Agree. This is a summary, not legal advice.

## Steps for you (about 15 minutes)

1. Sign in (or sign up free) at huggingface.co.
2. Open https://huggingface.co/litert-community/Gemma3-1B-IT and click **Agree and access repository**.
3. Under **Files and versions**, download `gemma3-1b-it-int4.litertlm`. It is 584,417,280 bytes (about 557 MB).
4. Optional check: its SHA-256 should be `1325ae366d31950f137c9c357b9fa89448b176d76998180c08ceaca78bba98be`. In PowerShell: `Get-FileHash .\gemma3-1b-it-int4.litertlm`
5. In Cloudflare, go to **R2 → upsc-pods-media → Upload**. Upload the file so its key is exactly `models/gemma3-1b-it-int4.litertlm`. Create the `models` folder first if it isn't there.
6. Tell me in the thread when it's uploaded.

You don't need to change any settings. Leave `MODEL_FILES_URL` unset.

## What I change after that

- In `server/src/chotu.ts`, add Gemma 3 1B as **Chotu Lite**, pinned to Hugging Face version `d448835d84411a08f577e25f3afebe528402d73b`, with its size and checksum, a minimum of about 3.5 GB RAM, and thinking turned off.
- Remove the Qwen3 0.6B entry. The app picks the smallest model that fits the phone, so Qwen would otherwise still be chosen.
- Update the model table in the README.
- Then you run `server\publish.bat` once. No APK rebuild is needed, because the app reads the model list from the server.

## What users see

Nothing changes on screen. The offline button reads "Make Chotu work offline · 557 MB · Wi-Fi only". Anyone who already downloaded the old Lite model keeps it until they remove it in Me → Privacy and download again.
