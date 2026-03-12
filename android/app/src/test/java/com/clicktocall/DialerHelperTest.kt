package com.clicktocall

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DialerHelperTest {
    @Test
    fun createDialIntent_usesActionDial_withSanitisedTelUri() {
        val intent = DialerHelper.createDialIntent(" +44 (20) 7946 0958 ")

        assertEquals("android.intent.action.DIAL", intent.action)
        assertEquals("tel:+442079460958", intent.dataString)
    }

    @Test
    fun sanitiseNumber_preservesLeadingPlus() {
        assertEquals("+34612345678", DialerHelper.sanitiseNumber("+34 612 345 678"))
    }

    @Test
    fun sanitiseNumber_removesFormattingAndLetters() {
        assertEquals("5551234567", DialerHelper.sanitiseNumber("call me at 555-123-4567 ext abc"))
    }

    @Test
    fun sanitiseNumber_allowsOnlyALeadingPlus() {
        assertEquals("+123456", DialerHelper.sanitiseNumber("+1+23+4+56"))
    }

    @Test
    fun sanitiseNumber_rejectsValuesWithoutDigits() {
        assertNull(DialerHelper.sanitiseNumber("+++---()"))
    }

    @Test
    fun recoverIncomingNumber_convertsDoubleZeroPrefixToPlus() {
        assertEquals("+442079460958", DialerHelper.recoverIncomingNumber("0044 20 7946 0958"))
    }

    @Test
    fun recoverIncomingNumber_movesMisplacedPlusToFrontAndRejectsGarbage() {
        assertEquals("+442079460958", DialerHelper.recoverIncomingNumber("44+20 7946 0958"))
        assertNull(DialerHelper.recoverIncomingNumber("abc ++ ???"))
    }
}
