// Chrome Extension Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('GhostWing extension installed.');
  // Set side panel behavior to open on action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('sidePanel.setPanelBehavior error:', err);
    });
  }
});

// Manage Offscreen Document for audio capture if needed
async function setupOffscreenDocument(path: string) {
  if (chrome.offscreen) {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
    });
    if (existingContexts.length > 0) {
      return;
    }
    await chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.USER_MEDIA, chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Capturing live meeting tab audio in memory for local transcription.'
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_AUDIO_CAPTURE') {
    setupOffscreenDocument('offscreen.html').then(() => {
      sendResponse({ status: 'offscreen_ready' });
    });
    return true;
  }
});
