import { useMemo } from "react";

const MM_TO_PX = 3.78;
const A4_HEIGHT_PX = 297 * MM_TO_PX;
// Allow scaling down to 90% at most, to preserve readability.
const MIN_SCALE = 0.9;

interface UseAutoOnePageOptions {
  contentHeight: number;
  pagePadding: number;
  enabled: boolean;
}

interface UseAutoOnePageResult {
  scaleFactor: number;
  isScaled: boolean;
  /** Content is too long; cannot fit on one page even at minimum scale. */
  cannotFit: boolean;
}

export function useAutoOnePage({
  contentHeight,
  pagePadding,
  enabled,
}: UseAutoOnePageOptions): UseAutoOnePageResult {
  return useMemo(() => {
    if (!enabled || contentHeight <= 0) {
      return { scaleFactor: 1, isScaled: false, cannotFit: false };
    }

    // Available A4 content height = total A4 height - top/bottom margins
    const availableHeight = A4_HEIGHT_PX - 2 * pagePadding;

    // Actual content height (excluding #resume-preview padding)
    const actualContentHeight = contentHeight - 2 * pagePadding;

    if (actualContentHeight <= availableHeight) {
      // Content fits within one page; no scaling needed
      return { scaleFactor: 1, isScaled: false, cannotFit: false };
    }

    const idealScale = availableHeight / actualContentHeight;

    if (idealScale >= MIN_SCALE) {
      // Within acceptable range; scale directly
      return { scaleFactor: idealScale, isScaled: true, cannotFit: false };
    }

    // Beyond acceptable scale range; still apply minimum scale and flag cannotFit
    return { scaleFactor: MIN_SCALE, isScaled: true, cannotFit: true };
  }, [contentHeight, pagePadding, enabled]);
}
