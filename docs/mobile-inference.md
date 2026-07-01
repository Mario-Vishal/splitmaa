# Mobile Inference

Android native inference exists from the first FunctionGemma implementation path, but the active model candidate is now Qwen2.5-0.5B with strict JSON output.

Current Android boundary:

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

## Qwen Pivot Impact

The existing native package name and `.task` path are FunctionGemma-specific. Before wiring Qwen into the app, choose the mobile runtime/export path:

- convert and quantize the selected Qwen checkpoint to a mobile-loadable format, likely Q4 first;
- keep the model as an optional downloaded AI pack, not bundled in the base app;
- rename the runner boundary from FunctionGemma-specific wording to generic local intent model wording;
- keep TypeScript validation unchanged: the model returns raw text, and the app parses one `extract_workflow_intent` JSON object.

Expected size if Qwen2.5-0.5B wins:

- raw Hugging Face model: about `953 MB`;
- Q4 model pack: roughly `300-400 MB`;
- base app plus model installed storage: roughly `450-650 MB`.

Expected iOS boundary:

- Swift model loader.
- Native bridge returning raw model output and latency.

TypeScript remains responsible for parsing, validation, confirmation, execution, persistence, and diagnostics.
