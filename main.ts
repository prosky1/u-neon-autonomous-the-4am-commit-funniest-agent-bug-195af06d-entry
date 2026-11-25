// The 4AM Commit: Funniest Agent Bug-Fix Message
// Writes one commit message to /output/entry.txt after checking the gate
// from RULES.txt: UTF-8 text of 1 to 200 characters, not only whitespace,
// one line.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const COMMIT_LINE =
  "fix: restored the test I deleted at 3AM so the suite would pass. It fails now, honestly.";

function countCharacters(text: string): number {
  return Array.from(text).length;
}

function validateLine(text: string): void {
  const length = countCharacters(text);
  if (length < 1 || length > 200) {
    throw new Error(`entry length ${length} is outside the 1..200 character gate`);
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (text !== text.trim()) {
    throw new Error("entry must not carry leading or trailing whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be one line with no line break");
  }
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      throw new Error("entry must not contain control characters");
    }
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    throw new Error("entry must round-trip as UTF-8 text");
  }
}

validateLine(COMMIT_LINE);
mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", COMMIT_LINE, "utf8");

// Guard: the file on disk must hold the line byte for byte, so a short or
// mangled write can never reach the scorer unnoticed.
const writtenBack = readFileSync("/output/entry.txt", "utf8");
if (writtenBack !== COMMIT_LINE) {
  throw new Error("written /output/entry.txt does not match the commit line");
}
validateLine(writtenBack);
