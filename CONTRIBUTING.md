# Contributing to FoodSense AI

First: thank you for considering this. Open source projects either die from neglect or survive because a few people decided to care. You are one of those people. That matters.

This document covers how the project is structured, what good contributions look like, and how to avoid the mistakes that make maintainers quietly close pull requests without comment.

---

## Before you write a single line of code

Check if there's already an issue open for what you want to do. If there is, comment on it. If there isn't, open one. Describe what you want to change and why. Wait for a response before spending a weekend on something that turns out to conflict with the project's direction.

This isn't bureaucracy. It's how you avoid the heartbreak of submitting a 400-line PR and learning the maintainer was already halfway through the same thing.

---

## Setting up locally

```bash
git clone https://github.com/yourusername/foodsense-ai
cd foodsense-ai
npm install
```

You need three environment variables. Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Get a Supabase project at supabase.com (free). Get a Gemini key at aistudio.google.com (also free, takes 90 seconds). Run the schema SQL in the Supabase editor. Then:

```bash
npm run dev
```

If it doesn't start, the problem is almost certainly the `.env` file. Check it exists, check the variable names start with `VITE_`, check there are no quotes around the values.

---

## Project structure

Understanding where things live before you start moving them around.

```
src/
  components/      Reusable UI pieces. Not page-specific.
    layout/        Sidebar and Topbar. Touch these carefully — they affect every page.
    dashboard/     The four dashboard widgets. Each is self-contained.
    ui/            Card and Badge. The only two generic primitives in the project.
  pages/           One file per route. Each page composes components and hooks.
  hooks/           All Supabase data fetching lives here. No fetching in components.
  lib/
    supabase.js    Client setup. One line. Don't add logic here.
    gemini.js      Every Gemini API call in the project. All of them. In one file.
  context/
    ThemeContext   Light/dark mode. Don't replicate this pattern elsewhere.
```

The rule is: data fetching in hooks, AI calls in `gemini.js`, rendering in components. If you're writing a `fetch()` call in a component file, you're in the wrong place.

---

## The design system

The entire visual system runs on CSS custom properties defined in `index.css`. There are two themes — light and dark — toggled by a `data-theme` attribute on `<html>`.

When you add UI elements, use the variables. Do not hardcode colors.

```css
/* Correct */
color: var(--text);
background: var(--surface);
border: 1px solid var(--border);

/* Wrong */
color: #18181b;
background: #ffffff;
border: 1px solid #e5e5e2;
```

The hardcoded values work in light mode and break in dark mode. The variables work in both. This is the entire reason variables exist.

The application uses inline styles rather than Tailwind classes for component-level styling. This is intentional — it keeps theme variables accessible without a build step to resolve them. If you want to add Tailwind utility classes for layout (flex, grid, gap), that's fine. For colors and typography, use variables.

---

## Writing Gemini prompts

All AI features call Gemini through functions in `src/lib/gemini.js`. If you're adding a new AI feature, add it there. Not in the component, not in the hook — in `gemini.js`.

A few things that matter when writing prompts for this application:

**Ask for JSON when you need structured data.** The scenario planner and prediction functions return JSON. Instruct the model explicitly to return only JSON with no preamble, no markdown fences, nothing else. Then strip fences defensively anyway because models sometimes lie.

```js
const clean = text.replace(/```json|```/g, '').trim()
return JSON.parse(clean)
```

Always wrap this in a try/catch and return a sensible fallback. A broken JSON parse should not crash the page.

**Specify the context.** Vague prompts produce vague answers. Tell the model what it is, what it knows, and what format you want back. The existing prompts are good examples of this. Read them before writing your own.

**Keep prompts deterministic where possible.** The prediction functions ask for specific fields in a specific structure. This makes the output parseable. Open-ended generation (like the weekly report) can be more flexible because a human reads it.

**Indian context.** This application is built for Indian kitchens. Dal, roti, paneer, rupees. Prompts should reflect this rather than defaulting to generic Western food examples. The existing prompts already do this.

---

## Adding a new page

1. Create `src/pages/YourPage.jsx`
2. Add the route in `src/App.jsx`
3. Add the nav link in `src/components/layout/Sidebar.jsx`
4. Add the title and subtitle to the `meta` object in `src/components/layout/Topbar.jsx`

If your page fetches data from Supabase, write a hook in `src/hooks/`. If it calls Gemini, add the function to `src/lib/gemini.js`.

---

## What a good pull request looks like

**Small.** The smaller the PR, the faster it gets reviewed and merged. A PR that changes one thing is always easier to reason about than a PR that changes fifteen things. If you have fifteen changes, open fifteen PRs. Or at least five.

**Described.** Explain what changed and why. If there's a before and after that's worth showing, show it. Screenshots for UI changes are useful. "Fixed bug" is not a useful description.

**Tested locally.** Run `npm run build` before submitting. If it doesn't build, the PR won't be merged. Netlify will tell you too, but save everyone the round trip.

**Consistent with the existing code.** Match the style of whatever file you're editing. If the file uses inline styles, use inline styles. If it uses a particular naming convention, follow it. Consistency matters more than any individual preference.

---

## What we are not looking for

**Dependency additions without justification.** The project has a small dependency footprint on purpose. If you want to add a library, explain why the existing tools can't solve the problem. "I prefer this library" is not sufficient.

**Rewrites of working code.** Refactoring for its own sake is not a contribution. If something works and is readable, leave it alone unless you're fixing an actual problem.

**Breaking the free tier constraint.** This application is deliberately built to cost nothing to run. Any contribution that requires a paid service, a backend server, or infrastructure that doesn't fit within the free tiers of Netlify, Supabase, and Google AI is out of scope.

**UI overhauls without discussion.** The design system was built carefully. Changes to the global theme, layout, or component patterns need a conversation first.

---

## Reporting bugs

Open a GitHub issue. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce it
- Your browser and OS if it seems like it might matter

"It doesn't work" is not a bug report. "I clicked Generate Predictions, the loading spinner appeared, then disappeared with no predictions shown and no error visible" is a bug report.

---

## Questions

If something in the codebase confuses you, open an issue and ask. The architecture document in the README explains the high-level decisions. If the code itself is unclear, that might be a documentation problem worth fixing — which is itself a valid contribution.

---

## Code of conduct

Be decent. Assume good faith. If someone is wrong, explain why they're wrong rather than implying they should have known better. This is a project about reducing food waste, not a venue for demonstrating technical superiority.

That's it. That's the whole code of conduct.