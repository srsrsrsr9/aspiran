# Publish UPSC Pods on Cloudflare yourself

Last updated 12 Oct 2026. Do the steps in order. Nothing here needs a secret pasted into chat or into any file in the app folder.

## 1. Create the database (D1)

1. Sign in at **dash.cloudflare.com**. The free plan is enough.
2. In the left menu, go to **Storage & Databases → D1 SQL Database → Create**.
3. Name it exactly:
   ```
   upsc-pods
   ```
   Leave the location on Automatic, then click **Create**.
4. Open the database and go to the **Console** tab.
5. Open `Documents\Personal\app\server\schema.sql` in Notepad. Copy all of it, paste it into the console box and click **Execute**. You should see a list of the tables it created.
6. On the database's overview page, copy the **Database ID**. It looks like `1a2b3c4d-...`. You need it in step 3. It isn't a secret.

## 2. Create two storage buckets (R2)

1. In the left menu, go to **Storage & Databases → R2 Object Storage**. If asked to turn R2 on, accept. The free tier covers this app, though it may ask for a card. Enter the card yourself.
2. Click **Create bucket** and name it:
   ```
   upsc-pods-media
   ```
   Keep the defaults and leave public access **off**.
3. Create a second bucket the same way, named:
   ```
   upsc-pods-backups
   ```
4. Don't upload anything to either bucket. The Gemma models come from Hugging Face through the server.

## 3. Upload the app (double-click, no terminal)

Do steps 1 and 2 first: the database tables and both buckets must exist.

1. In File Explorer, open `Documents\Personal\app\server` and double-click **publish.bat**.
2. When it asks for your Database ID, paste it and press Enter. Yours is already saved, so it may just say "already saved".
3. If your browser opens a Cloudflare page, check the address starts with `dash.cloudflare.com` and click **Allow**.
4. Wait a minute or two. It shows "Done! The app is live at: https://….workers.dev". Copy that address.
5. If it shows an error, it explains it in plain words (for example, which bucket to create). Send a screenshot of the window in the thread.

It never asks for passwords or secret keys.

## 4. Add the four secrets on the website

The Worker has to exist first, so do this after step 3.

1. In the left menu, go to **Workers & Pages → upsc-pods-production → Settings → Variables and Secrets → Add**.
Before you start, make the three passwords on your PC. Open PowerShell and paste this line. Each run copies a new random password to your clipboard, so run it three times. After each run, paste the password into your password manager, labelled `EDITOR_TOKEN`, `MOD_TOKEN` and `ADMIN_TOKEN` in turn.
```
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b).TrimEnd('=').Replace('+','-').Replace('/','_') | Set-Clipboard
```

For the Groq key, go to **console.groq.com → API Keys → Create API Key** and name it `upsc-pods`. Copy it straight into your password manager, because Groq shows it only once. Then delete the old key you pasted in chat.

2. For each name below, set **Type** to **Secret**, type the name exactly as shown, enter the value, then click **Deploy**.

   | Name (copy exactly) | Value |
   |---|---|
   | `EDITOR_TOKEN` | A long random password (32+ characters) for the editors' desk. Make it in your password manager. |
   | `MOD_TOKEN` | A different long random password, for moderators. |
   | `ADMIN_TOKEN` | A third, different long random password. This is your owner key. |
   | `GROQ_API_KEY` | A new key from **console.groq.com → API Keys → Create API Key**. Delete the old key you pasted in chat. |

3. Keep all four in your password manager. Don't put them in chat or in any file in the app folder. Later uploads keep the secrets you set here.

## 5. Check it works

1. Open your live address with `/app/` on the end. The web app should load, including the "Watch in your language" card.
2. Open `/desk/` and sign in with your `ADMIN_TOKEN`. Approve the sample mock paper there so it shows in Mocks.
3. Open `/admin` and sign in with your `ADMIN_TOKEN` to see language requests and result days.

## 6. Tell me the live address

Post the `.workers.dev` address in the thread. I'll point the Android release build and the Focus extension at it.

## 7. Build the Play Store file in Android Studio

Do this after I've pointed the Android app at your live address in step 6.

1. Open the `android` folder in Android Studio.
2. Go to **Build → Generate Signed App Bundle / APK → Android App Bundle → Next → Create new…**.
3. Fill in the new key:
   - **Key store path:** `Documents\Personal\upsc-pods-keys\upload.jks`
   - **Alias:** `upload`
   - **Passwords:** strong ones you choose. Keep them in your password manager.
4. Pick the **release** build and click **Create**. Android Studio shows where it saved `app-release.aab`.
5. Back up the `upsc-pods-keys` folder somewhere safe. If you lose it, you can't publish updates to the app.

## 8. Upload to Play Console

Go to **Play Console → your app → Testing → Internal testing → Create new release**. Upload `app-release.aab`, add release notes, then click **Review release → Start rollout**.
