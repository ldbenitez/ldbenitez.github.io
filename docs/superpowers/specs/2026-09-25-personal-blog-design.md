# Personal Blog Redesign — Design Specification

**Status:** User-approved design  
**Date:** 2026-09-25

## Purpose

Evolve `lbenitez.dev` into a personal, writing-first site that feels recognizably Leonardo's, supports several forms of writing, and remains simple to publish and maintain. Keep Zola, Markdown authoring, and the existing GitHub Pages deployment. Create a custom site design while selectively reusing useful parts of the Terminus theme.

## Goals

- Make the homepage about writing, with long-form posts as the primary content.
- Give short thoughts and recommended links their own simple, chronological homes.
- Retain the selected text-first, terminal-inspired visual identity while making the site feel personal rather than like an unmodified theme.
- Offer coordinated dark and light themes.
- Keep publishing static, file-based, and low-friction.
- Make the site usable on mobile and readable in both themes.

## Not in scope

- A backend, database, account system, or third-party bookmark-saving service.
- A plugin for Links; entries are authored as Markdown content.
- Complex search, ranking, filtering, reactions, comments, newsletter subscriptions, or social-feed integrations.
- Replacing Zola or changing the GitHub Pages deployment workflow.
- Generated decorative artwork or a generic portfolio-style hero page.

## Information architecture

### Navigation

Use a small primary navigation:

**Posts · Notes · Links · About**

The theme control is available in the shared header. The Posts archive is accessible from the Posts page rather than adding another primary navigation item.

### Homepage

- The root URL is the writing homepage; it no longer redirects to `/posts/`.
- Start with the author's name and a short, personal description of the site.
- Show recent long-form posts immediately after the introduction.
- Each post listing shows its title and date, with an optional short description and topic tags.
- Include a clear path to the full Posts archive.
- Keep Notes and Links as separate sections, not intermixed into the primary post list.
- Keep profile information secondary; fuller biography and external links live on About.

### Posts

Long-form articles, tutorials, and essays remain standard Zola Markdown pages. Post titles and dates are required; summaries and tags are optional. Provide a chronological archive and retain the existing tag taxonomy for discovery.

### Notes

Notes are brief thoughts, observations, or a few sentences—not shortened essays. Each note:

- is a Markdown item with a publication date and stable, shareable URL;
- may omit a title;
- appears in reverse chronological order on the Notes page;
- does not require a topic tag or extended metadata.

### Links

Links are a chronological stream of recommended articles, videos, and other resources. Each item has:

- a title and destination URL;
- a publication date;
- optional short commentary explaining why it was saved or recommended;
- optional topic tags.

Each item has a stable local URL so a recommendation and its context can be shared directly. Keep the listing simple; topic tags are lightweight navigation aids, not a complex bookmark management feature.

### About

A concise profile page describing Leonardo and linking to relevant external profiles, including GitHub. It supports the writing without taking over the homepage.

## Visual design

Use the approved **Refined Terminus** direction as the starting point for a custom site design:

- Preserve a restrained, text-first, monospaced identity and a compact developer-notebook quality.
- Use spacing, hierarchy, and layout designed for this site rather than relying on the theme's defaults.
- Keep the homepage single-column and reading-oriented, with posts visually prominent.
- Use the existing charcoal/warm-text/amber character for dark mode.
- Create a coordinated light mode with warm paper, dark ink, and a muted rust accent.
- Use the accent sparingly for navigation state, metadata, and small details; prioritize readable contrast for article text.
- Do not depend on stock or AI-generated illustrations for distinctiveness. The site's voice and carefully chosen typography/layout provide its character.
- Retain the existing theme toggle. If the visitor has no saved choice, follow the operating-system color preference; persist an explicit choice.

The two modes should share structure and visual identity rather than appearing as unrelated themes.

## Content architecture and publishing

- Keep the source of truth as Markdown files in Zola content sections.
- Use section-specific templates for Posts, Notes, and Links, sharing the site's header, footer, navigation, and theme tokens.
- Store Links as authored content with explicit target URLs; do not fetch or import external feeds.
- Generate static HTML and separate RSS feeds for Posts, Notes, and Links through Zola. A combined feed is not required for this version.
- Keep the existing GitHub Pages action as the publishing path.
- Reuse or adapt Terminus components where useful, while keeping site-specific layouts and styling in this repository rather than maintaining an upstream theme fork.

## Accessibility and responsive behavior

- Use semantic navigation, headings, dates, and article/list markup.
- Ensure all navigation and the theme toggle are keyboard operable with visible focus.
- Give the theme toggle a clear accessible name that describes the action.
- Maintain legible text contrast in both palettes and avoid using accent color as the only way to communicate meaning.
- Keep long-form text at a comfortable measure and ensure dates, titles, and links reflow cleanly on narrow screens.
- Respect reduced-motion preferences; transitions, if used, remain subtle and nonessential.

## Reference patterns

The research informed the information structure, not a visual copy:

- [Julia Evans](https://jvns.ca/) combines a brief welcome, recent posts, topic-based discovery, TILs, and RSS.
- [Simon Willison](https://simonwillison.net/) maintains distinct longer articles, notes, and annotated links, with dates, tags, archives, and feeds. His [homepage redesign](https://simonwillison.net/2024/Jun/12/homepage-redesign/) discusses how he chose to bring several content types together; this design instead keeps the homepage focused on long-form Posts.
- [Jeremy Keith's Adactio](https://adactio.com/) demonstrates distinct article, journal, links, and notes streams with archives and feeds.
- [Derek Sivers' /now page](https://sive.rs/now2) is an optional pattern for a dated snapshot of current focus; it is not part of the initial scope.

These examples are useful precedents, not evidence that every successful personal site needs the same features.

## Acceptance criteria

1. The root page presents a short author introduction followed by recent Posts; it does not redirect away from the homepage.
2. Primary navigation provides Posts, Notes, Links, and About.
3. Posts, Notes, and Links have distinct chronological listings and generated static pages.
4. Notes support untitled short entries and stable individual URLs.
5. Links support title, destination URL, date, and optional commentary and topics, with stable individual URLs.
6. The site provides coordinated dark and light themes, with the existing preference behavior retained or improved.
7. Zola generates the site and the relevant RSS feeds without a new backend or publishing service.
8. GitHub Pages deployment remains the existing publishing mechanism.
9. Navigation, content listings, and theme control remain readable and operable on desktop and mobile, in both color themes.

## Verification approach

During implementation, use Zola's check/build commands, verify the generated home and each content section plus their feeds, and manually inspect responsive layouts, keyboard navigation, and both color themes. Include representative Markdown fixtures for titled and untitled Notes and Links entries in the local content so their layouts can be checked.
