// Offscreen audio capture document
console.log('GhostWing audio offscreen initialized.');

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'START_RECORDING') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      console.log('Offscreen audio stream captured successfully:', stream.id);
    } catch (e) {
      console.error('Failed to capture audio stream offscreen:', e);
    }
  }
});
