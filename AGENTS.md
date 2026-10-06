# NexLifTech Agent Rules

Refer to [agent.md](file:///d:/Shk_Gulfam/Projects/nexliftech/agent.md) for full project guidelines.

## Assistant Behavioral Directives
- **Automatically add, build, and commit**: Always run `git add`, verify with `npm run build`, and run `git commit` locally whenever completing tasks or making changes.
- **NEVER push to remote**: Do NOT run `git push` under any circumstances. Pushing to remote is ALWAYS done manually by the user.
- **Keep `agent.md`**: Do not delete or rename `agent.md`.
- **Maintain design excellence**: Follow responsive design across mobile, tablet, and desktop viewports, with support for all 3 themes (Light, Dark, Cyber).
- **Auto-deploy Firebase rules**: Whenever `firestore.rules` are updated, upload/deploy them to Firebase automatically (`firebase deploy --only firestore:rules`).
