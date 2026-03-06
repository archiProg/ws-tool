import AsyncStorage from "@react-native-async-storage/async-storage";
import { GroupPreset } from "../constants/types";

const KEY_GROUPS = "WS_GROUPS_V1";
const KEY_SELECTED = "WS_SELECTED_GROUP_ID_V1";

export async function loadGroups(): Promise<GroupPreset[]> {
  const raw = await AsyncStorage.getItem(KEY_GROUPS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as GroupPreset[];
    return [];
  } catch {
    return [];
  }
}

export async function saveGroups(groups: GroupPreset[]): Promise<void> {
  await AsyncStorage.setItem(KEY_GROUPS, JSON.stringify(groups));
}

export async function loadSelectedGroupId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_SELECTED);
}

export async function saveSelectedGroupId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY_SELECTED, id);
}
