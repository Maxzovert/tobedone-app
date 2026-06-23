import { router } from "expo-router";
import { Notification } from "@/types";

export function openNotificationTarget(notification: Notification): boolean {
  const groupId = notification.data?.groupId;
  const projectId = notification.data?.projectId;
  if (
    (notification.type === "message" || notification.type === "mention") &&
    groupId &&
    projectId
  ) {
    const title = notification.data?.groupName ?? notification.title;
    router.push({
      pathname: "/(app)/chat/[groupId]",
      params: {
        groupId,
        projectId,
        title: encodeURIComponent(title),
      },
    });
    return true;
  }
  return false;
}

export function openPushNotificationData(data: Record<string, unknown>): boolean {
  const groupId = typeof data.groupId === "string" ? data.groupId : undefined;
  const projectId =
    typeof data.projectId === "string" ? data.projectId : undefined;
  if (!groupId || !projectId) return false;

  const groupName =
    typeof data.groupName === "string" ? data.groupName : "Chat";
  router.push({
    pathname: "/(app)/chat/[groupId]",
    params: {
      groupId,
      projectId,
      title: encodeURIComponent(groupName),
    },
  });
  return true;
}
