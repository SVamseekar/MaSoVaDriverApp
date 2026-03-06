package com.masovacrew.location

import android.app.*
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.masovacrew.R
import com.masovacrew.MainActivity

/**
 * Background Location Service
 *
 * Continuously tracks driver location even when app is in background.
 * Uses FusedLocationProviderClient for accurate, battery-efficient GPS.
 * Runs as a foreground service with persistent notification (required for Android 8+).
 */
class LocationService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var isTracking = false

    companion object {
        private const val NOTIFICATION_ID = 12345
        private const val CHANNEL_ID = "location_service_channel"
        private const val CHANNEL_NAME = "Driver Location Tracking"

        // Location update intervals
        private const val UPDATE_INTERVAL: Long = 10000 // 10 seconds
        private const val FASTEST_INTERVAL: Long = 5000 // 5 seconds
        private const val MAX_WAIT_TIME: Long = 30000 // 30 seconds

        // Intent extras
        const val ACTION_START_TRACKING = "ACTION_START_TRACKING"
        const val ACTION_STOP_TRACKING = "ACTION_STOP_TRACKING"
        const val EXTRA_DRIVER_ID = "EXTRA_DRIVER_ID"

        // Location broadcast
        const val ACTION_LOCATION_UPDATE = "com.masovacrew.LOCATION_UPDATE"
        const val EXTRA_LOCATION = "EXTRA_LOCATION"
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createLocationCallback()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_TRACKING -> {
                val driverId = intent.getStringExtra(EXTRA_DRIVER_ID)
                startLocationTracking(driverId)
            }
            ACTION_STOP_TRACKING -> {
                stopLocationTracking()
            }
        }

        // Restart service if killed by system
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks your location while delivering orders"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createForegroundNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MaSoVa Crew")
            .setContentText("Tracking your location for deliveries")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun createLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                super.onLocationResult(locationResult)

                locationResult.lastLocation?.let { location ->
                    handleLocationUpdate(location)
                }
            }

            override fun onLocationAvailability(availability: LocationAvailability) {
                super.onLocationAvailability(availability)
                if (!availability.isLocationAvailable) {
                    // Location is temporarily unavailable
                    broadcastLocationError("GPS signal lost")
                }
            }
        }
    }

    private fun startLocationTracking(driverId: String?) {
        if (isTracking) return

        try {
            // Start as foreground service
            startForeground(NOTIFICATION_ID, createForegroundNotification())

            // Create location request
            val locationRequest = LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY,
                UPDATE_INTERVAL
            ).apply {
                setMinUpdateIntervalMillis(FASTEST_INTERVAL)
                setMaxUpdateDelayMillis(MAX_WAIT_TIME)
                setWaitForAccurateLocation(false)
                setMinUpdateDistanceMeters(10f) // Update every 10 meters
            }.build()

            // Request location updates
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )

            isTracking = true
            android.util.Log.d("LocationService", "Started tracking for driver: $driverId")

        } catch (e: SecurityException) {
            android.util.Log.e("LocationService", "Location permission not granted", e)
            broadcastLocationError("Location permission denied")
            stopSelf()
        } catch (e: Exception) {
            android.util.Log.e("LocationService", "Failed to start location tracking", e)
            broadcastLocationError("Failed to start GPS: ${e.message}")
            stopSelf()
        }
    }

    private fun stopLocationTracking() {
        if (!isTracking) return

        fusedLocationClient.removeLocationUpdates(locationCallback)
        isTracking = false

        android.util.Log.d("LocationService", "Stopped location tracking")

        // Stop foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }

        stopSelf()
    }

    private fun handleLocationUpdate(location: Location) {
        // Create location data bundle
        val locationData = mapOf(
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "accuracy" to location.accuracy,
            "altitude" to location.altitude,
            "speed" to location.speed,
            "bearing" to location.bearing,
            "timestamp" to location.time
        )

        // Broadcast to React Native via Intent
        val intent = Intent(ACTION_LOCATION_UPDATE).apply {
            putExtra(EXTRA_LOCATION, locationData.toString())
        }
        sendBroadcast(intent)

        android.util.Log.d(
            "LocationService",
            "Location update: ${location.latitude}, ${location.longitude} (accuracy: ${location.accuracy}m)"
        )
    }

    private fun broadcastLocationError(message: String) {
        val intent = Intent(ACTION_LOCATION_UPDATE).apply {
            putExtra("error", message)
        }
        sendBroadcast(intent)
        android.util.Log.e("LocationService", message)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationTracking()
    }
}
