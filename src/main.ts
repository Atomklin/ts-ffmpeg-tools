import { readdirSync } from "node:fs";
import { join } from "node:path";
import prompts from "prompts";

void async function() {
  const dir = join(__dirname, "Presets");
  const choices = readdirSync(dir)
    .filter((filename) => filename.endsWith(".js"))
    .map((filename) => ({ title: filename, value: filename }));

  const { filename } = await prompts({
    message: "What preset to run?",
    name: "filename",
    type: "select",
    choices
  });

  if (!filename) throw Error("Invalid choice");
  const { run } = await import(join(dir, filename));
  await run();
}();