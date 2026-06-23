# Brain Pocket

A tiny personal app for quick **todos** and **notes**. Plain HTML, CSS and
JavaScript. Data is stored in [Supabase](https://supabase.com) so it syncs
across your devices.

## Features

- Add todos and notes
- Two separate sections
- Mark todos done / undone (done items show as struck-through)
- Edit and delete any item
- Search across everything
- Tags (Personal, Study, Movies, Calls, Errands, Other) — add and delete your own
- "Clear all data" button with a confirmation

---

## 1. Set up Supabase (one time)

1. Create a free account at [supabase.com](https://supabase.com) and make a new project.
2. In the project, open **SQL Editor** and run this to create the table:

   ```sql
   create table items (
     id bigint generated always as identity primary key,
     text text not null,
     type text not null,
     tag text,
     done boolean default false,
     created_at timestamptz default now()
   );

   alter table items enable row level security;

   create policy "public access" on items
     for all using (true) with check (true);
   ```

   (Single-user app, so this policy simply allows full access.)

3. Open **Project Settings → API** and copy:
   - the **Project URL**
   - the **anon public** key

4. In this folder, copy `config.example.js` to a new file named **`config.js`**
   and paste your two values into it.

> `config.js` and `.env` are listed in `.gitignore`, so your keys are **not**
> uploaded to GitHub. `.env.example` and `config.example.js` show the format only.

## 2. Run it locally

Just open `index.html` in your browser (double-click it). That's it.

## 3. Create a GitHub repository

1. Go to [github.com](https://github.com) → **New repository**.
2. Name it (e.g. `brain-pocket`) and click **Create repository**.

## 4. Upload the files

Either drag the files into the repo's web page (**Add file → Upload files**),
or from a terminal in this folder:

```bash
git add .
git commit -m "Brain Pocket"
git push
```

(`config.js` and `.env` are ignored automatically.)

## 5. Enable GitHub Pages

1. In the repo: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick the `main` branch and the `/ (root)` folder, then **Save**.
4. Wait a minute; your app appears at `https://YOUR-USERNAME.github.io/brain-pocket/`.

> Because `config.js` is git-ignored, the live site won't have your keys yet.
> On GitHub: **Add file → Create new file**, name it `config.js`, paste the same
> two lines you put locally, and commit. (Your anon key is meant to be public,
> but keep it out of the public commit history if you prefer — that's why it's ignored.)

## 6. Open it on your phone

Open the GitHub Pages URL in your phone's browser. Optionally use the browser's
**Add to Home Screen** option so it behaves like an app.

## Note about storage

Data lives in **Supabase (the cloud)**, so it **does sync** between your PC and
phone automatically. An internet connection is required to load and save.
