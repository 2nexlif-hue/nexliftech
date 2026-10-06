# NexLifTech Agent Guidelines

## Critical Operational Rules

1. **Automated Add, Build, and Local Commit (Never Push)**:
   - **Automated Workflow**: Whenever completing tasks or modifying code, automatically stage files (`git add`), verify correctness via `npm run build`, and create a descriptive local commit (`git commit`).
   - **NEVER execute `git push`**: Do NOT run `git push` under any circumstances. Pushing to remote is ALWAYS done manually by the user.

2. **File & System Integrity**:
   - Retain this file (`agent.md` / `AGENTS.md`) at all times.
   - Run `npx oxlint` and `npm run build` to verify code correctness before committing.

3. **Design & Engineering Standards**:
   - **Responsive First**: Every component must look stunning and function seamlessly across Mobile (320px–480px), Tablet (768px–1024px), and Desktop viewports.
   - **Theme Consistency**: Support all 3 themes (**Light Executive Default**, **Dark Aurora**, and **Cyber Neon**). Always use CSS design tokens (`var(--bg-*)`, `var(--text-*)`, `var(--border-*)`) rather than hardcoded background or text colors.
   - **Performance**: Retain zero-lag rendering, clean component breakdown, and accessibility touch targets (minimum 44px on mobile).

4. **Firebase Rules Auto-Deployment**:
   - **Automatically Upload Firebase Rules**: Whenever `firestore.rules` or Firebase security rules are modified or updated, automatically deploy them to Firebase using `firebase deploy --only firestore:rules` (or `npx -y firebase-tools deploy --only firestore:rules`).
   - Preserve open read access for student-facing collections (`botany_question_banks`, `botany_settings`, `botany_syllabus`, `botany_schedule`) so candidates and CBT engines never experience permission errors.

---

## Tech Stack & Commands

- **Framework**: React 19 + Vite 8
- **Styling**: Vanilla CSS with scoped design tokens in `src/index.css`
- **Routing**: `react-router-dom` v7
- **Animations**: `framer-motion`, `lottie-react`
- **Icons**: `lucide-react`
- **Backend & Database**: Firebase Firestore & Auth
- **Dev Server**: `npm run dev` or `npm start`
- **Build**: `npm run build`
- **Linter**: `npm run lint` (or `npx oxlint`)

---

## Production Custom Domain (`https://nexliftech.space`)

- **Primary Custom Domain**: `https://nexliftech.space`
- **Checklist When Going Live**:
  1. **Firebase Console > Authentication > Settings > Authorized Domains**:
     - Add `nexliftech.space` and `www.nexliftech.space` to the list of Authorized Domains so Google Sign-In and email authentication work without cross-origin domain errors.
  2. **SEO & Metadata**:
     - Canonical URLs, Open Graph `og:url`, and JSON-LD structured schema point to `https://nexliftech.space`.
     - `public/robots.txt` and `public/sitemap.xml` are generated and configured for `https://nexliftech.space`.
  3. **Payment Gateway (Razorpay)**:
     - Ensure `https://nexliftech.space` is whitelisted in Razorpay Dashboard for live API keys and webhook event delivery.

