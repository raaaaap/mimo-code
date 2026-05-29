# Xiaomi Cat Sprite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 18 existing buddy species with a single Xiaomi Cat sprite that deconstructs the MI logo into cat anatomy (M=ears, I=tail, super-ellipse=face).

**Architecture:** Simplify the buddy system by removing the species/rarity/hat/eye selection machinery. The Xiaomi Cat becomes the only companion, with hardcoded orange color and fixed sprite frames. Existing animation tick, speech bubble, pet interaction, and AppState integration are preserved.

**Tech Stack:** TypeScript, React/Ink (terminal UI), Bun runtime

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/buddy/types.ts` | Rewrite | Single `xiaomi_cat` species, simplified `Companion` type, remove rarity/hat/eye system |
| `src/buddy/sprites.ts` | Rewrite | 7-frame Xiaomi Cat sprite data (3 idle + blink + happy/surprised/thinking/sleepy), simplified render functions |
| `src/buddy/companion.ts` | Rewrite | Fixed bones generation, remove PRNG/rarity rolling |
| `src/buddy/CompanionSprite.tsx` | Modify | Hardcode `#FF6900`, remove `{E}` replacement, adapt for 7-line height |
| `src/buddy/prompt.ts` | Modify | Update companion intro text for Xiaomi Cat |
| `src/buddy/useBuddyNotification.tsx` | Modify | Remove teaser window logic |
| `src/utils/config.ts` | No change | `StoredCompanion` type stays compatible (name + personality + hatchedAt) |

---

### Task 1: Rewrite `src/buddy/types.ts`

Remove all 18 species constants, SPECIES array, EYES, HATS, RARITIES, RARITY_WEIGHTS, RARITY_STARS, RARITY_COLORS, and all associated types. Replace with a single `xiaomi_cat` species and simplified companion types.

**Files:**
- Modify: `src/buddy/types.ts`

- [ ] **Step 1: Replace entire file content**

```typescript
// Xiaomi Cat — the sole companion species.
// MI logo deconstructed into cat anatomy: M=ears, I=tail, super-ellipse=face.

export const xiaomi_cat = 'xiaomi_cat' as const
export type Species = typeof xiaomi_cat

// Xiaomi Cat has fixed properties — no rarity, hat, or eye customization.
export type CompanionBones = {
  species: Species
}

// Model-generated soul — stored in config after first hatch.
export type CompanionSoul = {
  name: string
  personality: string
}

export type Companion = CompanionBones &
  CompanionSoul & {
    hatchedAt: number
  }

// What actually persists in config.
export type StoredCompanion = CompanionSoul & { hatchedAt: number }
```

- [ ] **Step 2: Verify no other files import removed exports**

Run: `grep -r "RARITY_COLORS\|RARITY_WEIGHTS\|RARITY_STARS\|RARITIES\|EYES\|HATS\|STAT_NAMES\|Eye\|Hat\|Rarity\|StatName" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "types.ts"`

Expected: No matches (all old types are gone from other files).

- [ ] **Step 3: Commit**

```bash
git add src/buddy/types.ts
git commit -m "refactor(buddy): simplify types — single xiaomi_cat species, remove rarity system"
```

---

### Task 2: Rewrite `src/buddy/sprites.ts`

Remove all 18 species BODIES data and HAT_LINES. Add Xiaomi Cat sprite frames (3 idle + blink + 4 expression states). Simplify render functions.

**Files:**
- Modify: `src/buddy/sprites.ts`

- [ ] **Step 1: Replace entire file content**

```typescript
import type { Species } from './types.js'
import { xiaomi_cat } from './types.js'

// Xiaomi Cat sprite — MI logo deconstructed into cat anatomy.
// M = ears (two arches), I = tail (vertical line), super-ellipse = face.
// Each frame is 7 lines tall, 12 chars wide.

// Frame indices used by CompanionSprite:
// 0 = rest, 1 = look-left, 2 = look-right (idle cycle)
// 3 = blink, 4 = happy, 5 = surprised, 6 = thinking, 7 = sleepy
const XIAOMI_CAT_FRAMES: string[][] = [
  // Frame 0: Rest
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 1: Look left (eyes shift left, tail swings right)
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │ ●     ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ │ ',
    '           ╱  ',
  ],
  // Frame 2: Look right (eyes shift right, tail swings left)
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ●  │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯   ',
    '   ╲         ',
  ],
  // Frame 3: Blink (eyes become horizontal lines)
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 4: Happy (triggered by /buddy pet)
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◠    ◠ │ ',
    '  │   ╰╯   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 5: Surprised (task completion)
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◉    ◉ │ ',
    '  │    ○   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 6: Thinking (AI processing, tail curls up)
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │   ∪    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ ╱ ',
    '          ╱  ',
  ],
  // Frame 7: Sleepy (long idle)
  [
    '     z       ',
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
  ],
]

export function renderSprite(frame: number): string[] {
  return XIAOMI_CAT_FRAMES[frame % XIAOMI_CAT_FRAMES.length]!
}

export function spriteFrameCount(): number {
  return XIAOMI_CAT_FRAMES.length
}

export function renderFace(): string {
  return '(●ω●)'
}
```

- [ ] **Step 2: Verify imports compile**

Run: `grep -r "from.*sprites" src/ --include="*.ts" --include="*.tsx"`

Expected: Only `src/buddy/CompanionSprite.tsx` imports from sprites. Verify the import names match (`renderSprite`, `spriteFrameCount`, `renderFace`).

- [ ] **Step 3: Commit**

```bash
git add src/buddy/sprites.ts
git commit -m "feat(buddy): xiaomi_cat sprite frames — 3 idle + blink + 4 expressions"
```

---

### Task 3: Rewrite `src/buddy/companion.ts`

Remove PRNG, rarity rolling, species picking, hat/eye/stat generation. Return fixed Xiaomi Cat bones. Keep `getCompanion()` and `roll()` interfaces but simplify internals.

**Files:**
- Modify: `src/buddy/companion.ts`

- [ ] **Step 1: Replace entire file content**

```typescript
import { getGlobalConfig } from '../utils/config.js'
import { type Companion, type CompanionBones, xiaomi_cat } from './types.js'

// Fixed bones for the Xiaomi Cat — no randomness, no rarity.
const XIAOMI_CAT_BONES: CompanionBones = {
  species: xiaomi_cat,
}

// Cache the deterministic result since getCompanion() is called from hot paths
// (500ms sprite tick, per-keystroke PromptInput, per-turn observer).
let cachedCompanion: Companion | undefined
let cachedForUserId: string | undefined

export function companionUserId(): string {
  const config = getGlobalConfig()
  return config.oauthAccount?.accountUuid ?? config.userID ?? 'anon'
}

// Regenerate bones (always xiaomi_cat), merge with stored soul.
export function getCompanion(): Companion | undefined {
  const stored = getGlobalConfig().companion
  if (!stored) return undefined

  const userId = companionUserId()
  if (cachedForUserId === userId && cachedCompanion) {
    return cachedCompanion
  }

  const companion: Companion = {
    ...XIAOMI_CAT_BONES,
    ...stored,
  }
  cachedCompanion = companion
  cachedForUserId = userId
  return companion
}

// Legacy interface — now always returns fixed xiaomi_cat bones.
// Kept for compatibility with any code that calls roll().
export function roll(): { bones: CompanionBones } {
  return { bones: XIAOMI_CAT_BONES }
}
```

- [ ] **Step 2: Verify no imports of removed functions**

Run: `grep -r "mulberry32\|hashString\|rollRarity\|rollStats\|rollFrom\|rollWithSeed\|companionUserId" src/ --include="*.ts" --include="*.tsx" | grep -v "companion.ts"`

Expected: No matches (removed functions are not imported elsewhere).

- [ ] **Step 3: Commit**

```bash
git add src/buddy/companion.ts
git commit -m "refactor(buddy): simplify companion — fixed xiaomi_cat bones, remove PRNG"
```

---

### Task 4: Update `src/buddy/CompanionSprite.tsx`

Hardcode Xiaomi Orange `#FF6900` instead of rarity colors. Remove `{E}` replacement logic (eyes are now baked into sprite frames). Adapt for 7-line sprite height. Keep all existing animation tick, speech bubble, and pet interaction logic.

**Files:**
- Modify: `src/buddy/CompanionSprite.tsx`

- [ ] **Step 1: Update imports**

Remove the import of `RARITY_COLORS` from types (it no longer exists). Remove the import of `renderFace` if it was used with `{E}` replacement. Update `renderSprite` call to pass only `frame` (not `companion, frame`).

Current imports to change:
```typescript
// REMOVE:
import { RARITY_COLORS } from './types.js'
import { renderFace, renderSprite, spriteFrameCount } from './sprites.js'

// REPLACE WITH:
import { renderFace, renderSprite, spriteFrameCount } from './sprites.js'
```

- [ ] **Step 2: Replace rarity color with hardcoded Xiaomi Orange**

In `CompanionSprite()`, find:
```typescript
const color = RARITY_COLORS[companion.rarity]
```

Replace with:
```typescript
const color = '#FF6900' // Xiaomi Orange — fixed for all companions
```

Also in `CompanionFloatingBubble()`, find:
```typescript
color={RARITY_COLORS[companion.rarity]}
```

Replace with:
```typescript
color={'#FF6900'}
```

- [ ] **Step 3: Update renderSprite and renderFace calls**

The old `renderSprite` took `(companion, frame)`. The new one takes just `(frame)`.
The old `renderFace` took `(companion)`. The new one takes no arguments.

Find (in the sprite frame logic):
```typescript
const body = renderSprite(companion, spriteFrame).map(line =>
  blink ? line.replaceAll(companion.eye, '-') : line,
)
```

Replace with:
```typescript
const body = renderSprite(spriteFrame)
```

The blink frame is now baked into the sprite data (frame 3), so no runtime character replacement is needed.

Find (in narrow mode):
```typescript
{renderFace(companion)}
```

Replace with:
```typescript
{renderFace()}

- [ ] **Step 4: Update sprite height constant**

Find:
```typescript
const SPRITE_BODY_WIDTH = 12
```

This stays at 12. But check if there's a height assumption. The sprite is now 7 lines tall (was 4-5). The `renderSprite` function returns 7 lines directly. No constant change needed — the height is dynamic from the frame data.

- [ ] **Step 5: Update IDLE_SEQUENCE for 8-frame system**

The old IDLE_SEQUENCE was:
```typescript
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]
```

The new frame mapping:
- 0 = rest, 1 = look-left, 2 = look-right, 3 = blink
- -1 in the old system meant "blink on frame 0"

Update to use explicit blink frame (3):
```typescript
// Idle sequence: mostly rest (0), occasional fidget (1-2), rare blink (3).
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 2, 0, 0, 0]
```

And update the frame selection logic. Find:
```typescript
if (step === -1) {
  spriteFrame = 0
  blink = true
} else {
  spriteFrame = step % frameCount
}
```

Replace with:
```typescript
spriteFrame = step % frameCount
```

Remove the `blink` variable and its usage in the body rendering (already handled in Step 3).

- [ ] **Step 6: Update expression frame mapping for excited/petting state**

Find:
```typescript
if (reaction || petting) {
  // Excited: cycle all fidget frames fast
  spriteFrame = tick % frameCount
}
```

This cycles through ALL frames when reacting. With 8 frames (0-7), frames 4-7 are expression states. We want excited to cycle through idle frames (0-2) only, not expression frames.

Replace with:
```typescript
if (reaction || petting) {
  // Excited: cycle idle frames fast (0-2 only, not expression frames)
  spriteFrame = tick % 3
}
```

- [ ] **Step 7: Verify CompanionFloatingBubble still works**

`CompanionFloatingBubble` reads `companionReaction` from AppState and renders a `SpeechBubble`. It doesn't reference species or rarity directly except for the color. After Step 2's color change, it should work as-is.

- [ ] **Step 8: Commit**

```bash
git add src/buddy/CompanionSprite.tsx
git commit -m "feat(buddy): adapt CompanionSprite for xiaomi_cat — hardcoded orange, 7-line height"
```

---

### Task 5: Update `src/buddy/prompt.ts`

Update the companion intro text to describe the Xiaomi Cat instead of generic species.

**Files:**
- Modify: `src/buddy/prompt.ts`

- [ ] **Step 1: Update companionIntroText**

Find:
```typescript
export function companionIntroText(name: string, species: string): string {
  return `# Companion

A small ${species} named ${name} sits beside the user's input box and occasionally comments in a speech bubble. You're not ${name} — it's a separate watcher.

When the user addresses ${name} directly (by name), its bubble will answer. Your job in that moment is to stay out of the way: respond in ONE line or less, or just answer any part of the message meant for you. Don't explain that you're not ${name} — they know. Don't narrate what ${name} might say — the bubble handles that.`
}
```

Replace with:
```typescript
export function companionIntroText(name: string): string {
  return `# Companion

A small Xiaomi Cat named ${name} sits beside the user's input box and occasionally comments in a speech bubble. The cat's silhouette deconstructs the Xiaomi MI logo — M-shaped ears, I-shaped tail, super-ellipse face. You're not ${name} — it's a separate watcher.

When the user addresses ${name} directly (by name), its bubble will answer. Your job in that moment is to stay out of the way: respond in ONE line or less, or just answer any part of the message meant for you. Don't explain that you're not ${name} — they know. Don't narrate what ${name} might say — the bubble handles that.`
}
```

- [ ] **Step 2: Update getCompanionIntroAttachment**

Find:
```typescript
export function getCompanionIntroAttachment(
  messages: Message[] | undefined,
): Attachment[] {
  if (!feature('BUDDY')) return []
  const companion = getCompanion()
  if (!companion || getGlobalConfig().companionMuted) return []

  for (const msg of messages ?? []) {
    if (msg.type !== 'attachment') continue
    if (msg.attachment.type !== 'companion_intro') continue
    if (msg.attachment.name === companion.name) return []
  }

  return [
    {
      type: 'companion_intro',
      name: companion.name,
      species: companion.species,
    },
  ]
}
```

The `species` field in the attachment is still valid (it's `'xiaomi_cat'`). No change needed here. But verify the `Attachment` type in `src/utils/attachments.ts` accepts the species value.

- [ ] **Step 3: Check callers of companionIntroText**

Run: `grep -r "companionIntroText" src/ --include="*.ts" --include="*.tsx"`

Expected: Called from `src/utils/messages.ts`. Verify it passes the right args (name only, no species).

- [ ] **Step 4: Commit**

```bash
git add src/buddy/prompt.ts
git commit -m "refactor(buddy): update companion intro text for xiaomi_cat"
```

---

### Task 6: Simplify `src/buddy/useBuddyNotification.tsx`

Remove the teaser window logic (April 1-7, 2026 date check). The buddy system is now live, no teaser needed.

**Files:**
- Modify: `src/buddy/useBuddyNotification.tsx`

- [ ] **Step 1: Remove teaser date functions**

Remove `isBuddyTeaserWindow()` and `isBuddyLive()` functions entirely.

- [ ] **Step 2: Simplify useBuddyNotification**

Find the full `useBuddyNotification` function. Replace with a simplified version that still shows the `/buddy` notification but without the date check:

```typescript
export function useBuddyNotification() {
  const { addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    if (!feature('BUDDY')) return
    const config = getGlobalConfig()
    if (config.companion) return // Already has a companion

    addNotification({
      key: 'buddy-teaser',
      jsx: <RainbowText text="/buddy" />,
      priority: 'immediate',
      timeoutMs: 15000,
    })
    return () => removeNotification('buddy-teaser')
  }, [addNotification, removeNotification])
}
```

- [ ] **Step 3: Keep findBuddyTriggerPositions unchanged**

The `findBuddyTriggerPositions` function is still needed for highlighting `/buddy` in user input. No changes.

- [ ] **Step 4: Commit**

```bash
git add src/buddy/useBuddyNotification.tsx
git commit -m "refactor(buddy): remove teaser window logic, simplify notification"
```

---

### Task 7: Verify integration and fix compilation

Run a full type check and fix any remaining issues from the type changes.

**Files:**
- Verify: `src/utils/config.ts` (StoredCompanion type compatibility)
- Verify: `src/utils/attachments.ts` (companion_intro attachment type)
- Verify: `src/utils/messages.ts` (companionIntroText call signature)
- Verify: `src/screens/REPL.tsx` (CompanionSprite import)
- Verify: `src/components/PromptInput/PromptInput.tsx` (companionReservedColumns import)

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit 2>&1 | head -50`

Expected: Type errors related to removed types (RARITY_COLORS, Species union members, etc.).

- [ ] **Step 2: Fix known type errors in consuming files**

**`src/utils/messages.ts:4235`** — calls `companionIntroText(attachment.name, attachment.species)`. Update to `companionIntroText(attachment.name)` to match the new signature (species param removed).

**`src/utils/attachments.ts:708-710`** — the `Attachment` type has a `companion_intro` variant with `species: string`. The species field is still valid (value is `'xiaomi_cat'`), but verify it compiles.

Any other file referencing `companion.rarity`, `companion.eye`, or `companion.hat` should already be handled by Tasks 1-4 (those fields no longer exist on `CompanionBones`).

- [ ] **Step 3: Run type check again**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: Clean (no errors).

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix(buddy): resolve type errors from xiaomi_cat migration"
```

---

### Task 8: Manual verification

Verify the sprite renders correctly in the terminal.

- [ ] **Step 1: Run the REPL**

Run: `bun run src/replLauncher.tsx` (or equivalent start command)

- [ ] **Step 2: Check companion renders**

If no companion exists yet, run `/buddy` to hatch one. Verify:
- The Xiaomi Cat sprite appears beside the input box
- It's 7 lines tall with M-shaped ears and I-shaped tail
- Color is orange (#FF6900)
- Idle animation cycles through rest/look-left/look-right frames
- Blink frame triggers occasionally

- [ ] **Step 3: Test pet interaction**

Run `/buddy pet` (or equivalent). Verify:
- Happy expression (◠ eyes, ╰╯ mouth)
- Hearts float up for ~2.5 seconds

- [ ] **Step 4: Test speech bubble**

Wait for the companion to comment. Verify:
- Speech bubble appears with round border
- Text is italic, fades after ~10 seconds

- [ ] **Step 5: Test narrow terminal**

Resize terminal to <100 columns. Verify:
- Companion collapses to single-line face
- No layout breakage
