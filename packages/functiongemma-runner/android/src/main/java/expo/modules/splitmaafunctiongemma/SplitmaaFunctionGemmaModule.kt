package expo.modules.splitmaafunctiongemma

import android.os.SystemClock
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.OpenApiTool
import com.google.ai.edge.litertlm.ToolProvider
import com.google.ai.edge.litertlm.tool
import com.google.gson.Gson
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class SplitmaaFunctionGemmaModule : Module() {
  private val gson = Gson()
  private var engine: Engine? = null
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
    val modelFile = File(nextModelPath)

    if (!modelFile.exists()) {
      status = "failed"
      lastError = "Model file does not exist: $nextModelPath"
      return statePayload()
    }

    if (
      engine != null &&
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
      val engineConfig = EngineConfig(
        modelPath = nextModelPath,
        backend = Backend.CPU(),
        cacheDir = context.cacheDir.absolutePath,
      )

      engine = Engine(engineConfig).also { it.initialize() }
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
    val toolProviders = toolProviders(input["tools"])
    val model = engine

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
      logJson(
        "infer_start",
        mapOf(
          "promptChars" to prompt.length,
          "toolCount" to toolProviders.size,
          "modelPath" to currentModelPath,
        ),
      )
      val conversationConfig = ConversationConfig(
        systemInstruction = Contents.of(
          "You are Splitmaa's on-device function-calling model. Choose exactly one registered tool when the user request maps to a Splitmaa action. Do not invent tool names.",
        ),
        tools = toolProviders,
        automaticToolCalling = false,
      )
      val response = model.createConversation(conversationConfig).use { conversation ->
        conversation.sendMessage(prompt)
      }
      val toolCall = response.toolCalls.firstOrNull()
      val text = responseText(response)
      val latencyMs = SystemClock.elapsedRealtime() - startMs
      logJson(
        "infer_result",
        mapOf(
          "latencyMs" to latencyMs,
          "text" to text,
          "toolCalls" to response.toolCalls.map { call ->
            mapOf(
              "name" to call.name,
              "arguments" to call.arguments,
            )
          },
          "message" to response.toString(),
        ),
      )
      val payload = mutableMapOf<String, Any?>(
        "text" to text,
        "latencyMs" to latencyMs,
        "status" to "ready",
      )
      if (toolCall != null) {
        payload["toolCall"] = mapOf(
          "name" to toolCall.name,
          "arguments" to toolCall.arguments,
        )
      }
      payload
    } catch (error: Throwable) {
      status = "failed"
      lastError = error.message ?: error.javaClass.simpleName
      logJson(
        "infer_error",
        mapOf(
          "latencyMs" to (SystemClock.elapsedRealtime() - startMs),
          "errorClass" to error.javaClass.name,
          "message" to lastError,
        ),
      )
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
      engine?.close()
    } finally {
      engine = null
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

  @Suppress("UNCHECKED_CAST")
  private fun toolProviders(value: Any?): List<ToolProvider> {
    val tools = value as? List<Map<String, Any?>> ?: return emptyList()
    return tools.mapNotNull { definition ->
      val name = stringValue(definition["name"]) ?: return@mapNotNull null
      val description = stringValue(definition["description"]) ?: return@mapNotNull null
      val parameters = definition["parameters"] ?: return@mapNotNull null
      tool(SplitmaaOpenApiTool(name, description, parameters))
    }
  }

  private fun responseText(message: Message): String {
    val toolCall = message.toolCalls.firstOrNull()
    if (toolCall != null) {
      return gson.toJson(
        mapOf(
          "name" to toolCall.name,
          "arguments" to toolCall.arguments,
        ),
      )
    }

    return message.contents.contents
      .filterIsInstance<Content.Text>()
      .joinToString(separator = "") { it.text }
      .ifBlank { message.toString() }
  }

  private fun logJson(event: String, payload: Map<String, Any?>) {
    val json = gson.toJson(
      mapOf(
        "tag" to LOG_TAG,
        "event" to event,
        "payload" to payload,
      ),
    )
    json.chunked(LOG_CHUNK_SIZE).forEachIndexed { index, chunk ->
      Log.i(LOG_TAG, "chunk=$index $chunk")
    }
  }

  private inner class SplitmaaOpenApiTool(
    private val name: String,
    private val description: String,
    private val parameters: Any,
  ) : OpenApiTool {
    override fun getToolDescriptionJsonString(): String {
      return gson.toJson(
        mapOf(
          "name" to name,
          "description" to description,
          "parameters" to parameters,
        ),
      )
    }

    override fun execute(paramsJsonString: String): String {
      return """{"accepted":true}"""
    }
  }

  companion object {
    private const val LOG_TAG = "SplitmaaFGemma"
    private const val LOG_CHUNK_SIZE = 3500
    private const val DEFAULT_MAX_TOKENS = 256
  }
}
