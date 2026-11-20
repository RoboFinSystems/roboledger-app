/**
 * The mapping operator applies a match it scores at 0.90 or more outright and
 * writes one between 0.70 and 0.90 as flagged for review (the API's
 * `CONFIDENCE_AUTO_APPROVE`). A mapping made by hand carries 1.0 or no score.
 */
export const MAPPING_REVIEW_BELOW = 0.9

/** Whether a mapping is one the auto-map flagged for a person to check. */
export const needsMappingReview = (
  confidence: number | null | undefined
): confidence is number =>
  confidence != null && confidence < MAPPING_REVIEW_BELOW
