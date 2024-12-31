import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { searchAnime } from "./searchAnime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
