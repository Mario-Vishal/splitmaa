# Mobile Inference

Android native inference is now implemented as an Expo module in `packages/functiongemma-runner/android`.

Android boundary:

- Kotlin model loader.
- MediaPipe GenAI `LlmInference` runtime through `com.google.mediapipe:tasks-genai:0.10.27`.
- Native bridge returning raw model output, latency, status, and errors.
- TypeScript runner wraps Splitmaa tool definitions into the prompt and validates the returned tool-call JSON.

Development model path:

```bash
adb shell rm -r /data/local/tmp/llm/
adb shell mkdir -p /data/local/tmp/llm/
adb push path/to/model.task /data/local/tmp/llm/splitmaa_functiongemma.task
```

This path matches `DEFAULT_ANDROID_MODEL_PATH` in `@splitmaa/functiongemma-runner`.

Important: this does not work in Expo Go. It requires a development build or APK that includes the native module.

Expected iOS boundary:

- Swift model loader.
- Native bridge returning raw model output and latency.

TypeScript remains responsible for parsing, validation, confirmation, execution, persistence, and diagnostics.
