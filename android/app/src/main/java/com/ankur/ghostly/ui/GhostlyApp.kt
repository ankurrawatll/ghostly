package com.ankur.ghostly.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ankur.ghostly.ai.HybridAIEngine

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GhostlyApp(
    engine: HybridAIEngine,
    onToggleFloatingBubble: () -> Unit = {},
    onToggleDeskStandKeepAwake: (Boolean) -> Unit = {}
) {
    val localState by engine.localState.collectAsState()
    val battlecard by engine.activeBattlecard.collectAsState()
    val auditLog by engine.egressAuditLog.collectAsState()

    var isDeskStandMode by remember { mutableStateOf(false) }

    LaunchedEffect(isDeskStandMode) {
        onToggleDeskStandKeepAwake(isDeskStandMode)
    }

    if (isDeskStandMode) {
        // High-Visibility Desk Stand View (Readable from 2 feet away on a desk stand)
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFF07080B)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
            ) {
                // Header with Exit Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .background(Color(0xFF10B981), RoundedCornerShape(5.dp))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Desk Stand Companion",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    AssistChip(
                        onClick = { isDeskStandMode = false },
                        label = { Text("Exit Stand Mode", color = Color(0xFFE2E8F0)) },
                        leadingIcon = {
                            Icon(Icons.Default.Close, contentDescription = "Exit", tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Big Talk-to-Listen Meter
                Text("Meeting Balance", color = Color(0xFF94A3B8), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { localState.talkRatio },
                    modifier = Modifier.fillMaxWidth().height(16.dp),
                    color = Color(0xFF10B981),
                    trackColor = Color(0xFF334155)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("You: ${(localState.talkRatio * 100).toInt()}%", color = Color(0xFF34D399), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("Them: ${((1 - localState.talkRatio) * 100).toInt()}%", color = Color(0xFFA78BFA), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(32.dp))

                // High-Contrast Large Type Tactical Battlecard
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF16152B)),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth().weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            battlecard?.headline ?: "⚡ LISTENING ON-DEVICE",
                            color = Color(0xFFC084FC),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "SAY THIS RIGHT NOW:",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            battlecard?.counterMove ?: "\"Anchor on verified 99.99% uptime and zero-cost onboarding. Offer 10% multi-year lock instead of cash discount.\"",
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            lineHeight = 32.sp
                        )
                    }
                }
            }
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Shield,
                            contentDescription = "Shield",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("GhostWing Pocket", fontWeight = FontWeight.Bold)
                    }
                },
                actions = {
                    AssistChip(
                        onClick = { },
                        label = { Text("0 B Raw Egress", color = Color(0xFF10B981)) },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = "Lock", tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                        }
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF0B0F17)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Action Buttons: Floating Bubble & Desk Stand Mode
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onToggleFloatingBubble,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("🎈 Float Over Meet", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = { isDeskStandMode = true },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF34D399)),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.PhoneAndroid, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("☕ Desk Stand", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Live Status Banner
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Engine Telemetry", color = Color(0xFF94A3B8), fontSize = 12.sp)
                        Text("🟢 Nano 4 Local Active", color = Color(0xFF10B981), fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Talk-to-Listen Ratio", color = Color.White, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { localState.talkRatio },
                        modifier = Modifier.fillMaxWidth().height(8.dp),
                        color = Color(0xFF3B82F6),
                        trackColor = Color(0xFF334155)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("You: ${(localState.talkRatio * 100).toInt()}%", color = Color(0xFF94A3B8), fontSize = 11.sp)
                        Text("Them: ${((1 - localState.talkRatio) * 100).toInt()}%", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tactical Battlecard (Surfaced on high-stakes trigger)
            battlecard?.let { card ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(card.headline, color = Color(0xFFA78BFA), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("☁️ ${card.latencyMs}ms", color = Color(0xFFC084FC), fontSize = 12.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(card.counterMove, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Rule: ${card.sourceRule}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Air-Gap Network Egress Audit Log
            Text("Air-Gap Network Inspector", color = Color(0xFF94A3B8), fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(Color(0xFF111827), RoundedCornerShape(8.dp))
                    .padding(8.dp)
            ) {
                items(auditLog.size) { index ->
                    val entry = auditLog[index]
                    Column(modifier = Modifier.padding(vertical = 4.dp)) {
                        Text(
                            "☁️ Egress: \"${entry.optString("sanitizedQuery")}\"",
                            color = Color(0xFF38BDF8),
                            fontSize = 12.sp
                        )
                        Text(
                            "Payload: ${entry.optInt("bytesUploaded")} bytes • Zero raw audio/transcript",
                            color = Color(0xFF64748B),
                            fontSize = 10.sp
                        )
                    }
                }
                if (auditLog.isEmpty()) {
                    item {
                        Text("0 bytes uploaded. All speech processed locally.", color = Color(0xFF64748B), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
