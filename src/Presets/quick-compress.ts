import { join, parse } from "node:path";
import prompts from "prompts";

import { probeVideo, runFFmpegWithArgs } from "../Common/ffmpeg";
import { validatePathInput } from "../Common/filesystem";

export async function run() {
  const { file, size, codec } = await prompts([
    {
      validate: (i) => validatePathInput(i),
      message: "Input file path",
      type: "text",
      name: "file"
    },
    {
      message: "Select desired Codec",
      type: "select",
      name: "codec",
      choices: [
        { title: "H264_Nvenc (Nvidia GPU)", value: "h264_nvenc" },
        { title: "H264_Amf (AMD GPU)",      value: "h264_amf"   },
        { title: "Libx264 (CPU)",           value: "libx264"    },
      ]
    },
    {
      message: "Desired size (MB)",
      type: "number",
      name: "size",
      initial: 8,
    }
  ]);

  if (!file || !size) throw Error("Invalid Input");
  return compressVideo(file, size, codec);
}


export async function compressVideo(input: string, maxSize: number, codec?: string) {
  const { dir, name } = parse(input);
  const output = join(dir, name + ".compressed.mp4");

  const videoInfo = await probeVideo(input);
  const videoDuration = parseFloat(videoInfo.format.duration);
  const videoHeight = videoInfo.streams
    .filter((c) => c.codec_type == "video")
    ?.at(0)?.height;
  
  if (!videoHeight)
    throw Error("File Doesn't Contain a Readable Video Stream");

  // convert Mb to Kbps (100kbps minimum bitrate)
  const videoBitrate = Math.max(maxSize * 8e3 / videoDuration - 128, 100); 
  const rescaleArgs = getRescaleArgs(videoHeight, videoBitrate);
  const defaultArgs = [
    "-i",            input,
    "-passlogfile",  join(__dirname, "..", "..", "logs", "pass2log"),
    "-vcodec",       (codec ?? "libx264"),
    "-b:v",           `${videoBitrate}k`,
    "-movflags",     "faststart",
    "-pix_fmt",      "yuv420p",
    "-r",            "24",
  ];

  if (rescaleArgs)
    defaultArgs.push("-vf", rescaleArgs);

  // First Pass
  await runFFmpegWithArgs([
    ...defaultArgs,
    "-an",      // Remove Audio
    "-f",       "mp4",
    "-pass",    "1",
    "-y",       "NUL" 
  ]);
  
  // Second Pass
  await runFFmpegWithArgs([
    ...defaultArgs, 
    "-acodec",   "aac",          
    "-b:a",      "128k",
    "-pass",     "2",
    output
  ]);
  
  return output;
}


export function getRescaleArgs(videoHeight: number, videoBitrate: number) {
  const inRange = (value: number, min: number, max: number) =>
    min <= value  && value <= max;

  // Based on : https://support.google.com/youtube/answer/1722171
  if      (videoHeight >= 360  && videoBitrate <= 2.5e3) return "scale=-1:360";
  else if (videoHeight >= 480  && inRange(videoBitrate, 2.5e3, 5e3)) return "scale=-1:480";
  else if (videoHeight >= 720  && inRange(videoBitrate, 5e3, 8e3)  ) return "scale=-1:720";
  else if (videoHeight >= 1080 && videoBitrate >= 8e3) return "scale=-1:1080";
}
