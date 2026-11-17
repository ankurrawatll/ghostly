package com.ankur.ghostly

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.ankur.ghostly.ai.HybridAIEngine
import com.ankur.ghostly.service.FloatingBubbleService
import com.ankur.ghostly.ui.GhostlyApp

class MainActivity : ComponentActivity() {
    private lateinit var hybridEngine: HybridAIEngine
    private var isBubbleRunning = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hybridEngine = HybridAIEngine(this)

        setContent {
            GhostlyApp(
                engine = hybridEngine,
                onToggleFloatingBubble = { toggleFloatingBubble() },
                onToggleDeskStandKeepAwake = { keepAwake ->
                    if (keepAwake) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        Toast.makeText(this, "Screen Keep-Awake Enabled for Desk Stand", Toast.LENGTH_SHORT).show()
                    } else {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                }
            )
        }
    }

    private fun toggleFloatingBubble() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "Please enable 'Display over other apps' to float over Google Meet", Toast.LENGTH_LONG).show()
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            return
        }

        val serviceIntent = Intent(this, FloatingBubbleService::class.java)
        if (!isBubbleRunning) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
            isBubbleRunning = true
            Toast.makeText(this, "GhostWing Bubble Active • Switch to Google Meet / Zoom", Toast.LENGTH_LONG).show()
        } else {
            stopService(serviceIntent)
            isBubbleRunning = false
            Toast.makeText(this, "Floating Bubble Closed", Toast.LENGTH_SHORT).show()
        }
    }
}
