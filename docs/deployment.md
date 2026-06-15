# Deployment

Splitmaa is not packaged yet.

## Local Preview

```bash
pnpm install
pnpm mobile:web
```

## Android

Expo Go may reject the project if its installed client does not support the app's current Expo SDK.

Expo Go also cannot run the native FunctionGemma runner. Use Expo Go only for UI testing; assistant commands that require the model will not execute there.

For UI testing:

```bash
pnpm mobile:start
```

Then scan the QR code with a compatible Expo Go version.

For native FunctionGemma testing, build a development client/APK, then push a MediaPipe-compatible `.task` model:

```bash
pnpm mobile:android:native
adb shell rm -r /data/local/tmp/llm/
adb shell mkdir -p /data/local/tmp/llm/
adb push path/to/model.task /data/local/tmp/llm/splitmaa_functiongemma.task
```

The app's native runner loads `/data/local/tmp/llm/splitmaa_functiongemma.task`.

Local machine requirements:

- Android builds need a JDK/`JAVA_HOME`.
- Device/model commands need Android platform tools/`adb` on PATH.

The current Codex shell could generate `apps/mobile/android` and verify Expo autolinking, but Gradle could not compile because Java was not on PATH. `adb devices` also failed because `adb` was not on PATH.

## iOS

iOS simulator and development build instructions will be documented honestly. Store distribution is not part of the initial open-source release.
