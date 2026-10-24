package com.upscpods.app.data

import android.app.Activity
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingClient.ProductType
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.upscpods.app.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.security.MessageDigest
import kotlin.coroutines.resume

/**
 * Google Play Billing for Plus (server play.ts): built, and off. A year of Plus is the one-time product "plus_yearly"
 * (₹9,999, set in Play Console), like the year on the web: no auto-renewal.
 *
 * Three switches, all needed: this build ([built], from -Pupsc.playBilling=true), the server's "play_billing" flag
 * (with "plus"), and the server's Play check being set up (/plus/status play.ready). With any of them off nothing here
 * runs and the Plus page is as before: the WhatsApp chat is the only action.
 *
 * The flow: connect, look up plus_yearly, open Play's purchase sheet with the SHA-256 of the member id as the
 * obfuscated account id, then send the purchase token to the server. Only once the server says "granted" is the
 * purchase consumed (consuming acknowledges it too, and lets the same Google account buy the next year). A purchase
 * the server hasn't confirmed is left alone: [resume] tries it again, and Play refunds it by itself after 3 days if
 * it's never acknowledged.
 */
class PlayBilling(context: Context, private val community: Community, private val memberId: () -> String) : PurchasesUpdatedListener {
    companion object {
        const val PRODUCT = "plus_yearly"
        /** The build switch: a build made without it never starts a purchase, whatever the server says. */
        val built get() = BuildConfig.PLAY_BILLING
    }

    var busy by mutableStateOf(false); private set
    /** One line for the Plus page: pending, couldn't confirm, or done. */
    var note by mutableStateOf<String?>(null); private set
    /** Called once the server has granted the year. */
    var onGranted: () -> Unit = {}

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val client = BillingClient.newBuilder(context.applicationContext).setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .build()

    /** Opens Play's purchase sheet for a year of Plus. */
    fun buy(activity: Activity) {
        if (!built || busy) return
        busy = true; note = null
        scope.launch {
            val details = if (connect()) details() else null
            if (details == null) { busy = false; note = "Google Play isn't reachable just now. Try again in a minute."; return@launch }
            val params = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).build()))
                .setObfuscatedAccountId(sha256(memberId()))
                .build()
            val r = client.launchBillingFlow(activity, params)
            if (r.responseCode != BillingResponseCode.OK) { busy = false; note = "Google Play couldn't open the purchase just now." }
        }
    }

    /** Purchases Play still holds unconsumed (the app closed before the server answered): confirm them now. */
    fun resume() {
        if (!built) return
        scope.launch { if (connect()) purchases().forEach { confirm(it) } }
    }

    fun close() = client.endConnection()

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingResponseCode.OK -> scope.launch { purchases.orEmpty().forEach { confirm(it) }; busy = false }
            BillingResponseCode.USER_CANCELED -> busy = false
            // Bought before but not yet confirmed here.
            BillingResponseCode.ITEM_ALREADY_OWNED -> scope.launch { purchases().forEach { confirm(it) }; busy = false }
            else -> { busy = false; note = "The purchase didn't go through." }
        }
    }

    /** Only the server's "granted" counts; then the purchase is consumed. */
    private suspend fun confirm(p: Purchase) {
        if (PRODUCT !in p.products) return
        if (p.purchaseState == Purchase.PurchaseState.PENDING) { busy = false; note = "Your payment is pending with Google Play. Plus opens once it goes through."; return }
        if (p.purchaseState != Purchase.PurchaseState.PURCHASED) return
        when (community.playVerify(p.purchaseToken, PRODUCT)) {
            "granted" -> { consume(p.purchaseToken); busy = false; note = "Plus is on for a year. Thank you."; onGranted() }
            "pending" -> { busy = false; note = "Your payment is pending with Google Play. Plus opens once it goes through." }
            else -> { busy = false; note = "We couldn't confirm the purchase yet. We'll check again next time you open Plus." }
        }
    }

    private suspend fun connect(): Boolean {
        if (client.isReady) return true
        return suspendCancellableCoroutine { c ->
            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(result: BillingResult) { if (c.isActive) c.resume(result.responseCode == BillingResponseCode.OK) }
                override fun onBillingServiceDisconnected() { if (c.isActive) c.resume(false) }
            })
        }
    }

    private suspend fun details(): ProductDetails? = suspendCancellableCoroutine { c ->
        val product = QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT).setProductType(ProductType.INAPP).build()
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(listOf(product)).build()) { r, found ->
            c.resume(if (r.responseCode == BillingResponseCode.OK) found.productDetailsList.firstOrNull() else null)
        }
    }

    private suspend fun purchases(): List<Purchase> = suspendCancellableCoroutine { c ->
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(ProductType.INAPP).build()) { r, list ->
            c.resume(if (r.responseCode == BillingResponseCode.OK) list else emptyList())
        }
    }

    private suspend fun consume(token: String): Boolean = suspendCancellableCoroutine { c ->
        client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(token).build()) { r, _ -> c.resume(r.responseCode == BillingResponseCode.OK) }
    }

    private fun sha256(s: String) = MessageDigest.getInstance("SHA-256").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }
}
