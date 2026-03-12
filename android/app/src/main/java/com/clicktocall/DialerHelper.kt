package com.clicktocall

import android.content.Context
import android.content.Intent
import android.net.Uri

object DialerHelper {
    fun createDialIntent(number: String): Intent {
        return Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$number")
        }
    }

    fun launchDialer(context: Context, number: String) {
        val intent = createDialIntent(number).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
