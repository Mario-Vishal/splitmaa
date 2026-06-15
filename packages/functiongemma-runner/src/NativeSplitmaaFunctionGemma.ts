import { requireNativeModule } from "expo-modules-core";

export type NativeSplitmaaFunctionGemmaState = {
  status: "not_configured" | "loading" | "ready" | "failed";
  modelPath?: string;
  maxTokens?: number;
  lastError?: string;
};

export type NativeSplitmaaFunctionGemmaInferResult = {
  text: string;
  latencyMs: number;
  status: "not_configured" | "loading" | "ready" | "failed";
  error?: string;
};

export type NativeSplitmaaFunctionGemmaModule = {
  getStatus(): Promise<NativeSplitmaaFunctionGemmaState["status"]>;
  getLastError(): Promise<string | undefined>;
  configure(options: {
    modelPath: string;
    maxTokens?: number;
    maxTopK?: number;
  }): Promise<NativeSplitmaaFunctionGemmaState>;
  infer(input: { prompt: string }): Promise<NativeSplitmaaFunctionGemmaInferResult>;
  reset(): Promise<NativeSplitmaaFunctionGemmaState>;
};

let nativeModule: NativeSplitmaaFunctionGemmaModule | undefined;
let didLoadNativeModule = false;

export function getNativeSplitmaaFunctionGemmaModule(): NativeSplitmaaFunctionGemmaModule | undefined {
  if (didLoadNativeModule) return nativeModule;
  didLoadNativeModule = true;

  try {
    nativeModule = requireNativeModule<NativeSplitmaaFunctionGemmaModule>("SplitmaaFunctionGemma");
  } catch {
    nativeModule = undefined;
  }

  return nativeModule;
}
