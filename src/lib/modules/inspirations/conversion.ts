import type { InspirationAISuggestion } from "@/lib/services/inspirations/inspirationTypes";

export const INSPIRATION_CONVERSION_CONFIRM_FIELD = "conversionConfirmed";
export const INSPIRATION_CONVERSION_CONFIRM_VALUE = "yes";
export const INSPIRATION_CONVERSION_CONFIRM_NOTE = "来自 AI 草稿预填，请人工确认。";

export function buildInspirationConversionDefaults(input: {
  title: string | null;
  note: string | null;
  aiSuggestion: InspirationAISuggestion | null;
}) {
  const aiSuggestion = input.aiSuggestion;
  const targetAudience = aiSuggestion?.targetAudience ?? [];
  const sellingPoints = aiSuggestion?.sellingPoints ?? [];
  const useScenarios = aiSuggestion?.useScenarios ?? [];
  const styleKeywords = aiSuggestion?.styleKeywords ?? [];
  const colors = aiSuggestion?.colors ?? [];
  const riskNotes = aiSuggestion?.riskNotes ?? [];
  const uncertaintyNotes = aiSuggestion?.uncertaintyNotes ?? [];

  return {
    name: input.title?.trim() || aiSuggestion?.titleSuggestion || "",
    categoryLevel1: aiSuggestion?.possibleCategory || aiSuggestion?.possibleProductType || "",
    targetUser: targetAudience.join("；"),
    sellingPointsText: sellingPoints.join("\n"),
    usageScenesText: useScenarios.join("\n"),
    tagsText: [...styleKeywords, ...colors].join("\n"),
    notes:
      input.note?.trim() ||
      [
        aiSuggestion?.draftLabel,
        aiSuggestion?.shortDescription,
        riskNotes.join("；"),
        uncertaintyNotes.join("；"),
      ]
        .filter(Boolean)
        .join("\n"),
  };
}
