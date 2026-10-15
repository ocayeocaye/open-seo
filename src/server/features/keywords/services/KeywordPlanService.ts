import { KeywordPlanRepository } from "../repositories/KeywordPlanRepository";
import type {
  KeywordPlanListInput,
  KeywordPlanRow,
} from "@/types/schemas/keyword-plan";

export const KeywordPlanService = {
  importRows(projectId: string, rows: KeywordPlanRow[]) {
    return KeywordPlanRepository.upsert(projectId, rows);
  },
  list(projectId: string, input: KeywordPlanListInput) {
    return KeywordPlanRepository.list(projectId, input);
  },
  summary(projectId: string) {
    return KeywordPlanRepository.summary(projectId);
  },
};
