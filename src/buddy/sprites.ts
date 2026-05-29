// Xiaomi Cat sprite — MI logo deconstructed into cat anatomy.
// M = ears (two arches), I = tail (vertical line), super-ellipse = face.
// Each frame is 7 lines tall, ~12 chars wide.

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
  // Frame 1: Look left
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │ ●     ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ │ ',
    '           ╱  ',
  ],
  // Frame 2: Look right
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ●  │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯   ',
    '   ╲         ',
  ],
  // Frame 3: Blink
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 4: Happy
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◠    ◠ │ ',
    '  │   ╰╯   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 5: Surprised
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◉    ◉ │ ',
    '  │    ○   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 6: Thinking
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │   ∪    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ ╱ ',
    '          ╱  ',
  ],
  // Frame 7: Sleepy
  [
    '     z       ',
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
  ],
];

export function renderSprite(frame: number): string[] {
  return XIAOMI_CAT_FRAMES[frame % XIAOMI_CAT_FRAMES.length]!;
}

export function spriteFrameCount(): number {
  return XIAOMI_CAT_FRAMES.length;
}

export function renderFace(): string {
  return '(●ω●)';
}
