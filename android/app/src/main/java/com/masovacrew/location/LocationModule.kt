package com.masovacrew.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native Bridge for Background Location Service
 *
 * Provides JavaScript interface to start/stop background GPS tracking.
 * Emits location updates as events to React Native.
 */
class LocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var locationReceiver: BroadcastReceiver? = null
    private var isListening = false

    override fun getName(): String {
        return "BackgroundLocationModule"
    }

    /**
     * Start background location tracking
     */
    @ReactMethod
    fun startTracking(driverId: String, promise: Promise) {
        try {
            val context = reactApplicationContext

            // Create intent for location service
            val serviceIntent = Intent(context, LocationService::class.java).apply {
                action = LocationService.ACTION_START_TRACKING
                putExtra(LocationService.EXTRA_DRIVER_ID, driverId)
            }

            // Start foreground service
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }

            // Register broadcast receiver for location updates
            registerLocationReceiver()

            promise.resolve(mapOf(
                "success" to true,
                "message" to "Background location tracking started"
            ).toWritableMap())

        } catch (e: Exception) {
            promise.reject("START_TRACKING_ERROR", "Failed to start tracking: ${e.message}", e)
        }
    }

    /**
     * Stop background location tracking
     */
    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            val context = reactApplicationContext

            // Stop location service
            val serviceIntent = Intent(context, LocationService::class.java).apply {
                action = LocationService.ACTION_STOP_TRACKING
            }
            context.startService(serviceIntent)

            // Unregister broadcast receiver
            unregisterLocationReceiver()

            promise.resolve(mapOf(
                "success" to true,
                "message" to "Background location tracking stopped"
            ).toWritableMap())

        } catch (e: Exception) {
            promise.reject("STOP_TRACKING_ERROR", "Failed to stop tracking: ${e.message}", e)
        }
    }

    /**
     * Check if tracking is currently active
     */
    @ReactMethod
    fun isTracking(promise: Promise) {
        promise.resolve(isListening)
    }

    /**
     * Register broadcast receiver for location updates
     */
    private fun registerLocationReceiver() {
        if (isListening) return

        locationReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    LocationService.ACTION_LOCATION_UPDATE -> {
                        val locationString = intent.getStringExtra(LocationService.EXTRA_LOCATION)
                        val error = intent.getStringExtra("error")

                        if (error != null) {
                            // Emit error event
                            sendEvent("onLocationError", mapOf(
                                "error" to error
                            ).toWritableMap())
                        } else if (locationString != null) {
                            // Parse location data and emit event
                            try {
                                val location = parseLocationString(locationString)
                                sendEvent("onLocationUpdate", location)
                            } catch (e: Exception) {
                                sendEvent("onLocationError", mapOf(
                                    "error" to "Failed to parse location: ${e.message}"
                                ).toWritableMap())
                            }
                        }
                    }
                }
            }
        }

        val filter = IntentFilter(LocationService.ACTION_LOCATION_UPDATE)
        reactApplicationContext.registerReceiver(locationReceiver, filter)
        isListening = true
    }

    /**
     * Unregister broadcast receiver
     */
    private fun unregisterLocationReceiver() {
        if (!isListening || locationReceiver == null) return

        try {
            reactApplicationContext.unregisterReceiver(locationReceiver)
            locationReceiver = null
            isListening = false
        } catch (e: Exception) {
            // Receiver not registered
        }
    }

    /**
     * Parse location string from broadcast intent
     */
    private fun parseLocationString(locationString: String): WritableMap {
        val location = WritableNativeMap()

        // Simple parsing (replace with JSON parsing if needed)
        val parts = locationString
            .removeSurrounding("{", "}")
            .split(", ")
            .associate {
                val (key, value) = it.split("=")
                key to value
            }

        location.putDouble("latitude", parts["latitude"]?.toDoubleOrNull() ?: 0.0)
        location.putDouble("longitude", parts["longitude"]?.toDoubleOrNull() ?: 0.0)
        location.putDouble("accuracy", parts["accuracy"]?.toDoubleOrNull() ?: 0.0)
        location.putDouble("altitude", parts["altitude"]?.toDoubleOrNull() ?: 0.0)
        location.putDouble("speed", parts["speed"]?.toDoubleOrNull() ?: 0.0)
        location.putDouble("bearing", parts["bearing"]?.toDoubleOrNull() ?: 0.0)
        location.putDouble("timestamp", parts["timestamp"]?.toDoubleOrNull() ?: 0.0)

        return location
    }

    /**
     * Send event to React Native JavaScript
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    /**
     * Clean up on module destroy
     */
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        unregisterLocationReceiver()
    }
}

/**
 * Helper extension to convert Map to WritableMap
 */
private fun Map<String, Any>.toWritableMap(): WritableMap {
    val map = WritableNativeMap()
    this.forEach { (key, value) ->
        when (value) {
            is String -> map.putString(key, value)
            is Int -> map.putInt(key, value)
            is Double -> map.putDouble(key, value)
            is Boolean -> map.putBoolean(key, value)
            is Map<*, *> -> map.putMap(key, (value as Map<String, Any>).toWritableMap())
            else -> map.putString(key, value.toString())
        }
    }
    return map
}
