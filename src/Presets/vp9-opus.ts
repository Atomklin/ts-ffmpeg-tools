import { join, parse } from "node:path";
import prompts from "prompts";

import { runFFmpegWithArgs } from "../Common/ffmpeg";
import { validatePathInput } from "../Common/filesystem";

export async function run() {
  const { file } = await prompts({
    validate: (i) => validatePathInput(i),
    message: "Input file path",
    name: "file",
    type: "text"
  });

  if (!file) throw Error("Invalid File Input");
  return compressVideo(file);
}


/**
 *  The highest compression with good quality
 *  Following this guide : https://www.draketo.de/software/ffmpeg-compression-vp9-av1.html
*/
export async function compressVideo(input: string) {
  const { dir, name } = parse(input);
  const output = join(dir, name + ".compressed.webm");
  const defaultArgs = [
    "-i",               input,
    "-passlogfile",     join(__dirname, "..", "..", "logs", "pass2log"),
    "-vcodec",          "libvpx-vp9",
    "-b:v",             "0",
    "-crf",             "42",
    "-aq-mode",         "2",
    "-frame-parallel",  "0",
    "-auto-alt-ref",    "1",
    "-lag-in-frames",   "25",
    "-g",               "999",
    "-threads",         "12"
  ];

  // First Run
  await runFFmpegWithArgs([
    ...defaultArgs,
    "-an",    // Remove Audio
    "-tile-columns", "0",
    "-tile-rows",    "0",
    "-cpu-used",     "8",
    "-pass",         "1",
    "-f",            "webm",
    "-y",            "NUL"
  ]);

  // Second Run
  await runFFmpegWithArgs([
    ...defaultArgs,
    "-acodec",       "libopus",
    "-b:a",          "16k",
    "-tile-columns", "2",
    "-tile-rows",    "2",
    "-cpu-used",     "-5",
    "-pass",         "2",
    output
  ]);

  return output;
}