import { existsSync, lstatSync } from "node:fs";

export function validatePathInput(input: string, allowDir?: boolean) {
  if (!existsSync(input))
    return "Path does not exist";

  const stats = lstatSync(input);
  if (stats.isFile() || (allowDir && stats.isDirectory())) 
    return true;
    
  else return "Invalid File"; 
}