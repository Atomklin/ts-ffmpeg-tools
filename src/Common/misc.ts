export function toSeconds(str: string) {
  const time = str.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/);
  if (!time) 
    throw Error("Invalid time input");

  const hours = parseInt(time[1] ?? "0");
  const minutes = parseInt(time[2] ?? "0");
  const seconds = parseInt(time[3] ?? "0");

  return hours * 3_600 + 
    minutes * 60 +
    seconds;
}



