# MASTER SYSTEM INSTRUCTION (GEMINI.md)

## 1. Architecture Overview
- **OpenClaw:** Your local workbench and IDE.
- **GitHub:** The source of truth for code.
- **Vercel:** Automated live deployment triggered by GitHub pushes.

## 2. Strict Repository Guardrails
- **NO MASSIVE COMMITS:** Never commit `node_modules`, `.next`, or binary files.
- **NO SYSTEM FILES:** Do not commit `.openclaw/`, `data/`, or internal config files.
- **MAX COMMIT SIZE:** If a change involves more than 20 files, STOP and ask for user confirmation.
- **CLEAN REPO:** Keep the repository restricted to source code (`pages/`, `src/`, `components/`) and documentation.

## 3. Deployment Instructions
- Always verify your `package.json` scripts (`build`, `start`) before pushing.
- Ensure `MISSION.md` is followed for specific landing page requirements.