// The 4AM Commit entrypoint.
//
// One job: leave the night-shift commit note on disk at /output/entry.txt.
// The scorer only accepts UTF-8 text of 1..200 characters that is not
// whitespace alone, so the note is measured before it is written.

import { mkdir, readFile, writeFile } from "node:fs/promises";

const OUTPUT_DIR = "/output";
const OUTPUT_FILE = "/output/entry.txt";
const MAX_CHARS = 200;

// The 4AM note: three hourly "fixes" that only happened in the log,
// and a fourth hour that finally fixed the log itself.
const NIGHT_NOTE =
  "fix: the logs say I fixed this bug at 1AM, 2AM, and 3AM. At 4AM I fixed the log.";

// Count characters the way a reader counts them: one per code point.
function countCharacters(text: string): number {
  return [...text].length;
}

// True when the text has nothing in it but blank space.
function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

// A commit note is a single line: a newline or carriage return
// would split it into two, which the brief does not allow.
function spansLines(text: string): boolean {
  return /[\r\n]/.test(text);
}

// Control bytes have no business in a commit message; the only
// whitespace allowed here is the ordinary space between words.
function holdsControlBytes(text: string): boolean {
  return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text);
}

// Collect every reason the note would be turned away by the gate.
function gateProblems(text: string): string[] {
  const problems: string[] = [];
  if (text.length === 0) {
    problems.push("note is empty");
  }
  if (isBlank(text)) {
    problems.push("note is whitespace only");
  }
  const size = countCharacters(text);
  if (size > MAX_CHARS) {
    problems.push(`note is ${size} characters, over the ${MAX_CHARS} limit`);
  }
  if (spansLines(text)) {
    problems.push("note spans more than one line");
  }
  if (holdsControlBytes(text)) {
    problems.push("note carries control characters");
  }
  return problems;
}

async function leaveTheNote(): Promise<void> {
  const problems = gateProblems(NIGHT_NOTE);
  if (problems.length > 0) {
    throw new Error(`refusing to write entry: ${problems.join("; ")}`);
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, NIGHT_NOTE, "utf8");
  // Read the file back: a silent short write must never pass as done.
  const onDisk = await readFile(OUTPUT_FILE, "utf8");
  if (onDisk !== NIGHT_NOTE) {
    throw new Error("entry on disk does not match the note that was written");
  }
}

await leaveTheNote();
