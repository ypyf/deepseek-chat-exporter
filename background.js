/**
 * DeepSeek Chat Exporter - Background Script
 *
 * This script runs in the background and handles extension-level functionality.
 */

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('DeepSeek Chat Exporter installed');

    // Initialize storage
    chrome.storage.local.set({
      chatData: {},
      settings: {
        autoExport: false,
        notifyNewMessages: true
      }
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'newMessagesDetected') {
    // Could implement notifications or badge updates here
    console.log('New messages detected in chat');
    sendResponse({ status: 'acknowledged' });
  }

  // Always return true for async response
  return true;
});
