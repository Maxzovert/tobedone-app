import { Ionicons } from "@expo/vector-icons";

export type ProjectIconName = keyof typeof Ionicons.glyphMap;

export const EMOJI_ICON_PREFIX = "emoji:";

export const PROJECT_ICONS: { name: ProjectIconName; label: string }[] = [
  { name: "folder", label: "Folder" },
  { name: "people", label: "Team" },
  { name: "rocket", label: "Rocket" },
  { name: "briefcase", label: "Work" },
  { name: "code-slash", label: "Dev" },
  { name: "bulb", label: "Ideas" },
  { name: "school", label: "Study" },
  { name: "heart", label: "Personal" },
  { name: "cart", label: "Shop" },
  { name: "fitness", label: "Fitness" },
  { name: "musical-notes", label: "Music" },
  { name: "globe", label: "Global" },
];

export const DEFAULT_PROJECT_ICON: ProjectIconName = "folder";

const EMOJI_RE = /\p{Extended_Pictographic}/u;

export function isProjectIonicon(name: string): name is ProjectIconName {
  return PROJECT_ICONS.some((i) => i.name === name);
}

export function isStoredEmojiIcon(icon: string): boolean {
  return icon.startsWith(EMOJI_ICON_PREFIX);
}

export function encodeEmojiIcon(emoji: string): string {
  return `${EMOJI_ICON_PREFIX}${emoji}`;
}

export function decodeEmojiIcon(icon: string): string {
  return icon.startsWith(EMOJI_ICON_PREFIX) ? icon.slice(EMOJI_ICON_PREFIX.length) : icon;
}

export type ProjectIconDisplay =
  | { type: "ionicon"; name: ProjectIconName }
  | { type: "emoji"; emoji: string };

export function getProjectIconDisplay(
  icon: string | null | undefined
): ProjectIconDisplay {
  if (!icon) return { type: "ionicon", name: DEFAULT_PROJECT_ICON };
  if (isStoredEmojiIcon(icon)) {
    return { type: "emoji", emoji: decodeEmojiIcon(icon) };
  }
  if (isProjectIonicon(icon)) return { type: "ionicon", name: icon };
  if (EMOJI_RE.test(icon)) return { type: "emoji", emoji: icon };
  return { type: "ionicon", name: DEFAULT_PROJECT_ICON };
}

/** @deprecated Use getProjectIconDisplay */
export function isProjectIcon(name: string): name is ProjectIconName {
  return isProjectIonicon(name);
}

/** @deprecated Use getProjectIconDisplay */
export function projectIconOrDefault(icon: string | null | undefined): ProjectIconName {
  const d = getProjectIconDisplay(icon);
  return d.type === "ionicon" ? d.name : DEFAULT_PROJECT_ICON;
}
