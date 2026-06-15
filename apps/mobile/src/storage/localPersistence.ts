import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createInitialLocalAppState,
  type LocalAppState,
  validateLocalAppState,
} from "@splitmaa/core";

export const splitmaaStorageKey = "splitmaa.localAppState.v1";

export type PersistenceLoadResult = {
  state: LocalAppState;
  source: "storage" | "seed" | "recovered";
};

export async function loadLocalAppState(): Promise<PersistenceLoadResult> {
  const raw = await AsyncStorage.getItem(splitmaaStorageKey);

  if (!raw) {
    return {
      state: createInitialLocalAppState(),
      source: "seed",
    };
  }

  try {
    return {
      state: validateLocalAppState(JSON.parse(raw)),
      source: "storage",
    };
  } catch {
    return {
      state: createInitialLocalAppState(),
      source: "recovered",
    };
  }
}

export async function saveLocalAppState(state: LocalAppState): Promise<void> {
  const validated = validateLocalAppState(state);
  await AsyncStorage.setItem(splitmaaStorageKey, JSON.stringify(validated));
}

export async function clearLocalAppState(): Promise<void> {
  await AsyncStorage.removeItem(splitmaaStorageKey);
}
