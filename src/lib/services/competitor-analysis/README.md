# Competitor Analysis Service

V1.5 Thread 04 owns AI-assisted competitor analysis snapshots.

- Inputs come only from local product records, manually entered competitors, confirmed screenshot drafts, and saved link-import drafts.
- The service never opens competitor links, never calls link import fetching, and never performs platform collection or crawling.
- Generated output is saved as `CompetitorAnalysisSnapshot` and labeled as AI-assisted reference advice.
- Regeneration creates a new snapshot; existing snapshots are not overwritten.
- Snapshots may be marked as a reference version or archived after user confirmation.
- The service does not update score snapshots, recommendation results, product status, competitor facts, exports, backups, files, or cleanup state.
- Preview/read-only runtime blocks generation, reference marking, and archive writes with `预览环境只读，请在 Windows 本地验收竞品智能分析。`
- AI calls reuse the existing provider, `AIJob`, `AIRequestLog`, prompt sanitizer, output validator, and banned-word scan.
