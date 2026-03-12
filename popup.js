/**
 * DeepSeek Chat Exporter - Popup Script
 */

const SETTINGS_DEFAULTS = {
  autoExport: false,
  notifyNewMessages: true,
  exportWebReferences: false
};

document.addEventListener('DOMContentLoaded', function() {
  loadI18nText();
  initSettings();
});

function loadI18nText() {
  document.getElementById('title').textContent = chrome.i18n.getMessage('extName') || 'DeepSeek Chat ConversationsExporter';
  document.getElementById('description').textContent = chrome.i18n.getMessage('extDescription') || 'Export your DeepSeek chat conversations in various formats.';

  const supportLink = document.querySelector('.support-link');
  if (supportLink) {
    supportLink.textContent = chrome.i18n.getMessage('supportAuthor') || 'Support Us';
  }

  const markdownReferenceLabel = document.getElementById('markdown-reference-label');
  if (markdownReferenceLabel) {
    markdownReferenceLabel.textContent = chrome.i18n.getMessage('settingMarkdownReferencesLabel') || 'Include web references in export';
  }

}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      const saved = result && result.settings ? result.settings : {};
      const exportWebReferences = typeof saved.exportWebReferences === 'boolean'
        ? saved.exportWebReferences
        : !!saved.exportMarkdownReferences;
      resolve({
        ...SETTINGS_DEFAULTS,
        ...saved,
        exportWebReferences
      });
    });
  });
}

function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, resolve);
  });
}

async function initSettings() {
  const toggle = document.getElementById('markdown-reference-toggle');
  if (!toggle) return;

  const settings = await getSettings();
  toggle.checked = !!settings.exportWebReferences;

  toggle.addEventListener('change', async () => {
    const latestSettings = await getSettings();
    await saveSettings({
      ...latestSettings,
      exportWebReferences: toggle.checked
    });
  });
}
