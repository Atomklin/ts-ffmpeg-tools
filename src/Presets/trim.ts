import { join, parse } from "node:path";
import prompts from "prompts";

import { probeVideo, runFFmpegWithArgs } from "../Common/ffmpeg";
import { validatePathInput } from "../Common/filesystem";
import { toSeconds } from "../Common/misc";

export async function run() {
  const { file, start, end } = await prompts([
    {
      validate: (i) => validatePathInput(i),
      message: "Input file path",
      name: "file",
      type: "text",
    },
    {
      message: "Input video start (HH:MM:SS / Seconds)",
      name: "start",
      type: "text",
    },
    {
      message: "Input video end (HH:MM:SS / Seconds)",
      name: "end",
      type: "text"
    }
  ]);

  if (!file) throw Error("Invalid File Input");
  const startSeconds = start ? toSeconds(start) : 0;
  const endSeconds = end ? toSeconds(end) : undefined;
  return trimVideo(file, startSeconds, endSeconds);
}


export async function trimVideo(input: string, start = 0, end?: number) {
  const { dir, name, ext } = parse(input);
  const output = join(dir, name + ".trimmed" + ext);

  const videoInfo = await probeVideo(input);
  const totalLength = parseFloat(videoInfo.format.duration);
  const invalidInput = Boolean(
    start > (end ?? totalLength) ||
    (end ?? 0) > totalLength
  );

  if (invalidInput)
    throw Error("Invalid Time Range");

  const args = [
    "-ss",     start.toFixed(0),
    "-accurate_seek",
    "-i",      input,
    "-c",      "copy"
  ];

  if (end) args.push("-to", end.toFixed(0));
  await runFFmpegWithArgs([...args, output]);
  return output;
}