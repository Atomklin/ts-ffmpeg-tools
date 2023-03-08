import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";

import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";

export async function runFFmpegWithArgs(args: string[]) {
  if (!existsSync(ffmpegPath)) throw Error("Ffmpeg is not installed");
  const ffmpegProcess = spawn(ffmpegPath, args, {
    windowsHide: true,
    stdio: "inherit"
  });

  await once(ffmpegProcess, "close");
}



export async function probeVideo(input: string) {
  if (!existsSync(ffprobePath)) throw Error("FFprobe is not installed");
  const args = [
    "-i",            input,
    "-print_format", "json",
    "-show_streams", 
    "-show_format"
  ];

  const ffprobeProcess = spawn(ffprobePath, args, { 
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"]
  });

  return new Promise<VideoInfo>((resolve) => {
    let data = "";
    ffprobeProcess.stdout.setEncoding("utf8");
    ffprobeProcess.stdout.on("data", (chunk) => 
      data += chunk
    );
  
    ffprobeProcess.once("close", () => {
      ffprobeProcess.stdout.removeAllListeners();
      resolve(JSON.parse(data));
    });
  });
}

export interface VideoInfo {
  streams: {
    codec_type: string;
    height:     number;
    width:      number;
  }[];
  format: {
    duration: string;
  }
}