package com.clicktocall

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class CallFirebaseService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("CallFirebaseService", "New FCM token: $token")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val number = message.data["number"]
        if (number.isNullOrBlank()) {
            Log.w("CallFirebaseService", "Ignoring FCM data message without number")
            return
        }

        NotificationHelper(applicationContext).showIncomingCallNotification(number)
    }
}
