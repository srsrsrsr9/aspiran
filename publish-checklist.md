# What you need to do: from your PC to the Play Store

These are the steps only you can take (accounts, payments, legal forms). I handle the code. Items marked *check* are policies that change, so confirm them on the linked page when you get there.

## Stage 1: Run the app on your PC (now)

1. **Install Android Studio** from https://developer.android.com/studio. It includes Java and the Android SDK. That's all slice 1 needs.
2. Open Android Studio, choose **File > Open**, and pick `C:\Users\Srinivas Vedantham\Documents\Personal\app\android`.
3. Let it **sync** (the first sync downloads Gradle and libraries). If it offers to create the Gradle wrapper or upgrade a plugin, accept.
4. Create an emulator in **Device Manager** (any recent Pixel image), or plug in your Android phone with **USB debugging** turned on (Settings > About > tap Build number 7 times > Developer options).
5. Press **Run**. You should see the Today screen with three sample Chai Cards.

Tell me if the sync or build shows an error, and paste it here.

## Stage 2: Cloudflare (when we build slice 2)

1. Create a free account at https://dash.cloudflare.com/sign-up. No card is needed for the free plan.
2. Pick a **workers.dev subdomain** when it asks (free). A custom domain is optional and can come later.
3. When I've written the Worker, run `npx wrangler login` once on your PC. It opens the browser so you can approve access. I'll give you the exact commands to deploy.
4. *Check:* Workers AI and Durable Objects free-plan limits on the Cloudflare pricing pages before launch.

## Stage 3: Before the pod test (testers only, no public listing)

1. **Google Play developer account**: https://play.google.com/console/signup. One-time US$25 fee, plus ID verification.
   - Choose **Personal** or **Organization**. An organization account needs a D-U-N-S number but avoids the tester rule below. *check*
   - **Personal accounts** created after November 2023 must run a **closed test with at least 12 testers for 14 days in a row** before you can publish to everyone. Your pod test can be that closed test. *check*
2. **Privacy policy page**: a public URL is required. I'll draft the text from what the app actually does (private data stays on the phone). You host it (a free Cloudflare Pages site works).
3. **Support email** for the store listing.

## Stage 4: Store setup in Play Console

1. **Create the app** in Play Console (name, default language, free).
2. **App signing**: accept **Play App Signing**. You'll create an upload key in Android Studio (Build > Generate Signed App Bundle). **Back up the keystore file and password somewhere safe.** If you lose it, recovering takes a support request.
3. **App content forms** (Policy > App content):
   - **Data safety**: what's collected and shared. Ours is short because mood, journal and private chat stay on the phone. I'll prepare the answers.
   - **Content rating** questionnaire (IARC).
   - **Target audience**: set to 18+ (UPSC aspirants are adults, and it keeps child-safety rules simpler).
   - **AI-generated content**: Play requires generative AI apps to let users **report offensive AI output** in the app. The app will have a "Report" option on Chotu's messages. *check*
   - **Health features**: we offer emotional support and a helpline link. Answer the health-apps declaration honestly. We present the app as peer support, not medical care. *check*
   - **Ads**: declare "no ads".
4. **Store listing**: short and long description, icon (512×512), feature graphic (1024×500), and at least 2 phone screenshots. I can generate drafts.
5. **Target API level**: Play requires a recent target SDK. The project targets 35 now; I'll raise it if Play asks for 36. *check*

## Stage 5: Testing tracks, then launch

1. **Internal testing** (up to 100 testers, instant): you and a few friends. Upload the signed `.aab`.
2. **Closed testing**: the pod test, with at least 12 opted-in testers for 14 days on a personal account. Collect feedback here.
3. **Apply for production access** in Play Console (personal accounts) and answer the questions about your test.
4. **Production**: start with a staged rollout (for example 20%), then increase.

## Things to keep in mind

- **Model downloads**: the app stays small, and models download from Hugging Face after install. Play allows this. The app shows the download size and asks before downloading on mobile data.
- **India's DPDP Act, 2023**: keeping personal data on the phone helps. We still need consent text and a way to delete an account. I'll build both before the closed test.
- **Tele-MANAS 14416**: confirm the number is still current before launch.
- **Costs to expect**: $25 Play fee (one time). Cloudflare free plan. A domain is optional (about ₹800 to ₹1,000 a year).
