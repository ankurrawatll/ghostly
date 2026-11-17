package com.ankur.ghostly.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

/**
 * FloatingBubbleService provides a system-level floating heads-up display (HUD)
 * that hovers over Google Meet, Zoom, or phone calls on Android.
 * Zero app-switching required during live client negotiations.
 */
class FloatingBubbleService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var isExpanded = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundServiceNotification()
        setupFloatingView()
    }

    private fun startForegroundServiceNotification() {
        val channelId = "ghostwing_overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "GhostWing Live Meeting Overlay",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("GhostWing Live Overlay Active")
            .setContentText("Hovering over meeting • 0 B Raw Audio Egress")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        startForeground(1001, notification)
    }

    private fun setupFloatingView() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 50
            y = 200
        }

        // Create Container
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 16, 16, 16)
        }

        // Circular Floating Bubble (Icon)
        val bubble = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1C152B"))
            val radius = 100f
            val shape = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#1C152B"))
                setStroke(4, Color.parseColor("#A855F7"))
                cornerRadius = radius
            }
            background = shape
            setPadding(24, 24, 24, 24)
        }

        val iconText = TextView(this).apply {
            text = "⚡"
            textSize = 20f
            gravity = Gravity.CENTER
        }
        bubble.addView(iconText)

        // Expanded Battlecard Card View
        val cardLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            val cardShape = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#0F111A"))
                setStroke(3, Color.parseColor("#A855F7"))
                cornerRadius = 32f
            }
            background = cardShape
            setPadding(32, 28, 32, 28)
        }

        val badge = TextView(this).apply {
            text = "⚡ COMPETITOR DISCOUNT DEFENSE"
            setTextColor(Color.parseColor("#E879F9"))
            textSize = 10f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }

        val spokenCounter = TextView(this).apply {
            text = "\"Anchor on verified 99.99% uptime and zero-cost onboarding. Offer 10% multi-year lock instead.\""
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, 12, 0, 12)
        }

        val egressProof = TextView(this).apply {
            text = "🟢 Nano 4 On-Device (45ms) • 0 B Raw Speech Upload"
            setTextColor(Color.parseColor("#34D399"))
            textSize = 10f
        }

        val closeBtn = TextView(this).apply {
            text = "Tap to Minimize"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 11f
            gravity = Gravity.END
            setPadding(0, 8, 0, 0)
        }

        cardLayout.addView(badge)
        cardLayout.addView(spokenCounter)
        cardLayout.addView(egressProof)
        cardLayout.addView(closeBtn)

        rootLayout.addView(bubble)
        rootLayout.addView(cardLayout)

        // Touch listener for smooth dragging across screen & tapping to expand
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isClick = true

        bubble.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isClick = true
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = (event.rawX - initialTouchX).toInt()
                    val deltaY = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                        isClick = false
                    }
                    params.x = initialX + deltaX
                    params.y = initialY + deltaY
                    windowManager?.updateViewLayout(rootLayout, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (isClick) {
                        isExpanded = !isExpanded
                        cardLayout.visibility = if (isExpanded) View.VISIBLE else View.GONE
                        windowManager?.updateViewLayout(rootLayout, params)
                    }
                    true
                }
                else -> false
            }
        }

        cardLayout.setOnClickListener {
            isExpanded = false
            cardLayout.visibility = View.GONE
            windowManager?.updateViewLayout(rootLayout, params)
        }

        floatingView = rootLayout
        windowManager?.addView(rootLayout, params)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (floatingView != null) {
            windowManager?.removeView(floatingView)
            floatingView = null
        }
    }
}
