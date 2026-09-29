# Website-Portofolio

A portfolio site for GitHub Pages with a built-in content editor. Comic-panel layout, light and dark mode, no build tools to install.

## Set up

1. Fork this repository, or use **Use this template**.
2. In your repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. Then open the **Actions** tab (on a fork, enable workflows there first) and run **Deploy site**, or push any commit. Your site appears at `https://<username>.github.io/<repository>/`.
3. Create a token for the editor at [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new):
   - **Repository access:** Only select repositories → your fork
   - **Permissions:** Contents → **Read and write** (Metadata read-only is added automatically)
4. Open `https://<username>.github.io/<repository>/admin/`, choose **Sign In with Token** and paste it.

The token only unlocks the editor. The site itself stays public and needs no login.

## Editing content

- **Home page** holds your profile, hero, experience, skills, recognition and contact details.
- **Work** has one entry per project. *Order* sets its place on the home page and in the Previous / Next links. A project page is built from sections: full-width video, awards, two columns, full-width text and galleries.
- **Images** can be jpg, png, webp or avif, up to 5 MB. **Videos** are YouTube links only. The deploy stops if any other file type, or anything over 5 MB, is committed under `assets/`.
- Every save is a commit, and the site updates about a minute later.

Replace the placeholder text and images, and delete `assets/img/placeholder/` once nothing uses it.

## Custom domain

On `github.io` everything is detected automatically. On a custom domain, set `url` and `baseurl` in `_config.yml`, and `backend.repo`, `site_url` and `display_url` in `admin/config.yml`.

## Local preview

```sh
pip install python-liquid markdown pyyaml
python _tools/render.py
python -m http.server -d _site 8765
```

## Credits

- Content editor: [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (MIT), loaded from unpkg.
- Placeholder videos: open movies by the [Blender Foundation](https://studio.blender.org/films/).
- Fonts: Archivo, IBM Plex Sans and Anton from Google Fonts (SIL Open Font License).

## License

[MIT](LICENSE)
