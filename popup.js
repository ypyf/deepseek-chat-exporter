/**
 * DeepSeek Chat Exporter - Popup Script
 */

document.addEventListener('DOMContentLoaded', function() {
  // 加载国际化文本
  loadI18nText();
});

/**
 * 加载国际化文本
 */
function loadI18nText() {
  // 设置标题和描述
  document.getElementById('title').textContent = chrome.i18n.getMessage('extName') || 'DeepSeek Chat ConversationsExporter';
  document.getElementById('description').textContent = chrome.i18n.getMessage('extDescription') || 'Export your DeepSeek chat conversations in various formats.';

  // 设置支持作者文案
  const supportLink = document.querySelector('.support-link');
  if (supportLink) {
    supportLink.textContent = chrome.i18n.getMessage('supportAuthor') || 'Support Us';
  }
}
