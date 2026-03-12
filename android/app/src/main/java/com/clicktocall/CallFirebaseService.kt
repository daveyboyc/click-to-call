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

        val rawNumber = message.data["number"]
        if (rawNumber.isNullOrBlank()) {
            Log.w("CallFirebaseService", "Ignoring FCM data message without number")
            return
        }

        val number = DialerHelper.recoverIncomingNumber(rawNumber)
        if (number == null) {
            Log.w("CallFirebaseService", "Ignoring FCM data message with invalid number: $rawNumber")
            return
        }

        NotificationHelper(applicationContext).showIncomingCallNotification(number)
    }
}
