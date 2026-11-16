package com.ankur.ghostly

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.ankur.ghostly.ai.HybridAIEngine
import com.ankur.ghostly.ui.GhostlyApp

class MainActivity : ComponentActivity() {
    private lateinit var hybridEngine: HybridAIEngine

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hybridEngine = HybridAIEngine(this)

        setContent {
            GhostlyApp(hybridEngine)
        }
    }
}
