# Deadline Desk with email reminders

Website + a reminder job that emails you 24 h and 2 h before each deadline, even when the site is closed.
Everything below uses free tiers. Takes about 20 minutes.

## 1. Database (Supabase)
1. Create a free project at supabase.com.
2. SQL Editor > New query > paste `schema.sql` > Run.
3. Authentication > Sign In / Providers > Email: turn OFF "Confirm email" (easiest; otherwise sign-up needs an email click).
4. Project Settings > API: copy the **Project URL**, the **anon public** key, and the **service_role** key.

## 2. Website
1. Open `index.html`, replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` (the anon key is safe to be public).
2. Never put the service_role key in index.html.

## 3. GitHub (hosts the site and runs the reminders)
1. Create a **public** repo and upload all files in this folder (keep the `.github` folder).
2. Settings > Pages > Deploy from branch > main / root. Your site appears at `https://<you>.github.io/<repo>/`.
3. Settings > Secrets and variables > Actions > New repository secret. Add:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_SERVICE_KEY` (service_role key)
   - `GMAIL_USER` (the Gmail address that sends the emails)
   - `GMAIL_APP_PASSWORD` (see below)

## 4. Gmail app password
Google Account > Security > turn on 2-Step Verification > search "App passwords" > create one > paste the 16 characters (no spaces) into the secret.

## 5. Test
Open your site, create an account, add an assignment due in about 1 hour. Then GitHub > Actions > "Deadline reminders" > Run workflow. Check your inbox (and spam).

## Notes
- The job runs every 15 minutes; GitHub can delay scheduled runs by several minutes.
- GitHub pauses scheduled workflows after 60 days without repo activity; re-enable them in the Actions tab if that happens.
- Change reminder times with `REMIND_HOURS` and your timezone with `TIMEZONE` in `.github/workflows/remind.yml`.
- Gmail limits roughly 500 emails a day, plenty for personal use.
