// Writes one line a day into the README, in the Cheshire cat's voice.
// Run by .github/workflows/oracle.yml. Needs ANTHROPIC_API_KEY.
//
// Fails safe: any error leaves the README untouched and exits 0, so a bad
// morning at the API never shows up as a broken profile page.

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";

const README = "README.md";
const START = "<!-- ORACLE:START -->";
const END = "<!-- ORACLE:END -->";
const MAX = 120;

const SYSTEM = `You write one line a day for the Cheshire cat on a developer's GitHub profile.

The profile belongs to someone who builds with code and language models, and whose whole identity is Alice in Wonderland by way of a corrupted screen. The cat is amused, a little unnerving, and never earnest.

Rules:
- One sentence. Under 100 characters. No line breaks.
- No quotation marks, no emoji, no markdown, no hashtags.
- Never greet the reader, never sign off, never explain the joke.
- Do not mention Alice, the rabbit hole, or Wonderland by name. The setting is understood.
- Vary the shape. Not every line is an aphorism.

Reply with the line and nothing else.`;

const clean = (s) =>
  s.split("\n")[0]
    .replace(/[<>`|*_~[\]]/g, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, MAX)
    .trim();

try {
  const readme = fs.readFileSync(README, "utf8");
  const a = readme.indexOf(START), b = readme.indexOf(END);
  if (a === -1 || b === -1) throw new Error(`Markers not found in ${README}`);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: SYSTEM,
    messages: [{ role: "user", content: "Today's line." }],
  });

  if (response.stop_reason === "refusal") throw new Error("Model declined");

  const text = response.content.find((blk) => blk.type === "text")?.text ?? "";
  const line = clean(text);
  if (line.length < 10) throw new Error(`Line too short after cleaning: "${line}"`);

  const next = readme.slice(0, a + START.length) + "\n\n_" + line + "_\n\n" + readme.slice(b);
  if (next === readme) { console.log("No change."); process.exit(0); }
  fs.writeFileSync(README, next);
  console.log("Wrote:", line);
} catch (err) {
  if (err instanceof Anthropic.AuthenticationError) console.error("ANTHROPIC_API_KEY is missing or invalid.");
  else if (err instanceof Anthropic.RateLimitError) console.error("Rate limited; leaving the README alone today.");
  else if (err instanceof Anthropic.APIError) console.error(`API error ${err.status}: ${err.message}`);
  else console.error(String(err.message ?? err));
  process.exit(0);
}
