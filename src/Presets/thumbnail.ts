import { lstatSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import prompts from "prompts";

import { probeVideo, runFFmpegWithArgs } from "../Common/ffmpeg";
import { validatePathInput } from "../Common/filesystem";
import { toSeconds } from "../Common/misc";

export async function run() {
  const { path, timestamp } = await prompts([
    {
      validate: (i) => validatePathInput(i, true),
      message: "Input file path",
      name: "path",
      type: "text"
    },
    {
      message: "Input timestamp of screenshot(s) (HH:MM:SS / Seconds)",
      name: "timestamp",
      type: "text"
    }
  ]);

  if (!path) throw Error("Invalid File Input");
  const isDirectory = lstatSync(path).isDirectory();
  const timestampSeconds = timestamp 
    ? toSeconds(timestamp) 
    : undefined;

  if (isDirectory) {
    const dirents = await readdir(path, { withFileTypes: true });
    for (const dirent of dirents) {
      if (!dirent.isFile()) 
        continue;
        
      const fullpath = join(path, dirent.name);
      await createThumbnail(fullpath, timestampSeconds);
    }

  } else {
    return createThumbnail(path, timestampSeconds);
  }
}


export async function createThumbnail(input: string, timestamp = 0) {
  const { dir, base } = parse(input);
  const output = join(dir, base + ".thumbnail.jpeg");

  const videoInfo = await probeVideo(input);
  const totalLength = parseFloat(videoInfo.format.duration);
  if (timestamp > totalLength)
    throw Error("Invalid Timestamp");

  const args = [
    "-ss",        timestamp.toFixed(0),
    "-i",         input,
    "-vframes:v", "1",
    output
  ];

  await runFFmpegWithArgs(args);
  return output;
}