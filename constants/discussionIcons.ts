import { Ionicons } from "@expo/vector-icons";

export type DiscussionIconName = keyof typeof Ionicons.glyphMap;

export const DISCUSSION_ICONS: { name: DiscussionIconName; label: string }[] = [
  { name: "chatbubbles", label: "Chat" },
  { name: "people", label: "Team" },
  { name: "megaphone", label: "Announce" },
  { name: "bulb", label: "Ideas" },
  { name: "code-slash", label: "Dev" },
  { name: "cafe", label: "Casual" },
  { name: "rocket", label: "Launch" },
  { name: "help-circle", label: "Support" },
];

export const DEFAULT_DISCUSSION_ICON: DiscussionIconName = "chatbubbles";

export function discussionIconOrDefault(icon: string | null | undefined): DiscussionIconName {
  const found = DISCUSSION_ICONS.find((i) => i.name === icon);
  return found?.name ?? DEFAULT_DISCUSSION_ICON;
}

export function isDiscussionGroup(group: { id: string; kind?: string | null }) {
  return group.kind === "discussion" || group.id.startsWith("discussion-");
}
