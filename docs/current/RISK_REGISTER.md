# EcomPilot Risk Register

Keep only risks that remain valid after V1.5 completion and before V2 begins.

| Risk | Status | Level | Mitigation |
| --- | --- | --- | --- |
| Scope drift beyond the frozen V1.5 baseline | OPEN | High | Any new behavior requires an explicitly approved new thread; do not extend V1.5 closeout into V2 implementation. |
| Vercel preview mistaken for a writable acceptance environment | OPEN | High | Keep preview read-only; all real write acceptance stays on Windows local runtime. |
| Historical Vercel recovery codes require provider-side rotation or revocation | ACTION_REQUIRED | High | Keep the repository clean of plaintext secrets and complete the provider-side rotation/revocation outside the repo. |
| AI features depend on valid provider credentials, quota, network reachability, and provider policy | OPEN | Medium | Keep manual flows available and keep AI failures isolated from non-AI workflows. |
| API image generation can still surprise users on cost or provider-side safety rejection | OPEN | High | Keep the feature disabled by default, require manual trigger, show cost hints, and keep high-cost confirmation. |
| Image dedupe or assistant behavior could be misunderstood as cleanup execution | OPEN | Medium | Keep both features advisory-only; deletion or trash movement must continue through the existing file-maintenance page. |
| Electron POC could be mistaken for a formal desktop runtime | OPEN | High | Keep Electron isolated under `experiments/electron-poc/`; V2 must define data root, CSP, preload contract, lifecycle, and release strategy before any formal desktop work. |
| Manual backup exists without in-app restore | DEFERRED | High | Keep restore labeled future work and do not imply full disaster recovery. |
