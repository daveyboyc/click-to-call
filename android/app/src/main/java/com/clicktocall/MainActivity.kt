package com.clicktocall

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentResult
import com.journeyapps.barcodescanner.ScanOptions

class MainActivity : AppCompatActivity() {
    private lateinit var statusText: TextView
    private lateinit var tokenText: TextView
    private lateinit var requestPermissionButton: Button
    private lateinit var scanQrButton: Button

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        updateNotificationPermissionStatus(granted)
    }

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            launchQrScanner()
        } else {
            Toast.makeText(this, "Camera permission required to scan QR codes", Toast.LENGTH_SHORT).show()
        }
    }

    private val qrScanLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents != null) {
            handleQrScanResult(result.contents)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        tokenText = findViewById(R.id.tokenText)
        requestPermissionButton = findViewById(R.id.requestPermissionButton)
        scanQrButton = findViewById(R.id.scanQrButton)

        NotificationHelper(this).ensureNotificationChannel()
        updateNotificationPermissionStatus(hasNotificationPermission())
        maybeHandleDialIntent(intent)
        loadFirebaseToken()

        requestPermissionButton.setOnClickListener {
            requestNotificationPermissionIfNeeded(forceRequest = true)
        }

        scanQrButton.setOnClickListener {
            requestCameraPermissionAndScan()
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
                Log.d("ClickToCall", "FCM_TOKEN: $token")
                tokenText.text = getString(R.string.fcm_token_value, token)
                tokenText.setOnClickListener {
                    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("FCM Token", token))
                    Toast.makeText(this, "Token copied!", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener {
                tokenText.text = getString(R.string.fcm_token_unavailable)
            }
    }

    private fun requestCameraPermissionAndScan() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                launchQrScanner()
            }
            else -> {
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    private fun launchQrScanner() {
        val options = ScanOptions().apply {
            setDesiredBarcodeFormats(ScanOptions.QR_CODE)
            setPrompt("Scan the QR code from the browser extension")
            setCameraId(0)
            setBeepEnabled(false)
            setBarcodeImageEnabled(false)
            setOrientationLocked(false)
        }
        qrScanLauncher.launch(options)
    }

    private fun handleQrScanResult(contents: String) {
        try {
            // Try to parse as JSON (contains url and token)
            val json = org.json.JSONObject(contents)
            val url = json.optString("url", "")
            val token = json.optString("token", "")

            if (token.isNotEmpty()) {
                // Save the token to SharedPreferences for the relay
                val prefs = getSharedPreferences("clicktocall", Context.MODE_PRIVATE)
                prefs.edit().putString("device_token", token).apply()
                if (url.isNotEmpty()) {
                    prefs.edit().putString("relay_url", url).apply()
                }
                Toast.makeText(this, "Paired successfully! Token: $token", Toast.LENGTH_LONG).show()
            } else {
                // Plain token (backwards compatibility)
                val prefs = getSharedPreferences("clicktocall", Context.MODE_PRIVATE)
                prefs.edit().putString("device_token", contents).apply()
                Toast.makeText(this, "Token saved: $contents", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            // Plain token (backwards compatibility)
            val prefs = getSharedPreferences("clicktocall", Context.MODE_PRIVATE)
            prefs.edit().putString("device_token", contents).apply()
            Toast.makeText(this, "Token saved: $contents", Toast.LENGTH_SHORT).show()
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
