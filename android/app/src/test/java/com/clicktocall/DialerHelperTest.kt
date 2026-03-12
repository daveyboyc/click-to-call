package com.clicktocall

import org.junit.Assert.assertEquals
import org.junit.Test

class DialerHelperTest {
    @Test
    fun createDialIntent_usesActionDial() {
        val intent = DialerHelper.createDialIntent("+442079460958")

        assertEquals("android.intent.action.DIAL", intent.action)
    }

    @Test
    fun createDialIntent_preservesLeadingPlusInTelUri() {
        val intent = DialerHelper.createDialIntent("+34612345678")

        assertEquals("tel:+34612345678", intent.dataString)
    }
}
