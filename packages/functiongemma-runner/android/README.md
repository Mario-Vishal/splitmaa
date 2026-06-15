# Android FunctionGemma Runner

This folder contains the Expo Android native module for on-device FunctionGemma-style inference.

Current implementation:

- autolinks as `SplitmaaFunctionGemma`
- uses MediaPipe GenAI `com.google.mediapipe:tasks-genai:0.10.27`
- loads a `.task` model from `/data/local/tmp/llm/splitmaa_functiongemma.task`
- calls `LlmInference.generateResponse(prompt)`
- returns raw text, latency, and runner status to TypeScript

TypeScript still owns tool-call prompting, JSON validation, action conversion, confirmation, persistence, and logs.

Development model install:

```bash
adb shell rm -r /data/local/tmp/llm/
adb shell mkdir -p /data/local/tmp/llm/
adb push path/to/model.task /data/local/tmp/llm/splitmaa_functiongemma.task
```

This will not work in Expo Go. It requires an Android dev build or APK that includes this native module.
