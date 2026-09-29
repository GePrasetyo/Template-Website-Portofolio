# Website-Portofolio

A portfolio site for GitHub Pages with a built-in content editor. Comic-panel layout, light and dark mode, no build tools to install. You edit everything from your browser, and only you can sign in to the editor.

**Contents:** [1. Make your copy](#1-make-your-copy) · [2. Turn on GitHub Pages](#2-turn-on-github-pages) · [3. Create an access token](#3-create-an-access-token) · [4. Sign in to the editor](#4-sign-in-to-the-editor) · [5. Add your content](#5-add-your-content) · [6. When the token expires](#6-when-the-token-expires) · [Troubleshooting](#troubleshooting)

---

## 1. Make your copy

1. At the top of this repository, click **Use this template → Create a new repository**. (A fork works too.)
2. Pick a name:
   - `<username>.github.io` puts the site at `https://<username>.github.io/`
   - any other name, e.g. `portfolio`, puts it at `https://<username>.github.io/portfolio/`
3. Keep it **Public**. GitHub Pages is free for public repositories.

On a fork, open the **Actions** tab once and click **I understand my workflows, go ahead and enable them**.

## 2. Turn on GitHub Pages

In your new repository, go to **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.

![Settings → Pages with Source set to GitHub Actions](docs/images/enable-pages.png)

Don't click **Configure** on the suggested workflows. The repository already has its own, called **Deploy site**.

Then open the **Actions** tab, select **Deploy site**, and click **Run workflow**. When it shows a green check (about a minute), your site is live at the address from step 1.

## 3. Create an access token

The editor saves your changes straight to your repository, so it needs a key that allows exactly that and nothing more.

Open [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) (GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token) and fill in:

| Field | Value |
| --- | --- |
| Token name | anything, e.g. `Portfolio Admin` |
| Resource owner | your account |
| Expiration | e.g. 30 or 90 days (see [step 6](#6-when-the-token-expires)) |
| Repository access | **Only select repositories** → the repository you created in step 1 |
| Permissions | **Add permissions → Contents → Access: Read and write** |

**Metadata: Read-only** is added automatically and is required. Leave everything else out.

![New fine-grained token with one repository selected, Contents read and write, Metadata read-only](docs/images/generate-token.png)

Click **Generate token**, then click the copy button next to the token right away. GitHub shows it only once.

Treat the token like a password. Don't paste it into issues, chats or screenshots. Don't use a classic token, because its `repo` scope unlocks every repository you own.

## 4. Sign in to the editor

1. Open `https://<username>.github.io/<repository>/admin/` (for a `<username>.github.io` repository: `https://<username>.github.io/admin/`).
2. Click **Sign In with Token**, paste the token, and click **Sign In**.

![Sign In Using Access Token dialog](docs/images/sign-in-token.png)

The token is kept in that browser only. Nobody visiting your site needs it; the site itself stays public. On a shared computer, sign out from the account menu when you're done.

## 5. Add your content

The editor has two sections:

- **Home page:**
  - **Profile:** name, tagline, email and résumé PDF
  - **Hero:** title lines, intro and links
  - **Work section, Experience, Skills, Recognition and quick facts, Contact**
- **Work:** one entry per project.
  - **Order** sets its place on the home page and in the Previous / Next links, with 1 first.
  - **Featured** makes the card wide.
  - A project page is built from **Sections**, which you add, remove and reorder: full-width video, awards, two columns, full-width text and galleries.

Things to know:

- **Saving publishes.** Every save is a commit to your repository, and the site updates about a minute later. You can follow it in the Actions tab.
- **Images** can be jpg, png, webp or avif, up to 5 MB.
- **Videos** are YouTube links only. Paste the video URL (`youtube.com/watch?v=…`, `youtu.be/…` or `/shorts/…`). Video files can't be uploaded, and the deploy stops if a video or any other disallowed file lands under `assets/`.
- **Text** fields take Markdown: `**bold**`, `*italic*`, `[link](https://…)`.
- **Panel shape** picks the comic-panel cut. Leave it empty and the site chooses one.

When all the placeholders are replaced, delete `assets/img/placeholder/` and `assets/doc/resume.pdf` if nothing uses them any more.

## 6. When the token expires

You don't need a new token. Open the token on the [Fine-grained tokens](https://github.com/settings/personal-access-tokens) page and click **Regenerate token**. It keeps the same name, repository and permissions, and you pick a new expiration date.

![Token details page with the Regenerate token button](docs/images/regenerate-token.png)

Regenerating gives you a new token and the old one stops working. In the editor, sign out, then sign in again with the new token.

If a token ever leaks, click **Delete** on the same page. It stops working immediately.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The site shows 404 | Check the latest **Deploy site** run in the Actions tab, and that Settings → Pages → Source is **GitHub Actions**. Give it a minute after the green check. |
| Deploy failed at **Setup Pages** | Pages isn't switched to GitHub Actions yet. Do [step 2](#2-turn-on-github-pages), then run the workflow again. |
| Deploy failed at **Check uploads** | The log lists the files that aren't allowed (videos, other file types, or files over 5 MB). Delete them and save again. |
| Sign-in says *Not Found* or *Bad credentials* | The token doesn't include this repository, doesn't have Contents: Read and write, or has expired. |
| An edit doesn't show up | Wait for the Actions run to finish, then reload the page without the cache (Ctrl+Shift+R, or Cmd+Shift+R on a Mac). |

## Custom domain

On `github.io`, the site address and repository are detected automatically. On a custom domain, set `url` and `baseurl` in `_config.yml`, and `backend.repo`, `site_url` and `display_url` in `admin/config.yml`.

## Local preview (optional)

```sh
pip install python-liquid markdown pyyaml
python _tools/render.py
python -m http.server -d _site 8765
```

Then open `http://localhost:8765/`.

## Credits

- Content editor: [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (MIT), loaded from unpkg.
- Placeholder videos: open movies by the [Blender Foundation](https://studio.blender.org/films/).
- Fonts: Archivo, IBM Plex Sans and Anton from Google Fonts (SIL Open Font License).

## License

[MIT](LICENSE)
