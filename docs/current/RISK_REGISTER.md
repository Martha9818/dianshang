# EcomPilot Risk Register

Keep only risks that remain valid after V1.5 completion and before later versions begin.

| Risk | Status | Level | Mitigation |
| --- | --- | --- | --- |
| Scope drift beyond the approved V1.6 baseline | OPEN | High | Use the V1.6 direction-sync report and V1.6-00 scope checklist as the execution baseline; require explicit thread approval before new behavior. |
| Vercel preview mistaken for a writable acceptance environment | OPEN | High | Keep preview read-only; all real write acceptance stays on Windows local runtime. |
| Historical Vercel recovery codes require provider-side rotation or revocation | ACTION_REQUIRED | High | Keep the repository clean of plaintext secrets and complete the provider-side rotation/revocation outside the repo. |
| AI features depend on valid provider credentials, quota, network reachability, and provider policy | OPEN | Medium | Keep manual flows available and keep AI failures isolated from non-AI workflows. |
| Inspiration source folders can grow until full rescans and re-hashing become noticeably slower | OPEN | Medium | Keep this as a future source-governance topic; do not solve it with unsafe auto-delete. |
| Link import can still be misunderstood as a platform parser until UI demotion is complete | OPEN | Medium | Keep the feature downgraded in copy and navigation, and require screenshot or manual text as the stable intake path. |
| Existing API image generation can still be mistaken for a V1.6 mainline feature | OPEN | Medium | Keep it framed as a legacy/manual V1.5 capability and exclude it from V1.6 expansion scope. |
| Image dedupe or assistant behavior could be misunderstood as cleanup execution | OPEN | Medium | Keep both features advisory-only; deletion or trash movement must continue through the existing file-maintenance page. |
| Electron POC could be mistaken for a formal desktop runtime | OPEN | High | Keep Electron isolated under `experiments/electron-poc/`; V2 must define data root, CSP, preload contract, lifecycle, and release strategy before any formal desktop work. |
| Manual backup exists without in-app restore | DEFERRED | High | Keep restore labeled future work and do not imply full disaster recovery. |
