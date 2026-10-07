# MeasureMarks V0.4
Measure. Mark. Build.

## Major changes
- 11 working tool pages
- New tools: Fence Posts, Cabinet Hardware, Recessed Lights, Wainscoting
- Feet + inches span entry for large Imperial projects
- Responsive reserved AdSense placements
- Ads excluded from Field Mode and printed plans
- Mobile sticky Field Mode / Print actions
- PWA manifest, service worker, app icons
- Shared framework-free calculation and drawing modules remain reusable for a future mobile app

## Current tools
1. Equal Spacing
2. Fence Pickets
3. Fence Posts
4. Balusters
5. Board & Batten
6. Wainscoting
7. Wall Slats
8. Tile Layout
9. Picture Hanging
10. Cabinet Hardware
11. Recessed Lights

## Ad strategy placeholders
- Top responsive leaderboard
- One in-content rectangle after results
- One wide home-page unit
These are placeholders only; no AdSense code or publisher ID is included.

## Mobile/app direction
The math/formatting code is kept separate from DOM/page code so it can be reused in a future mobile app. V0.4 also includes an installable PWA foundation.

## Local testing
Because JavaScript modules and the service worker expect HTTP:
    python -m http.server 8000
Then open:
    http://localhost:8000

## Cloudflare
Static deployment; no build command required.


Dev deployment trigger: V0.5-dev.1
