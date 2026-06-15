package expo.modules.splitmaafunctiongemma

import android.os.SystemClock
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class SplitmaaFunctionGemmaModule : Module() {
  private var llmInference: LlmInference? = null
  private var currentModelPath: String? = null
  private var currentMaxTokens: Int = DEFAULT_MAX_TOKENS
  private var status: String = "not_configured"
  private var lastError: String? = null

  override fun definition() = ModuleDefinition {
    Name("SplitmaaFunctionGemma")

    AsyncFunction("getStatus") {
      status
    }

    AsyncFunction("getLastError") {
      lastError
    }

    AsyncFunction("configure") { options: Map<String, Any?> ->
      configure(options)
    }

    AsyncFunction("infer") { input: Map<String, Any?> ->
      infer(input)
    }

    AsyncFunction("reset") {
      reset()
    }
  }

  private fun configure(options: Map<String, Any?>): Map<String, Any?> {
    val nextModelPath = stringValue(options["modelPath"])
      ?: throw IllegalArgumentException("modelPath is required")
    val nextMaxTokens = intValue(options["maxTokens"], DEFAULT_MAX_TOKENS)
    val maxTopK = intValue(options["maxTopK"], DEFAULT_MAX_TOP_K)
    val modelFile = File(nextModelPath)

    if (!modelFile.exists()) {
      status = "failed"
      lastError = "Model file does not exist: $nextModelPath"
      return statePayload()
    }

    if (
      llmInference != null &&
      currentModelPath == nextModelPath &&
      currentMaxTokens == nextMaxTokens &&
      status == "ready"
    ) {
      return statePayload()
    }

    status = "loading"
    lastError = null
    closeCurrent()

    try {
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context is not available")
      val taskOptions = LlmInference.LlmInferenceOptions.builder()
        .setModelPath(nextModelPath)
        .setMaxTokens(nextMaxTokens)
        .setMaxTopK(maxTopK)
        .build()

      llmInference = LlmInference.createFromOptions(context, taskOptions)
      currentModelPath = nextModelPath
      currentMaxTokens = nextMaxTokens
      status = "ready"
    } catch (error: Throwable) {
      status = "failed"
      lastError = error.message ?: error.javaClass.simpleName
      closeCurrent()
    }

    return statePayload()
  }

  private fun infer(input: Map<String, Any?>): Map<String, Any?> {
    val prompt = stringValue(input["prompt"])
      ?: throw IllegalArgumentException("prompt is required")
    val model = llmInference

    if (status != "ready" || model == null) {
      return mapOf(
        "text" to "",
        "latencyMs" to 0,
        "status" to status,
        "error" to (lastError ?: "FunctionGemma runner is not ready"),
      )
    }

    val startMs = SystemClock.elapsedRealtime()

    return try {
      val text = model.generateResponse(prompt)
      mapOf(
        "text" to text,
        "latencyMs" to (SystemClock.elapsedRealtime() - startMs),
        "status" to "ready",
      )
    } catch (error: Throwable) {
      status = "failed"
      lastError = error.message ?: error.javaClass.simpleName
      mapOf(
        "text" to "",
        "latencyMs" to (SystemClock.elapsedRealtime() - startMs),
        "status" to "failed",
        "error" to lastError,
      )
    }
  }

  private fun reset(): Map<String, Any?> {
    closeCurrent()
    currentModelPath = null
    currentMaxTokens = DEFAULT_MAX_TOKENS
    status = "not_configured"
    lastError = null
    return statePayload()
  }

  private fun closeCurrent() {
    try {
      llmInference?.close()
    } finally {
      llmInference = null
    }
  }

  private fun statePayload(): Map<String, Any?> {
    return mapOf(
      "status" to status,
      "modelPath" to currentModelPath,
      "maxTokens" to currentMaxTokens,
      "lastError" to lastError,
    )
  }

  private fun stringValue(value: Any?): String? {
    return value as? String
  }

  private fun intValue(value: Any?, fallback: Int): Int {
    return when (value) {
      is Int -> value
      is Double -> value.toInt()
      is Float -> value.toInt()
      is Long -> value.toInt()
      else -> fallback
    }
  }

  companion object {
    private const val DEFAULT_MAX_TOKENS = 256
    private const val DEFAULT_MAX_TOP_K = 64
  }
}
