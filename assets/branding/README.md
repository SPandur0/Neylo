# Neylo branding

- `neylo-splash.png`: unchanged copy of the supplied Neylo reference, including the N, wordmark and tagline. Keeping the text in the artwork preserves the reference typography and spacing.
- `neylo-symbol.png`: transparent N asset derived from the reference using the built-in imagegen tool; reused by `NeyloLogo` and the Android system splash.
- `neylo-icon.png`: opaque N-only app icon derived from the reference using the built-in imagegen tool; used for the launcher and browser favicon.

The splash background `#fefcfa` matches the average outer-edge color of the supplied image. The source has a subtly textured background.

## Startup behavior

`expo-splash-screen` holds the native launch screen until the React splash image is loaded and laid out. iOS uses the complete artwork; Android uses the N-only system splash to respect its system icon constraints, then hands off to the full artwork. After that handoff, the custom overlay stays fully visible for 1,300 ms, then fades out over 500 ms with a quadratic ease-in-out (1,800 ms total). If the bundled branding assets, Ionicons font or navigation need longer than the initial hold, the fade waits until they are ready. Native launch time precedes this custom transition. Failed asset loading is reported and does not intentionally block entry into the app.

The overlay lives at the app root and is removed after its first fade. Navigation and returning from the background do not remount it or reset its state; a new app instance (cold start or full reload) shows it again. The hold timer and animation are cleaned up on unmount.

Native icon and splash configuration requires a new native build. Verify cold launches in an iOS and Android release build; Expo Go does not reproduce the native splash configuration. Also check narrow browser windows and warm launches. See https://docs.expo.dev/versions/latest/sdk/splash-screen/.

## Imagegen prompts

Initial symbol extraction:

> Extract ONLY the existing folded ribbon N symbol from this Neylo logo into a standalone transparent PNG asset. Preserve the exact silhouette, proportions, curves, green gradients and colors of the N in the reference. Remove all lettering, wordmark, tagline and off-white background. Actual alpha transparency around the N. Center the N on a square canvas with a small uniform transparent margin of about 5%. Do not redesign or embellish. Save the resulting image so it can be used as a UI logo asset.

Final symbol cleanup:

> Clean up this transparent Neylo N symbol asset. Preserve exact N silhouette, proportions and green shading. Remove ALL stray pixels, white halos and white fringe along outside of N. Remove scattered fragments outside the symbol especially at bottom and top. Use crisp smooth antialiased edges and true alpha transparency. Tighten the square canvas to center the N with uniform 8% padding; the symbol should fill about 84% canvas width. No text. Production-quality icon asset.

App icon:

> Create a square 1024x1024 opaque app icon using ONLY the exact existing folded green N symbol from this reference. Preserve exact N silhouette and green gradients. Center the symbol occupying 62% of the square width with balanced equal margins, on a uniform solid #fdfcfb off-white background, full bleed square with NO rounded corners. Remove all wordmark and tagline. No new design elements, no shadows, no texture, no border. Clean smooth edges, no artifacts.
