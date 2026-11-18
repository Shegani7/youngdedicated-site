# youngdedicated.nl

The static site for YoungDedicated: built with [Eleventy](https://www.11ty.dev/) and hosted on Netlify.
It replaces the old WordPress site. The design is carried over 1:1 (theme CSS in `src/wp-content/themes/roots`).

## Editing pages

- Each page is a file in `src/`: `src/contact/index.html` becomes `/contact/`.
- At the top of each file is the frontmatter: `title` and `description` (SEO) and `permalink` (URL).
- Header, menu and footer are in `src/_includes/base.njk`. Menu items are in `src/_data/nav.json`.
- New page: copy an existing page into a new folder, then adjust the `permalink`, `title`, `description` and the content.
- Images go in `src/wp-content/uploads/<year>/<month>/`.
- Extra CSS and JS go in `src/assets/site.css` and `src/assets/site.js`.

## Forms

Forms work through Netlify Forms (`data-netlify="true"`). Submissions appear in Netlify under
*Site → Forms*. After submitting, visitors land on `/bedankt/`. A new form needs a unique `name`.

## Redirects

`src/_redirects` sends old WordPress URLs (expired vacancies, thank-you pages) to the right page with a 301.
Remove a page? Add a line to it: `/old-url/ /new-url/ 301`.

## Local development

```
npm install
npm start      # http://localhost:8080
npm run build  # output in _site/
```

Every push to `main` goes live automatically through Netlify. Deploy previews appear for pull requests.

## Deploys

Netlify builds every push to `main` (`npm run build`, publish `_site`). Other branches get a deploy preview.

## Applications to Recruitee

Applications now reach Recruitee through Netlify Forms email notifications (one per vacancy, to the Recruitee job inbox).
`tools/recruitee-function/submission-created.mjs` is an alternative that posts straight to the Recruitee API. It is switched off,
because running both creates duplicate candidates. To use it: move it to `netlify/functions/` and remove the email notifications.
