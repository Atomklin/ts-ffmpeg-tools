import { spawn } from "node:child_process";
import { once } from "node:events";
import prompts from "prompts";

import { path } from "@ffmpeg-installer/ffmpeg";

import { validatePathInput } from "../Common/filesystem";

export async function run() {
  const { input, ffplay } = await prompts([
    {
      message: "FFmpeg Input",
      name: "input",
      type: "text",
    },
    {
      validate: (i) => validatePathInput(i),
      message: "FFplay executable",
      name: "ffplay",
      type: "text"
    }
  ]);

  return visualizeAudio(input, ffplay);
}


export async function visualizeAudio(input: string, ffplay: string) {
  const ffplayProcess = spawn(ffplay, [
    "-framedrop",     "-sn",
    "-window_title",  input,
    "-i",             "pipe:0",
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const ffmpegProcess = spawn(path, [
    "-i",              input,
    "-filter_complex", "[0:a]showwaves=mode=cline:s=1920x1080[v]",
    "-map",            "[v]",
    "-map",            "0:a",

    "-f",              "mpegts",
    "-acodec",         "copy",
    "pipe:1"
  ], { stdio: "pipe" });

  ffmpegProcess.stdout.pipe(ffplayProcess.stdin);

  await Promise.all([
    once(ffmpegProcess, "close"),
    once(ffplayProcess, "close")
  ]);
}