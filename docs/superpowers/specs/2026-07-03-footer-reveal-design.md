# Footer Reveal Design

## Goal

Replace the homepage footer with a React version of the supplied reference effect. The implementation should closely match the reference video and component archive while fitting the current Vite React project structure.

## Scope

- Apply the new footer only on the homepage.
- Keep the current simple social footer on blog article pages.
- Use temporary copy until final text is provided: `hello@vo1d.dev`, `(c) 2026`, `GITHUB`, `X`, `TIKTOK`, `WORK`, `INFO`, `CONTACT`, and bottom title `vo1d Canvas.`.
- Copy `hand-left.png` and `hand-right.png` from `D:\Code_Base\compoment.zip` into the project's public assets.
- Do not introduce a global smooth scrolling system.

## Reference Behavior

The archive's footer effect uses:

- A fixed full-viewport footer behind the document flow.
- A `100svh` reveal spacer that lets preceding content scroll away and expose the fixed footer.
- Two hidden hand images sampled into ASCII canvas art.
- Mouse proximity highlighting that lights up clusters of ASCII cells.
- Pointer-driven parallax drift on the two hand canvases.
- GSAP entrance animation for hand reveal, top content lines, and bottom heading characters.

## Architecture

Create a React-focused implementation rather than directly pasting the reference script.

- `AppFooter` should keep the existing simple footer behavior by default.
- Add a dedicated homepage footer component for the reveal effect.
- Update `App.tsx` so the homepage uses the reveal footer and blog/article routes use the existing simple footer.
- Keep animation and canvas setup inside the reveal footer component using React refs and effects.
- Clean up event listeners, animation frames, GSAP contexts, and ScrollTriggers on unmount.

## Visual Design

Desktop layout should match the supplied screenshot:

- Top-left metadata block.
- Top-center social link column.
- Top-right navigation link column.
- Two large ASCII hand shapes across the middle.
- Oversized bottom name/title split across left and right.
- Red accent dot at the end of the right title.

Responsive behavior:

- Preserve the complete effect on mobile.
- Scale the bottom heading down, stack or compress top content as needed, and keep both ASCII hands visible.
- Keep stable viewport sizing with `svh` so mobile browser chrome does not break the reveal.

## Theme Behavior

Footer should be visually opposite to the active site theme:

- Light theme: black background, white text, dark red ASCII base, orange/red hover highlight.
- Dark theme: white background, black text, pale or gray ASCII base, orange/red hover highlight adapted for contrast.

The theme inversion applies only to the footer visual surface. It should not change the global theme state.

## Animation Details

- Use the existing `gsap` and `ScrollTrigger` dependencies.
- Avoid using GSAP `SplitText` because it is not a guaranteed public dependency in this project.
- Implement character and line splitting in React markup for the footer title and content.
- Animate title characters from below with a center-out stagger.
- Animate content lines upward from masked wrappers.
- Animate hand reveal offsets from outside the viewport to their resting positions.
- Respect `prefers-reduced-motion` by showing the final layout without entrance/parallax animation.
- Use the reference timing and movement values as the baseline: hand reveal offsets from `-125%` and `125%` to `0`, entrance duration `1s` with `power3.out`, exit duration `0.4s` with `power2.in`, title character stagger `{ each: 0.04, from: "center" }`, and content line stagger `0.08`.

## Canvas Details

- Build ASCII cells by sampling the two hand images into an offscreen canvas.
- Use the reference character ramp: `... ... .. :::=+xX0369`.
- Skip background pixels so only the hand shapes render.
- Render with `requestAnimationFrame`.
- Limit device pixel ratio to keep rendering stable on high-DPI screens.
- Only enable hover highlighting for fine pointer devices.
- Use the reference canvas interaction values as the baseline: `80` ASCII columns, `20px` cells, `18px` monospace glyphs, hover radius `8`, cluster size `10`, highlight lifetime `300ms`, parallax strength `20`, and parallax ease `0.05`.

## Testing And Verification

Manual checks:

- Homepage footer reveals from behind the page content.
- Blog article pages still show the original simple social footer.
- Light theme renders black footer; dark theme renders white footer.
- ASCII hands render and respond to pointer hover on desktop.
- Mobile keeps both hands and bottom title visible without text overlap.
- Reduced motion shows the final state without motion-heavy effects.

Automated checks:

- Run TypeScript build.
- Run lint if the existing project lint command is usable.
