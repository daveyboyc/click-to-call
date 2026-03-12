package com.clicktocall

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : AppCompatActivity() {
    private lateinit var statusText: TextView
    private lateinit var tokenText: TextView
    private lateinit var requestPermissionButton: Button

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        updateNotificationPermissionStatus(granted)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        tokenText = findViewById(R.id.tokenText)
        requestPermissionButton = findViewById(R.id.requestPermissionButton)

        NotificationHelper(this).ensureNotificationChannel()
        updateNotificationPermissionStatus(hasNotificationPermission())
        maybeHandleDialIntent(intent)
        loadFirebaseToken()

        requestPermissionButton.setOnClickListener {
            requestNotificationPermissionIfNeeded(forceRequest = true)
        }

        requestNotificationPermissionIfNeeded(forceRequest = false)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        maybeHandleDialIntent(intent)
    }

    private fun maybeHandleDialIntent(intent: Intent) {
        val number = intent.getStringExtra(NotificationHelper.EXTRA_NUMBER) ?: return
        statusText.text = getString(R.string.status_opening_dialer, number)
        DialerHelper.launchDialer(this, number)
    }

    private fun loadFirebaseToken() {
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token ->
                tokenText.text = getString(R.string.fcm_token_value, token)
            }
            .addOnFailureListener {
                tokenText.text = getString(R.string.fcm_token_unavailable)
            }
    }

    private fun requestNotificationPermissionIfNeeded(forceRequest: Boolean) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            updateNotificationPermissionStatus(true)
            return
        }

        if (hasNotificationPermission()) {
            updateNotificationPermissionStatus(true)
            return
        }

        updateNotificationPermissionStatus(false)
        if (forceRequest) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private fun updateNotificationPermissionStatus(granted: Boolean) {
        statusText.text = if (granted) {
            getString(R.string.status_ready)
        } else {
            getString(R.string.status_permission_required)
        }
        requestPermissionButton.isEnabled = !granted && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
    }

    companion object {
        fun createLaunchIntent(context: Context, number: String): Intent {
            return Intent(context, MainActivity::class.java).apply {
                putExtra(NotificationHelper.EXTRA_NUMBER, number)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
        }
    }
}
