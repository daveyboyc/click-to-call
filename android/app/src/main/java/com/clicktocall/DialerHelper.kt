package com.clicktocall

import android.content.Context
import android.content.Intent
import android.net.Uri

object DialerHelper {
    private val E164_REGEX = Regex("^\\+[1-9]\\d{6,14}$")

    fun sanitiseNumber(raw: String): String? {
        if (raw.isBlank()) {
            return null
        }

        val builder = StringBuilder()

        for (char in raw) {
            when {
                char.isDigit() -> builder.append(char)
                char == '+' && builder.isEmpty() -> builder.append(char)
            }
        }

        val sanitised = builder.toString()
        val digitCount = sanitised.count(Char::isDigit)
        return if (digitCount > 0) sanitised else null
    }

    fun recoverIncomingNumber(raw: String): String? {
        val sanitised = sanitiseNumber(raw) ?: return null
        val digitsOnly = sanitised.filter(Char::isDigit)

        val recovered = when {
            sanitised.startsWith("+") -> sanitised
            digitsOnly.startsWith("00") && digitsOnly.length > 2 -> "+${digitsOnly.drop(2)}"
            raw.contains('+') -> "+$digitsOnly"
            else -> null
        }

        return recovered?.takeIf { E164_REGEX.matches(it) }
    }

    fun createDialIntent(number: String): Intent {
        val sanitised = sanitiseNumber(number)
            ?: throw IllegalArgumentException("Dialer number must contain at least one digit")

        return Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$sanitised")
        }
    }

    fun launchDialer(context: Context, number: String) {
        val intent = createDialIntent(number).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
