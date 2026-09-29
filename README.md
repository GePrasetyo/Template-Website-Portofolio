# Website-Portofolio

A free portfolio website that you run yourself. It's hosted on GitHub, and you update the words, pictures and videos from a simple editor in your browser. No coding needed.

Setup takes about 15 minutes, and you only do it once. All you need is a free [GitHub account](https://github.com/signup).

**Steps:** [1. Get your own copy](#1-get-your-own-copy) · [2. Put your website online](#2-put-your-website-online) · [3. Make a key for the editor](#3-make-a-key-for-the-editor) · [4. Open the editor](#4-open-the-editor) · [5. Make it yours](#5-make-it-yours) · [6. When your key runs out](#6-when-your-key-runs-out) · [Something not working?](#something-not-working)

---

## 1. Get your own copy

Everything for your site lives in a *repository*, which is simply a project folder on GitHub. First, make your own copy of this one.

1. Sign in to GitHub, then click the green **Use this template** button at the top of this page and choose **Create a new repository**.
2. Give it a name. The name becomes part of your website address:
   - Name it **`yourusername.github.io`** (with your own GitHub username) and your site will be at `https://yourusername.github.io/`
   - Any other name, for example **`portfolio`**, gives you `https://yourusername.github.io/portfolio/`
3. Leave it set to **Public**, then click **Create repository**.

## 2. Put your website online

1. In your new repository, click **Settings** (top menu), then **Pages** (left menu).
2. Under **Build and deployment**, change **Source** to **GitHub Actions**. It saves by itself.

   ![Pages settings, with Source set to GitHub Actions](docs/images/enable-pages.png)

   GitHub will suggest some options below it, such as "GitHub Pages Jekyll". **Ignore them**; don't click Configure. Your copy already has everything it needs.

3. Click the **Actions** tab (top menu). On the left, click **Deploy site**, then click **Run workflow**, and **Run workflow** again in the box that opens.
4. Wait about a minute until it shows a green ✓. Your website is now online at the address from step 1.

You might also see an earlier red ✗ in that list. That's normal: it ran before you switched Pages on.

## 3. Make a key for the editor

The editor needs permission to save changes to your website. You give it that permission with a *token*: a long password that works only for this one website and can only change its content.

1. Open **[this link to create a token](https://github.com/settings/personal-access-tokens/new)**. (Or: your profile picture → **Settings** → **Developer settings** at the bottom of the left menu → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.)
2. Fill in the form:
   - **Token name:** anything you'll recognise, e.g. `Portfolio editor`
   - **Expiration:** how long the key works, e.g. 30 or 90 days. You can renew it later ([step 6](#6-when-your-key-runs-out)).
   - **Repository access:** choose **Only select repositories**, open **Select repositories** and pick the repository you made in step 1.
   - **Permissions:** click **Add permissions**, tick **Contents**, then set its **Access** to **Read and write**.

     **Metadata** gets added by itself as "Required". That's expected, so leave it. Don't add anything else.

   ![Token form with one repository selected, Contents set to Read and write, and Metadata read-only](docs/images/generate-token.png)

3. Click **Generate token** at the bottom.
4. GitHub shows your token **once**. Click the copy button next to it and keep it somewhere safe, such as your password manager.

Keep this token private, like a password. Don't post it or share screenshots of it.

## 4. Open the editor

1. Go to your website address with **`/admin/`** added to the end, for example `https://yourusername.github.io/portfolio/admin/`. Bookmark this page.
2. Click **Sign In with Token**, paste your token, and click **Sign In**.

   ![The Sign In Using Access Token box](docs/images/sign-in-token.png)

Anyone can open the `/admin/` page, but without your token they can't see or change anything. Visitors to your website never need to sign in.

Your browser remembers you. On a shared computer, sign out when you're finished: click the account icon in the top-right corner, then **Sign Out**.

## 5. Make it yours

Your copy starts with example text and placeholder pictures. Replace them with your own.

On the left of the editor you'll see two things:

- **Projects:** each project gets its own page and a card on the home page.
- **Home page:** your main page, split into parts in the same order as on the page:
  - **Profile:** your name, job title, email and résumé (PDF)
  - **Intro (top of page):** your title lines, a short "about me" and your links
  - **Work section (heading), Experience, Skills, Recognition and quick facts, Contact:** the rest of the page

Every field has a short explanation in grey underneath it. Fields marked with a star (*) must be filled in.

**To change something:** open it, edit the fields, then click **Save**. Your website updates by itself about a minute later. Refresh the page to see it.

**Projects:**
- To **add a project**, open **Projects** and click **New**.
- The **Order** number decides where a project appears: 1 comes first.
- Switch on **Featured (wide card)** to make the project's card extra wide on the home page.
- A project page is built from **Page sections**, which you can add, remove and reorder:
  - a big video
  - a big 3D model
  - a row of awards
  - two boxes side by side (text, a picture, a video or a 3D model)
  - a wide text box
  - a gallery of pictures, videos and 3D models
- To hide an example project, switch off **Show on site** and save. Or delete it.

**Pictures:**
- JPG, PNG, WebP or AVIF, up to **5 MB** each.
- If a picture is too big, shrink it for free at [squoosh.app](https://squoosh.app).
- Wide pictures (landscape) work best for project cards.

**Videos:**
- Videos come from **YouTube**. Upload yours there first, then paste its link into the video field.
- "Unlisted" YouTube videos work too.
- Video files can't be uploaded to your site. If one gets in, the website won't update until it's removed.

**3D models:**
- 3D models come from **Sketchfab** or **ArtStation**. Upload yours there first.
- **Sketchfab:** open the model and copy the link from your browser's address bar, e.g. `https://sketchfab.com/3d-models/my-model-1a2b3c…`
- **ArtStation:** open your artwork, copy the **embed code** under the 3D viewer and paste all of it. The artwork's page link on its own doesn't work.
- Sketchfab tends to be more reliable. ArtStation's viewer is sometimes blocked by its bot protection, and those visitors see an empty box.

**Text styling:**
- Put two stars on each side to make text **bold**: `**like this**`
- One star on each side makes it *italic*: `*like this*`
- For a link: `[the words people click](https://the-address.com)`

**Panel shape:** each box on the page has a slightly slanted, comic-book edge. It's only decoration: leave it empty and the site picks one for you. To choose yourself, click **See the shapes** under the field for a picture of each shape and which ones go together.

## 6. When your key runs out

When your token expires, the editor stops letting you in. Your website stays online the whole time. You don't have to make a new token; you can renew the old one:

1. Open your [tokens page](https://github.com/settings/personal-access-tokens) and click your token's name.
2. Click **Regenerate token**, choose a new expiration, and confirm.

   ![A token's page, with the Regenerate token button on the right](docs/images/regenerate-token.png)

3. Copy the new token. The old one stops working.
4. In the editor, sign out, then sign in again with the new token.

If your token was ever seen by someone else, click **Delete** on the same page. It stops working right away. Then make a new one as in [step 3](#3-make-a-key-for-the-editor).

---

## Something not working?

**My website shows "404" or "Site not found"**
- Open the **Actions** tab and check that the newest **Deploy site** has a green ✓.
- Also check that **Settings → Pages → Source** says **GitHub Actions**.
- After the first green ✓, it can take another minute or two to appear.

**Deploy site has a red ✗**
- Click it to see which step failed.
- **Setup Pages:** Pages isn't switched on yet. Do [step 2](#2-put-your-website-online), then run it again.
- **Check uploads:** a file that isn't allowed got in, such as a video, another file type, or a file over 5 MB. The details list which file. In the editor, open **Assets**, delete that file, and the site updates again.

**The editor won't let me sign in**
- Check that the token includes the right repository and has **Contents: Read and write**.
- Check that the token hasn't expired ([step 6](#6-when-your-key-runs-out)).

**I saved, but my website hasn't changed**
- Wait for the green ✓ in the **Actions** tab.
- Then reload your site with **Ctrl + Shift + R**, or **Cmd + Shift + R** on a Mac.

---

## For developers

- **How it's built:** the site is built with Jekyll by GitHub Actions (`.github/workflows/pages.yml`). Content lives in `_data/` and `_work/`, and templates in `index.html`, `_layouts/` and `_includes/`. The editor is [Sveltia CMS](https://github.com/sveltia/sveltia-cms), configured in `admin/config.yml`.
- **Custom domain:** on `github.io`, the site address and repository are detected automatically. On a custom domain, set `url` and `baseurl` in `_config.yml`, and `backend.repo`, `site_url` and `display_url` in `admin/config.yml`.
- **Local preview:**

  ```sh
  pip install python-liquid markdown pyyaml
  python _tools/render.py
  python -m http.server -d _site 8765
  ```

## Credits

- Editor: [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (MIT licence)
- Placeholder videos: open movies by the [Blender Foundation](https://studio.blender.org/films/)
- Fonts: Archivo, IBM Plex Sans and Anton from Google Fonts (SIL Open Font Licence)

## Licence

Free to use and change under the [MIT licence](LICENSE).
