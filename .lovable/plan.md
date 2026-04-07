

## Plan: Add spacing between checklist and CTA button in pricing cards

The checklist items are too close to the CTA button. The fix is simple: add `mb-4` (margin-bottom) to the checklist `div` containers in both Mandiri and Juragan cards, and also increase `mt-3` to `mt-4` on the checklist for more breathing room from the price text above.

### Changes in `src/pages/LandingPage.tsx`

**Mandiri card (line 406):** Change `<div className="space-y-2 mt-3">` to `<div className="space-y-2 mt-4 mb-6">`

**Juragan card (line 438):** Change `<div className="space-y-2 mt-3">` to `<div className="space-y-2 mt-4 mb-6">`

This adds `mb-6` (1.5rem) gap between the last checklist item and the CTA button, and slightly more top margin for the checklist section.

