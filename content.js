/**
 * DeepSeek Chat Exporter - Content Script
 *
 * This script monitors the DeepSeek chat interface, extracts messages,
 * and provides functionality to export conversations as JSON.
 */

/**
 * Check if the current page is a DeepSeek chat page
 * @returns {boolean} True if the page is a DeepSeek chat page
 */
function isDeepSeekChatPage() {
  const url = window.location.href;
  const domain = new URL(url).hostname;
  return domain === 'chat.deepseek.com';
}

const SETTINGS_DEFAULTS = {
  autoExport: false,
  notifyNewMessages: true,
  exportWebReferences: false
};

/**
 * Initialize the extension
 */
function init() {
    // 检查是否是DeepSeek聊天页面
    if (!isDeepSeekChatPage()) {
      return;
    }
    // 注入导出按钮
    try {
      injectExportButton();
    } catch (error) {
      console.error('Error injecting export button:', error);
    }
}

/**
 * Inject the export button with dropdown menu into the page
 */
function injectExportButton() {
  // Check if button already exists
  if (document.getElementById('deepseek-export-btn')) {
    return;
  }

  // Create container for the button and dropdown
  const container = document.createElement('div');
  container.id = 'deepseek-export-container';
  container.className = 'deepseek-export-container';

  // Create the main export button
  const exportButton = document.createElement('button');
  exportButton.id = 'deepseek-export-btn';
  exportButton.className = 'deepseek-export-btn';

  // 添加文本和箭头图标
  const buttonText = document.createElement('span');
  buttonText.textContent = chrome.i18n.getMessage('exportButtonText') || 'Export Chat';

  // 创建 SVG 箭头图标 - 使用用户提供的SVG
  const arrowIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowIcon.classList.add('arrow-icon');
  arrowIcon.setAttribute('viewBox', '0 0 24 24');
  arrowIcon.setAttribute('fill', 'none');
  arrowIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 15.5L7 10.5L8.41 9.09L12 12.67L15.59 9.09L17 10.5L12 15.5Z');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('stroke-linejoin', 'round');

  arrowIcon.appendChild(path);

  // 将文本和图标添加到按钮
  exportButton.appendChild(buttonText);
  exportButton.appendChild(arrowIcon);

  // Create the dropdown menu
  const dropdownMenu = document.createElement('div');
  dropdownMenu.id = 'deepseek-export-dropdown';
  dropdownMenu.className = 'deepseek-export-dropdown';
  dropdownMenu.style.display = 'none';

  // Create export as JSON option
  const jsonOption = document.createElement('div');
  jsonOption.className = 'deepseek-export-option';

  // 添加JSON选项的emoji图标和文本容器
  const jsonIconSpan = document.createElement('span');
  jsonIconSpan.className = 'option-icon';
  jsonIconSpan.textContent = '📄 ';

  const jsonTextSpan = document.createElement('span');
  jsonTextSpan.className = 'option-text';
  jsonTextSpan.textContent = chrome.i18n.getMessage('exportAsJSON') || 'Export as JSON';

  jsonOption.appendChild(jsonIconSpan);
  jsonOption.appendChild(jsonTextSpan);

  jsonOption.addEventListener('click', (e) => {
    e.stopPropagation();
    exportChat('json');
    dropdownMenu.style.display = 'none';
  });

  // Create export as Markdown option
  const markdownOption = document.createElement('div');
  markdownOption.className = 'deepseek-export-option';

  // 添加Markdown选项的emoji图标和文本容器
  const markdownIconSpan = document.createElement('span');
  markdownIconSpan.className = 'option-icon';
  markdownIconSpan.textContent = '📝 ';

  const markdownTextSpan = document.createElement('span');
  markdownTextSpan.className = 'option-text';
  markdownTextSpan.textContent = chrome.i18n.getMessage('exportAsMarkdown') || 'Export as Markdown';

  markdownOption.appendChild(markdownIconSpan);
  markdownOption.appendChild(markdownTextSpan);

  markdownOption.addEventListener('click', (e) => {
    e.stopPropagation();
    exportChat('markdown');
    dropdownMenu.style.display = 'none';
  });

  // Create export as Text option
  const textOption = document.createElement('div');
  textOption.className = 'deepseek-export-option';

  // 添加Text选项的emoji图标和文本容器
  const textIconSpan = document.createElement('span');
  textIconSpan.className = 'option-icon';
  textIconSpan.textContent = '📃 ';

  const textTextSpan = document.createElement('span');
  textTextSpan.className = 'option-text';
  textTextSpan.textContent = chrome.i18n.getMessage('exportAsText') || 'Export as Plain Text';

  textOption.appendChild(textIconSpan);
  textOption.appendChild(textTextSpan);

  textOption.addEventListener('click', (e) => {
    e.stopPropagation();
    exportChat('text');
    dropdownMenu.style.display = 'none';
  });

  // Create export as HTML option
  const htmlOption = document.createElement('div');
  htmlOption.className = 'deepseek-export-option';

  // 添加HTML选项的emoji图标和文本容器
  const htmlIconSpan = document.createElement('span');
  htmlIconSpan.className = 'option-icon';
  htmlIconSpan.textContent = '🌐 ';

  const htmlTextSpan = document.createElement('span');
  htmlTextSpan.className = 'option-text';
  htmlTextSpan.textContent = chrome.i18n.getMessage('exportAsHTML') || 'Export as HTML';

  htmlOption.appendChild(htmlIconSpan);
  htmlOption.appendChild(htmlTextSpan);

  htmlOption.addEventListener('click', (e) => {
    e.stopPropagation();
    exportChat('html');
    dropdownMenu.style.display = 'none';
  });

  // Add options to dropdown menu
  dropdownMenu.appendChild(jsonOption);
  dropdownMenu.appendChild(markdownOption);
  dropdownMenu.appendChild(textOption);
  dropdownMenu.appendChild(htmlOption);

  // Toggle dropdown menu when clicking the export button
  exportButton.addEventListener('click', (event) => {
    event.stopPropagation(); // 阻止事件冒泡
    const isVisible = dropdownMenu.style.display === 'block';
    dropdownMenu.style.display = isVisible ? 'none' : 'block';

    const arrowIcon = exportButton.querySelector('.arrow-icon');
    if (arrowIcon) {
      arrowIcon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
    }

  });

  // Prevent dropdown clicks from closing the dropdown
  dropdownMenu.addEventListener('click', (event) => {
    event.stopPropagation(); // 阻止事件冒泡
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    if (dropdownMenu.style.display === 'block') {
      dropdownMenu.style.display = 'none';

      // 恢复箭头图标方向
      const arrowIcon = exportButton.querySelector('.arrow-icon');
      if (arrowIcon) {
        arrowIcon.style.transform = 'rotate(0deg)';
      }

    }
  });

  // Add button and dropdown to container
  container.appendChild(exportButton);
  container.appendChild(dropdownMenu);

  // Remove any existing containers with the same ID to avoid conflicts
  const existingContainer = document.getElementById('deepseek-export-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Add container to page
  document.body.appendChild(container);

  // Add CSS styles for the dropdown
  addExportStyles();
}

/**
 * Add CSS styles for the export button and dropdown
 */
function addExportStyles() {
  // Check if styles already exist
  if (document.getElementById('deepseek-export-styles')) {
    return;
  }

  // Create a link element to load the external CSS file
  const link = document.createElement('link');
  link.id = 'deepseek-export-styles';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL('styles.css');

  // Add the link to the document head
  document.head.appendChild(link);
}

/**
 * Find the main scrollable container for the chat
 * @returns {Element|null}
 */
function getChatScrollContainer() {
  // Try known DeepSeek selectors first
  const candidates = [
    document.querySelector('.dad65929'),
    document.querySelector('.e1f93b07'),
    document.querySelector('[class*="chat"][class*="container"]'),
    document.querySelector('[class*="conversation"]'),
  ];
  for (const el of candidates) {
    if (el && el.scrollHeight > el.clientHeight) return el;
  }
  // Fallback: walk up from first message element
  const firstMsg = document.querySelector('.ds-message');
  if (firstMsg) {
    let node = firstMsg.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      ) {
        return node;
      }
      node = node.parentElement;
    }
  }
  // Last resort: body or documentElement
  if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
    return document.documentElement;
  }
  return document.body;
}

/**
 * Scroll through the entire chat to force virtual-list rendering of all messages.
 * Strategy: scroll to bottom first, then scroll back to top and stop there.
 * This ensures the oldest messages (top) are in the DOM when we extract.
 * @returns {Promise<void>}
 */
function scrollToRevealAll() {
  return new Promise((resolve) => {
    const container = getChatScrollContainer();
    if (!container) {
      resolve();
      return;
    }

    const STEP_DELAY = 200;   // ms between scroll steps
    const TOTAL_TIMEOUT = 20000; // max 20s
    const startTime = Date.now();

    // Phase 1: scroll to bottom to load recent messages
    container.scrollTop = container.scrollHeight;

    setTimeout(function scrollDown() {
      if (Date.now() - startTime > TOTAL_TIMEOUT) {
        // Timed out during scroll-down, still try scroll-up
        scrollUpToTop();
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        // Reached bottom, now scroll back up
        setTimeout(scrollUpToTop, 300);
        return;
      }
      container.scrollTop = scrollTop + clientHeight * 0.8;
      setTimeout(scrollDown, STEP_DELAY);
    }, 300);

    // Phase 2: scroll back to top so oldest messages are rendered
    function scrollUpToTop() {
      const upStart = Date.now();
      function scrollUp() {
        if (Date.now() - upStart > TOTAL_TIMEOUT) {
          resolve();
          return;
        }
        const { scrollTop, clientHeight } = container;
        if (scrollTop <= 10) {
          // Reached top - wait for render then resolve
          setTimeout(resolve, 400);
          return;
        }
        container.scrollTop = Math.max(0, scrollTop - clientHeight * 0.8);
        setTimeout(scrollUp, STEP_DELAY);
      }
      scrollUp();
    }
  });
}

function showExportingOverlay(message) {
  if (document.getElementById('deepseek-export-loading')) return;
  const overlay = document.createElement('div');
  overlay.id = 'deepseek-export-loading';
  const box = document.createElement('div');
  box.className = 'deepseek-export-loading-box';
  const spinner = document.createElement('div');
  spinner.className = 'deepseek-export-loading-spinner';
  const text = document.createElement('div');
  text.className = 'deepseek-export-loading-text';
  text.id = 'deepseek-export-loading-text';
  text.textContent = message || chrome.i18n.getMessage('exportingLoading') || 'Preparing export…';
  box.appendChild(spinner);
  box.appendChild(text);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function updateExportingOverlay(message) {
  const el = document.getElementById('deepseek-export-loading-text');
  if (el) el.textContent = message;
}

function hideExportingOverlay() {
  const el = document.getElementById('deepseek-export-loading');
  if (el) el.remove();
}

/**
 * Export the chat to a file in the specified format
 * @param {string} format - The format to export ('json', 'markdown', or 'text')
 */
async function exportChat(format) {
  showExportingOverlay(chrome.i18n.getMessage('exportingScrolling') || 'Loading all messages…');
  try {
    await scrollToRevealAll();
    updateExportingOverlay(chrome.i18n.getMessage('exportingProcessing') || 'Processing…');
    await waitForDiagramBlocksReady();
    await prepareDiagramCodeBlocks();
    const settings = await getSettings();
    const {title, messages} = extractAllMessagesFromPage();
    hideExportingOverlay();
    if (!Array.isArray(messages) || messages.length === 0) {
      alert(chrome.i18n.getMessage('noMessagesFound'));
      return;
    }

    const exportData = {
      title: title,
      url: window.location.href,
      date: new Date().toISOString(),
      messages: messages
    };
    downloadChat(exportData, format, settings);
  } catch (error) {
    hideExportingOverlay();
    console.error('Error during export:', error);
    alert(chrome.i18n.getMessage('exportError'));
  }
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result && result.settings ? result.settings : {};
      const exportWebReferences = typeof settings.exportWebReferences === 'boolean'
        ? settings.exportWebReferences
        : !!settings.exportMarkdownReferences;
      resolve({
        ...SETTINGS_DEFAULTS,
        ...settings,
        exportWebReferences
      });
    });
  });
}

function removeReferenceMarkers(text) {
  return String(text ?? '').replace(/\[\^\d+\]/g, '');
}

function waitForBlockCodeReady(block, timeoutMs = 2500) {
  const getPreText = () => (block.querySelector('pre')?.textContent || '').trim();
  if (getPreText()) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let settled = false;
    let observer = null;
    let timerId = null;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      if (observer) observer.disconnect();
      resolve(ok);
    };
    observer = new MutationObserver(() => {
      if (getPreText()) done(true);
    });
    observer.observe(block, { childList: true, subtree: true, characterData: true });
    timerId = window.setTimeout(() => done(!!getPreText()), timeoutMs);
  });
}

function triggerTab(tab) {
  if (!tab) return;
  try {
    tab.click();
  } catch (e) {}
  const events = ['pointerdown', 'mousedown', 'mouseup', 'click'];
  events.forEach(type => {
    try {
      tab.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    } catch (e) {}
  });
}

function waitForBlockChartReady(block, timeoutMs = 2500) {
  const hasChart = () => !!block.querySelector('svg.mermaid-svg, .mermaid-svg');
  if (hasChart()) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let settled = false;
    let observer = null;
    let timerId = null;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      if (observer) observer.disconnect();
      resolve(ok);
    };
    observer = new MutationObserver(() => {
      if (hasChart()) done(true);
    });
    observer.observe(block, { childList: true, subtree: true, characterData: true });
    timerId = window.setTimeout(() => done(hasChart()), timeoutMs);
  });
}

async function prepareDiagramCodeBlocks() {
  const blocks = Array.from(document.querySelectorAll('.md-code-block')).filter(isDiagramCodeBlock);
  const tasks = blocks.map(async (block) => {
    const tabs = Array.from(block.querySelectorAll('[role="tab"]'));
    const selectedTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true' || tab.classList.contains('ds-segmented-button--selected')) || null;
    const selectedText = (selectedTab?.textContent || '').trim();
    const chartTab = tabs.find(tab => /图表|diagram/i.test((tab.textContent || '').trim()));
    const codeTab = tabs.find(tab => /代码|code/i.test((tab.textContent || '').trim()));
    let preText = (block.querySelector('pre')?.textContent || '').trim();
    const chartWasSelected = /图表|diagram/i.test(selectedText);

    if (!preText && codeTab) {
      const selected = codeTab.getAttribute('aria-selected') === 'true' || codeTab.classList.contains('ds-segmented-button--selected');
      if (!selected) {
        triggerTab(codeTab);
      }
      await waitForBlockCodeReady(block);
      preText = (block.querySelector('pre')?.textContent || '').trim();
    }

    if (preText) {
      block.setAttribute('data-export-code', preText);
      const langText = (block.querySelector('.d813de27')?.textContent || '').trim();
      if (langText) {
        block.setAttribute('data-export-lang', langText);
      }
    }

    if (chartTab && chartWasSelected) {
      triggerTab(chartTab);
      await waitForBlockChartReady(block);
    } else if (selectedTab) {
      triggerTab(selectedTab);
    }
  });
  await Promise.all(tasks);
}

function isDiagramCodeBlock(block) {
  if (!(block instanceof HTMLElement)) return false;
  const tabText = (block.querySelector('[role="tablist"]')?.textContent || '').trim();
  if (/图表|diagram|mermaid/i.test(tabText)) return true;
  if (block.querySelector('svg.mermaid-svg, .mermaid-svg')) return true;
  const preText = (block.querySelector('pre')?.textContent || '').trim();
  if (/(^|\n)\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|gitGraph)\b/i.test(preText)) {
    return true;
  }
  return false;
}

function isDiagramCodeBlockReady(block) {
  if (block.querySelector('.ds-loading')) return false;
  const preText = (block.querySelector('pre')?.textContent || '').trim();
  if (preText) return true;
  if (block.querySelector('svg.mermaid-svg, .mermaid-svg')) return true;
  return false;
}

function getDiagramBlockStatus() {
  const allBlocks = Array.from(document.querySelectorAll('.md-code-block'));
  const diagramBlocks = allBlocks.filter(isDiagramCodeBlock);
  const readyCount = diagramBlocks.filter(isDiagramCodeBlockReady).length;
  return {
    total: diagramBlocks.length,
    readyCount,
    ready: diagramBlocks.length === 0 || readyCount === diagramBlocks.length
  };
}

function waitForDiagramBlocksReady(timeoutMs = 10000) {
  const initialStatus = getDiagramBlockStatus();
  if (initialStatus.ready) {
    return Promise.resolve(initialStatus);
  }
  return new Promise((resolve) => {
    let settled = false;
    let observer = null;
    let timerId = null;
    const finalize = (status) => {
      if (settled) return;
      settled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      if (observer) observer.disconnect();
      resolve(status);
    };

    const check = () => {
      const status = getDiagramBlockStatus();
      if (status.ready) {
        finalize(status);
      }
    };

    observer = new MutationObserver(() => {
      check();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    timerId = window.setTimeout(() => {
      const status = getDiagramBlockStatus();
      status.timedOut = true;
      finalize(status);
    }, timeoutMs);
  });
}

/**
 * Download chat data as a file in the specified format
 * @param {Object} exportData - The data to export
 * @param {string} format - The format to export ('json', 'markdown', 'text', or 'html')
 */
function downloadChat(exportData, format, settings) {
  try {
    const formattedData = {
      title: exportData.title,
      url: exportData.url,
      date: exportData.date,
      messages: exportData.messages.map(msg => {
        const formattedMsg = {
          role: msg.role,
          content: msg.content,
        };
        if (msg.role === 'user' && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
          formattedMsg.attachments = msg.attachments;
        }
        if (msg.role === 'assistant' && msg.chain_of_thought) {
          formattedMsg.chain_of_thought = msg.chain_of_thought;
        }
        return formattedMsg;
      })
    };

    let blob, filename;
    const rawTitle = (formattedData.title || '').trim() || getDefaultConversationTitle();
    const safeTitle = typeof sanitizeFilename === 'function'
      ? sanitizeFilename(rawTitle)
      : rawTitle.replace(/[/\\?%*:|"<>]/g, '-');

    if (format === 'markdown') {
      const markdownContent = convertToMarkdown(formattedData, settings);
      blob = new Blob([markdownContent], { type: 'text/markdown' });
      contentType = 'text/markdown';
      filename = `${safeTitle}.md`;
    } else if (format === 'text') {
      const textContent = convertToPlainText(formattedData, settings);
      blob = new Blob([textContent], { type: 'text/plain' });
      contentType = 'text/plain';
      filename = `${safeTitle}.txt`;
    } else if (format === 'html') {
      const htmlContent = convertToHTML(formattedData, settings);
      blob = new Blob([htmlContent], { type: 'text/html' });
      contentType = 'text/html';
      filename = `${safeTitle}.html`;
    } else {
      const jsonContent = convertToJSON(formattedData, settings);
      blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
      contentType = 'application/json';
      filename = `${safeTitle}.json`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 50);

    const exportButton = document.getElementById('deepseek-export-btn');
    if (exportButton) {
      exportButton.classList.add('pulse');
      setTimeout(() => exportButton.classList.remove('pulse'), 300);
    }

  } catch (error) {
    console.error('Error exporting chat:', error);
    alert(chrome.i18n.getMessage('exportFailed'));
  }
}

/**
 * 从 KaTeX 渲染的 DOM 中提取 TeX 源码并转换为 Markdown
 * @param {NodeListOf<Element> | Element[]} domElements - TeX注释节点集合
 * @param {HTMLElement} katexElement - KaTeX DOM元素，用于判断是块级还是行内
 * @returns {string} 转换后的 Markdown 文本
 */
function texToMarkdown(domElements, katexElement) {
  let content = '';

  domElements.forEach(node => {
    const tex = node.textContent.trim();
    // 把包含该 annotation 的最外层 KaTeX 节点替换为 TeX
    const katexSpan = node.closest('span.katex') || node.parentElement;
    if (katexSpan) {
      content += tex;
    }
  });

  if (!content) {
    return '';
  }

  // 判断是块级还是行内数学公式
  let isBlock = false;
  if (katexElement) {
    try {
      // 首先检查是否在行内上下文中（标题、链接、强调等）
      let isInlineContext = false;
      let current = katexElement.parentElement;
      while (current) {
        const tagName = current.tagName.toLowerCase();
        // 如果在标题、链接、强调、代码等行内元素中，强制使用行内数学
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'b', 'em', 'i', 'code'].includes(tagName)) {
          isInlineContext = true;
          break;
        }
        current = current.parentElement;
      }

      if (isInlineContext) {
        isBlock = false;
      } else {
        const tagName = katexElement.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(katexElement);
        const display = computedStyle.display;

        // 如果不是span，或者display是block，则为块级
        if (tagName !== 'span' || display === 'block') {
          isBlock = true;
        } else {
          // 检查父元素上下文
          const parent = katexElement.parentElement;
          if (parent) {
            const parentTag = parent.tagName.toLowerCase();
            // 如果父元素是段落(p)，通常是行内
            // 如果父元素是div或其他块级元素，且KaTeX是主要内容，可能是块级
            if (parentTag !== 'p') {
              // 检查是否有其他非空文本兄弟节点
              const siblings = Array.from(parent.childNodes);
              const hasOtherContent = siblings.some(node =>
                node !== katexElement &&
                node.nodeType === Node.TEXT_NODE &&
                node.textContent.trim()
              );
              // 如果没有其他文本内容，可能是块级数学公式
              if (!hasOtherContent) {
                isBlock = true;
              }
            }
          }
        }
      }
    } catch (e) {
      // 如果无法获取样式，默认使用行内
      console.warn('Could not determine math display type:', e);
    }
  }

  if (isBlock) {
    return `$$${content}$$\n\n`;
  } else {
    // 行内数学公式使用 $...$
    return `$${content}$`;
  }
}

/**
 * 从Markdown转换的HTML代码块中提取语言和内容
 * @param {HTMLElement} domElement - 代码块的DOM元素
 * @returns {Object} 包含language和content的对象，如果提取失败则返回null
 */
function extractMarkdownCodeInfo(domElement) {
  try {
    const cachedCode = (domElement.getAttribute('data-export-code') || '').trim();
    const cachedLang = (domElement.getAttribute('data-export-lang') || '').trim();
    if (cachedCode) {
      return {
        language: cachedLang || (/^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|gitGraph)\b/i.test(cachedCode) ? 'mermaid' : ''),
        content: cachedCode
      };
    }

    const infoStringElement =
      domElement.querySelector('.d813de27') ||
      domElement.querySelector('[data-language]') ||
      domElement.querySelector('.md-code-block-banner-wrap [class*="language"]');
    let language = infoStringElement
      ? (infoStringElement.getAttribute('data-language') || infoStringElement.textContent || '').trim()
      : '';
    if (!language) {
      const bannerText = (domElement.querySelector('.md-code-block-banner-wrap')?.textContent || '').trim();
      if (bannerText && !/^(代码|code|图表|diagram)$/i.test(bannerText)) {
        language = bannerText.split(/\s+/)[0];
      }
    }
    const selectedTabText = (domElement.querySelector('[role="tab"][aria-selected="true"]')?.textContent || '').trim();
    const codeTabSelected = /代码|code/i.test(selectedTabText);
    const preElement = domElement.querySelector('pre');
    const preText = preElement ? (preElement.textContent || '').replace(/\u00A0/g, ' ').trim() : '';
    const mermaidSyntaxPattern = /(^|\n)\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|gitGraph)\b/i;

    if (preText) {
      if (!language && mermaidSyntaxPattern.test(preText)) {
        language = 'mermaid';
      }
      if (codeTabSelected || mermaidSyntaxPattern.test(preText)) {
        return {
          language: language || '',
          content: preText
        };
      }
    }

    const candidates = [];
    const addCandidate = (value) => {
      if (typeof value !== 'string') return;
      const normalized = value.replace(/\u00A0/g, ' ').trim();
      if (!normalized) return;
      candidates.push(normalized);
    };

    domElement.querySelectorAll('pre, code, textarea').forEach(el => {
      addCandidate(el.textContent || '');
      if (typeof el.value === 'string') {
        addCandidate(el.value);
      }
    });

    const maybeSource = domElement.querySelector('.mermaid');
    if (maybeSource) {
      addCandidate(maybeSource.textContent || '');
    }

    const uniqueCandidates = Array.from(new Set(candidates));
    const hasMermaidSvg = !!domElement.querySelector('svg.mermaid-svg, .mermaid-svg');
    const tabText = (domElement.querySelector('[role="tablist"]')?.textContent || '').trim();
    const preferMermaid = hasMermaidSvg || /图表|diagram|mermaid/i.test(tabText);
    const scoreCandidate = (value) => {
      let score = 0;
      if (value.includes('\n')) score += 10;
      if (/[{};]|-->|==>|subgraph|\bend\b/i.test(value)) score += 10;
      if (mermaidSyntaxPattern.test(value)) score += preferMermaid ? 80 : 30;
      if (/^<svg[\s>]/i.test(value) || /#mermaid-svg-|\.edgePath|flowchart-link/.test(value)) score -= 60;
      if (/diagram content unavailable/i.test(value)) score -= 100;
      score += Math.min(value.length, 400) / 20;
      return score;
    };

    uniqueCandidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
    let content = uniqueCandidates.length > 0 ? uniqueCandidates[0] : '';

    if (!content) {
      const svgTexts = Array.from(domElement.querySelectorAll('svg text, svg foreignObject, svg .nodeLabel, svg .edgeLabel'))
        .map(node => (node.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const uniqueSvgTexts = Array.from(new Set(svgTexts)).slice(0, 80);
      if (uniqueSvgTexts.length > 0) {
        if (preferMermaid) {
          content = `%% Mermaid source unavailable in DOM\n%% Diagram labels: ${uniqueSvgTexts.join(' | ')}`;
          if (!language) language = 'mermaid';
        } else {
          content = `[diagram]\n${uniqueSvgTexts.join(' ')}`;
          if (!language) language = 'diagram';
        }
      }
    }

    if (!content) {
      content = preferMermaid ? '%% Mermaid source unavailable in DOM' : '[diagram content unavailable]';
      if (!language) language = preferMermaid ? 'mermaid' : 'diagram';
    }

    if (!language && /(?:graph|flowchart|sequencediagram|classdiagram|statediagram|erdiagram|gantt|pie|mindmap|timeline|quadrantchart|gitgraph)/i.test(content)) {
      language = 'mermaid';
    }

    return {
      language,
      content
    };
  } catch (error) {
    console.error('Error extracting code block info:', error);
    return null;
  }
}

/**
 * 将语言和内容转换为Markdown格式的代码块
 * @param {string} language - 代码语言
 * @param {string} content - 代码内容
 * @returns {string} Markdown格式的代码块
 */
function generateMarkdownCode(language, content) {
  // 早期返回：检查输入是否为字符串
  if (typeof language !== 'string' || typeof content !== 'string') {
    console.error('Language and content must be strings');
    return '';
  }

  // 生成Markdown格式的代码块
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

/**
 * 将HTML表格转换为Markdown格式
 * @param {HTMLElement} tableElement - 表格DOM元素
 * @returns {string} 转换后的Markdown表格文本
 */
function convertTableToMarkdown(tableElement) {
  if (!tableElement || tableElement.nodeName.toLowerCase() !== 'table') {
    return '';
  }

  // 提取表头
  let headers = [];
  let skipFirstRow = false;
  const thead = tableElement.querySelector('thead');

  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      const thElements = headerRow.querySelectorAll('th, td');
      headers = Array.from(thElements).map(cell => {
        let content = '';
        for (const child of cell.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            content += domToMarkdown(child);
          } else if (child.nodeType === Node.TEXT_NODE) {
            content += child.textContent;
          }
        }
        // 处理管道符和换行符
        return content.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
      });
    }
  } else {
    // 如果没有thead，查找第一个tr作为表头
    const tbody = tableElement.querySelector('tbody');
    const firstRow = tbody ? tbody.querySelector('tr') : tableElement.querySelector('tr');

    if (firstRow) {
      skipFirstRow = true;
      const thElements = firstRow.querySelectorAll('th');
      if (thElements.length > 0) {
        headers = Array.from(thElements).map(cell => {
          let content = '';
          for (const child of cell.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              content += domToMarkdown(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
              content += child.textContent;
            }
          }
          return content.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
        });
      } else {
        // 如果第一行没有th，使用td作为表头
        const tdElements = firstRow.querySelectorAll('td');
        headers = Array.from(tdElements).map(cell => {
          let content = '';
          for (const child of cell.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              content += domToMarkdown(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
              content += child.textContent;
            }
          }
          return content.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
        });
      }
    }
  }

  if (headers.length === 0) {
    return '';
  }

  // 提取数据行
  const rows = [];
  const tbody = tableElement.querySelector('tbody');
  const rowElements = tbody ? tbody.querySelectorAll('tr') : tableElement.querySelectorAll('tr');

  Array.from(rowElements).forEach((row, index) => {
    // 如果第一行被用作表头，跳过它
    if (skipFirstRow && index === 0) {
      return;
    }

    const cells = row.querySelectorAll('td, th');
    const rowData = Array.from(cells).map(cell => {
      let content = '';
      for (const child of cell.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      // 处理管道符和换行符
      return content.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
    });

    // 确保行数据长度与表头一致
    while (rowData.length < headers.length) {
      rowData.push('');
    }
    if (rowData.length > 0) {
      rows.push(rowData.slice(0, headers.length));
    }
  });

  // 生成Markdown表格
  let markdown = '';

  // 表头行
  markdown += '| ' + headers.join(' | ') + ' |\n';

  // 分隔行
  markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

  // 数据行
  rows.forEach(row => {
    markdown += '| ' + row.join(' | ') + ' |\n';
  });

  return markdown + '\n';
}

/**
 * 将DOM元素转换为Markdown格式
 * @param {HTMLElement} domElement - 要转换的DOM元素
 * @returns {string} 转换后的Markdown文本
 */
function domToMarkdown(domElement) {
  // 检查输入是否为DOM元素
  if (!(domElement instanceof HTMLElement)) {
    return domElement;
  }

  // 直接处理代码块元素
  if (domElement.classList.contains('md-code-block')) {
    const codeInfo = extractMarkdownCodeInfo(domElement);
    if (codeInfo) {
      return generateMarkdownCode(codeInfo.language, codeInfo.content) + '\n\n';
    }
    return '';
  } else if (domElement.classList.contains('katex')) {
    const annotations = domElement.querySelectorAll('annotation[encoding="application/x-tex"]');
    return texToMarkdown(annotations, domElement);
  }

  const isWordLikeChar = (char) => /[0-9A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(char);

  const getNeighborInfo = (element, direction) => {
    let sibling = direction === 'left' ? element.previousSibling : element.nextSibling;
    while (sibling) {
      if (sibling.nodeType === Node.TEXT_NODE) {
        const raw = String(sibling.textContent || '');
        if (!raw) {
          sibling = direction === 'left' ? sibling.previousSibling : sibling.nextSibling;
          continue;
        }
        const normalized = raw.replace(/\u00A0/g, ' ');
        const trimmed = normalized.trim();
        if (!trimmed) {
          sibling = direction === 'left' ? sibling.previousSibling : sibling.nextSibling;
          continue;
        }
        const hasBoundarySpace = direction === 'left' ? /\s$/.test(normalized) : /^\s/.test(normalized);
        const char = direction === 'left' ? trimmed.charAt(trimmed.length - 1) : trimmed.charAt(0);
        return { char, hasBoundarySpace, nodeType: Node.TEXT_NODE, tagName: '' };
      }
      if (sibling.nodeType === Node.ELEMENT_NODE) {
        const text = String(sibling.textContent || '').replace(/\u00A0/g, ' ').trim();
        if (!text) {
          sibling = direction === 'left' ? sibling.previousSibling : sibling.nextSibling;
          continue;
        }
        const char = direction === 'left' ? text.charAt(text.length - 1) : text.charAt(0);
        const tagName = String(sibling.nodeName || '').toLowerCase();
        return { char, hasBoundarySpace: false, nodeType: Node.ELEMENT_NODE, tagName };
      }
      sibling = direction === 'left' ? sibling.previousSibling : sibling.nextSibling;
    }
    return { char: '', hasBoundarySpace: false, nodeType: null, tagName: '' };
  };

  const wrapInlineWithBoundarySpaces = (element, marker, rawText) => {
    const text = String(rawText || '').trim();
    if (!text) return '';
    const left = getNeighborInfo(element, 'left');
    const right = getNeighborInfo(element, 'right');
    const first = text.charAt(0);
    const last = text.charAt(text.length - 1);
    const leftBoundaryLike = isWordLikeChar(first) || /^[([{<（【《「『“‘]/.test(first);
    const rightBoundaryLike = isWordLikeChar(last) || /[)\]}>）】》」』”’'"`]/.test(last);
    const rightWillHandleBoundary =
      right.nodeType === Node.ELEMENT_NODE &&
      /^(strong|b|em|i)$/.test(right.tagName);
    const needsRightSpace =
      !rightWillHandleBoundary &&
      !right.hasBoundarySpace &&
      right.char &&
      rightBoundaryLike &&
      isWordLikeChar(right.char);
    const normalizedNeedsLeftSpace = !left.hasBoundarySpace && left.char && isWordLikeChar(left.char) && leftBoundaryLike;
    return `${normalizedNeedsLeftSpace ? ' ' : ''}${marker}${text}${marker}${needsRightSpace ? ' ' : ''}`;
  };

  // 处理各种元素类型
  switch (domElement.nodeName.toLowerCase()) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = domElement.nodeName.toLowerCase().charAt(1);
      const prefix = '#'.repeat(parseInt(level));
      // 处理标题内容，可能包含子元素
      let content = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      return `${prefix} ${content.trim()}\n\n`;
    }
    case 'p': {
      // 处理段落内容，包括子元素
      let content = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      return `${content.trim()}\n\n`;
    }
    case 'ul': {
      let result = '';
      for (const li of domElement.children) {
        if (li.nodeName.toLowerCase() === 'li') {
          let content = '';
          for (const child of li.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              content += domToMarkdown(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
              content += child.textContent;
            }
          }
          result += `- ${content.trim()}\n`;
        }
      }
      return result + '\n';
    }
    case 'ol': {
      let result = '';
      // 检查是否有start属性
      let index = 1;
      if (domElement.hasAttribute('start')) {
        index = parseInt(domElement.getAttribute('start')) || 1;
      }

      for (const li of domElement.children) {
        if (li.nodeName.toLowerCase() === 'li') {
          let content = '';
          for (const child of li.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              content += domToMarkdown(child);
            } else if (child.nodeType === Node.TEXT_NODE) {
              content += child.textContent;
            }
          }
          result += `${index}. ${content.trim()}\n`;
          index++;
        }
      }
      return result + '\n';
    }
    case 'blockquote': {
      let content = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      const normalized = content
        .replace(/\r\n?/g, '\n')
        .trim();
      if (!normalized) {
        return '> \n\n';
      }
      const quoted = normalized
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
      return `${quoted}\n\n`;
    }
    case 'a': {
      let content = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      return `[${content.trim()}](${domElement.getAttribute('href')})`;
    }
    case 'strong':
    case 'b': {
      let content = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      return wrapInlineWithBoundarySpaces(domElement, '**', content);
    }
    case 'em':
    case 'i': {
      let content = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        }
      }
      return wrapInlineWithBoundarySpaces(domElement, '*', content);
    }
    case 'code': {
      if (!domElement.closest('.md-code-block')) {
        return `\`${domElement.textContent.trim()}\``;
      }
      return domElement.textContent.trim();
    }
    case 'img': {
      return `![${domElement.getAttribute('alt') || ''}](${domElement.getAttribute('src')})`;
    }
    case 'hr': {
      return `---\n\n`;
    }
    case 'br': {
      // Markdown 硬换行需要两个空格加换行
      return `  \n`;
    }
    case 'table': {
      return convertTableToMarkdown(domElement);
    }
    default: {
      // 对于其他元素，处理所有子节点
      let result = '';
      for (const child of domElement.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          result += domToMarkdown(child);
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent;
          if (text) {
            result += text;
          }
        }
      }
      return result;
    }
  }
}

function normalizeAssistantContent(domElement) {
  if (!(domElement instanceof HTMLElement)) {
    return {
      element: domElement,
      references: []
    };
  }

  const cloned = domElement.cloneNode(true);
  const references = [];
  const referenceMap = new Map();
  const buildReferenceLabel = (element) => {
    const countTextNode = element ? element.querySelector('._669a677') : null;
    const countText = countTextNode ? (countTextNode.textContent || '').trim() : '';
    const domains = Array.from((element || document).querySelectorAll('img.site_logo_img'))
      .map(img => {
        const src = (img.getAttribute('src') || '').trim();
        if (!src) return '';
        try {
          const pathname = new URL(src, window.location.href).pathname || '';
          return pathname.split('/').filter(Boolean).pop() || '';
        } catch (e) {
          return '';
        }
      })
      .filter(Boolean);
    const uniqueDomains = Array.from(new Set(domains));
    const labelParts = [];
    if (countText) labelParts.push(countText);
    if (uniqueDomains.length > 0) labelParts.push(uniqueDomains.join(', '));
    return labelParts.join(' - ');
  };
  const ensureReference = (href, label) => {
    const key = `${href || ''}__${label || ''}`;
    let index = referenceMap.get(key);
    if (!index) {
      references.push({ href: href || '', label: label || '' });
      index = references.length;
      referenceMap.set(key, index);
    }
    return index;
  };
  const citeLinks = cloned.querySelectorAll('a');

  citeLinks.forEach(link => {
    const citeNode = link.querySelector('.ds-markdown-cite');
    const sourceNode = link.querySelector('.f93f59e4');
    const hasSiteLogos = link.querySelectorAll('.site_logo_img').length > 0;
    const href = (link.getAttribute('href') || '').trim();
    const isReferenceLink = !!citeNode || !!sourceNode || hasSiteLogos;
    if (!isReferenceLink || !href) return;

    const label = buildReferenceLabel(link);
    const index = ensureReference(href, label);

    const marker = cloned.ownerDocument.createTextNode(`[^${index}]`);
    link.replaceWith(marker);
  });

  const standaloneSources = cloned.querySelectorAll('.f93f59e4');
  standaloneSources.forEach(source => {
    if (source.closest('a')) return;
    const label = buildReferenceLabel(source);
    if (!label) return;
    const index = ensureReference('', label);
    const marker = cloned.ownerDocument.createTextNode(`[^${index}]`);
    source.replaceWith(marker);
  });

  return {
    element: cloned,
    references
  };
}

function assistantElementToMarkdown(domElement) {
  const normalized = normalizeAssistantContent(domElement);
  const base = domToMarkdown(normalized.element).trim();
  return {
    content: base,
    references: normalized.references
  };
}

function referencesToMarkdown(referenceItems, referenceIds) {
  if (!Array.isArray(referenceItems) || referenceItems.length === 0) {
    return '';
  }
  return referenceItems
    .map((item, index) => {
      const refId = Array.isArray(referenceIds) && referenceIds[index]
        ? String(referenceIds[index]).trim()
        : String(index + 1);
      const href = (item && item.href ? item.href : '').trim();
      const label = (item && item.label ? item.label : '').trim();
      if (label && href) return `[^${refId}]: [${label}](${href})`;
      if (href) return `[^${refId}]: ${href}`;
      if (label) return `[^${refId}]: ${label}`;
      return `[^${refId}]: `;
    })
    .join('\n');
}

function referencesToPlainText(referenceItems) {
  if (!Array.isArray(referenceItems) || referenceItems.length === 0) {
    return '';
  }
  return referenceItems
    .map((item, index) => {
      const href = (item && item.href ? item.href : '').trim();
      const label = (item && item.label ? item.label : '').trim();
      if (label && href) return `${index + 1}. ${label} - ${href}`;
      if (href) return `${index + 1}. ${href}`;
      if (label) return `${index + 1}. ${label}`;
      return `${index + 1}.`;
    })
    .join('\n');
}

function renderHtmlReferenceSuperscripts(contentHtml, referenceItems, referencePrefix) {
  if (!contentHtml) return '';
  return String(contentHtml).replace(/\[\^(\d+)\]/g, (match, value) => {
    const localIndex = Number(value);
    if (!Number.isInteger(localIndex) || localIndex < 1) return match;
    const item = Array.isArray(referenceItems) ? referenceItems[localIndex - 1] : null;
    if (!item) return match;
    const label = escapeHtml((item.label || item.href || '').trim());
    const href = (item.href || '').trim();
    const titleAttr = label ? ` title="${label}"` : '';
    if (href) {
      const safeHref = escapeHtml(href);
      return `<sup class="reference-sup"><a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>[${localIndex}]</a></sup>`;
    }
    const targetId = `${referencePrefix}-ref-${localIndex}`;
    return `<sup class="reference-sup"><a href="#${targetId}"${titleAttr}>[${localIndex}]</a></sup>`;
  });
}

function buildHtmlReferencesPanel(referenceItems, referencePrefix) {
  if (!Array.isArray(referenceItems) || referenceItems.length === 0) return '';
  const items = referenceItems.map((item, index) => {
    const refNumber = index + 1;
    const refId = `${referencePrefix}-ref-${refNumber}`;
    const label = escapeHtml((item.label || '').trim());
    const href = escapeHtml((item.href || '').trim());
    if (href && label) {
      return `<li id="${refId}"><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
    }
    if (href) {
      return `<li id="${refId}"><a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a></li>`;
    }
    if (label) {
      return `<li id="${refId}">${label}</li>`;
    }
    return `<li id="${refId}">[${refNumber}]</li>`;
  }).join('');
  return `    <div class="reference-panel">
      <details>
        <summary>References</summary>
        <div class="reference-panel-content references">
          <ol>${items}</ol>
        </div>
      </details>
    </div>`;
}

function getDefaultConversationTitle() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `DeepSeek-Chat-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function getConversationTitle() {
  const nodes = [
    document.querySelector('.f8d1e4c0 .afa34042'),
    document.querySelector('.f8d1e4c0')
  ];

  for (const node of nodes) {
    if (!node) continue;
    const text = (node.textContent || '').trim();
    if (text) return text;
  }

  const pageTitle = (document.title || '').trim();
  if (pageTitle) return pageTitle;
  return getDefaultConversationTitle();
}

function extractUserAttachments(messageElement) {
  const container = messageElement.closest('.ds-message') || messageElement.closest('._9663006');
  if (!container) return [];

  const nameNodes = Array.from(container.querySelectorAll('.f3a54b52'));
  const sizeNodes = Array.from(container.querySelectorAll('.dc832104'));
  const attachments = [];
  const seen = new Set();

  nameNodes.forEach((nameNode, index) => {
    const name = (nameNode.textContent || '').trim();
    const size = (sizeNodes[index] && sizeNodes[index].textContent ? sizeNodes[index].textContent : '').trim();
    if (!name) return;

    const key = `${name}__${size}`;
    if (seen.has(key)) return;
    seen.add(key);

    const type = size ? size.split(/\s+/)[0] : '';
    attachments.push({ name, size, type });
  });

  return attachments;
}

function formatUserContent(text, attachments) {
  const normalizedText = (text || '').trim();
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return normalizedText;
  }

  const attachmentLines = attachments
    .map((item, index) => `${index + 1}. ${item.name}${item.size ? ` (${item.size})` : ''}`)
    .join('\n');

  if (!normalizedText) {
    return `Attachments:\n${attachmentLines}`;
  }

  return `${normalizedText}\n\nAttachments:\n${attachmentLines}`;
}

function formatUserMarkdownContent(content) {
  const text = String(content ?? '');
  const maxRunLength = (value, ch) => {
    const pattern = new RegExp(`${ch}+`, 'g');
    let max = 0;
    let match = pattern.exec(value);
    while (match) {
      if (match[0].length > max) {
        max = match[0].length;
      }
      match = pattern.exec(value);
    }
    return max;
  };
  const maxBackticks = maxRunLength(text, '`');
  const maxTildes = maxRunLength(text, '~');
  const useBackticks = maxBackticks <= maxTildes;
  const fenceChar = useBackticks ? '`' : '~';
  const fenceLen = Math.max(3, (useBackticks ? maxBackticks : maxTildes) + 1);
  const fence = fenceChar.repeat(fenceLen);
  return `${fence}text\n${text}\n${fence}`;
}

/**
 * Convert chat data to Markdown format
 * @param {Object} data - The chat data to convert
 * @returns {string} - The Markdown content
 */
function convertToMarkdown(data, settings) {
  const includeReferences = !!(settings && settings.exportWebReferences);
  let markdown = `# ${data.title}\n\n`;
  markdown += `- **URL**: ${data.url}\n`;
  markdown += `- **Date**: ${new Date(data.date).toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  let globalReferenceCounter = 0;
  data.messages.forEach((msg, index) => {
    const roleIcon = msg.role === 'user' ? '🧑' : '🤖';
    const roleName = msg.role === 'user' ? 'User' : 'DeepSeek AI';
    markdown += `## ${roleIcon} ${roleName}\n\n`;

    if (msg.role === 'assistant' && msg.chain_of_thought) {
      markdown += `### Chain of Thought\n\n`;
      markdown += `${extractParagraphs(msg.chain_of_thought)}\n\n`;
    }

    if (msg.role === 'assistant') {
      const assistantData = assistantElementToMarkdown(msg.content);
      let assistantContent = assistantData.content;
      if (assistantData.references.length > 0) {
        if (includeReferences) {
          const referenceIds = assistantData.references.map(() => {
            globalReferenceCounter += 1;
            return globalReferenceCounter;
          });
          assistantContent = assistantContent.replace(/\[\^(\d+)\]/g, (match, localIndex) => {
            const mappedId = referenceIds[Number(localIndex) - 1];
            return mappedId ? `[^${mappedId}]` : match;
          });
          assistantContent = assistantContent.replace(/(\[\^\d+\])(?=\[\^\d+\])/g, '$1 ');
          markdown += `${assistantContent}\n\n`;
          markdown += `### References\n\n`;
          markdown += `${referencesToMarkdown(assistantData.references, referenceIds)}\n\n`;
        } else {
          assistantContent = removeReferenceMarkers(assistantContent);
          markdown += `${assistantContent}\n\n`;
        }
      } else {
        markdown += `${assistantContent}\n\n`;
      }
    } else {
      markdown += `${formatUserMarkdownContent(msg.content)}\n\n`;
    }

    if (index < data.messages.length - 1) {
      markdown += `---\n\n`;
    }
  });

  return markdown;
}

/**
 * Convert chat data to plain text format
 * @param {Object} data - The chat data to convert
 * @returns {string} - The plain text content
 */
function convertToPlainText(data, settings) {
  const includeReferences = !!(settings && settings.exportWebReferences);
  // Create the header with metadata
  let text = `${data.title}\n\n`;
  text += `URL: ${data.url}\n`;
  text += `Date: ${new Date(data.date).toLocaleString()}\n\n`;
  text += `----------------------------------------\n\n`;

  // Process each message
  data.messages.forEach((msg, index) => {
    // Format the role header
    const roleName = msg.role === 'user' ? 'User' : 'DeepSeek AI';
    text += `${roleName}:\n\n`;

    // Add chain of thought first (before content) to match DeepSeek website
    if (msg.role === 'assistant' && msg.chain_of_thought) {
      text += `Thinking process:\n\n`;
      text += `${extractParagraphs(msg.chain_of_thought)}\n\n`;
    }

    if (msg.role === 'user') {
      text += `${msg.content}\n\n`;
    } else {
      const assistantData = assistantElementToMarkdown(msg.content);
      const assistantContent = includeReferences
        ? assistantData.content
        : removeReferenceMarkers(assistantData.content);
      text += `${assistantContent}\n\n`;
      if (includeReferences && assistantData.references.length > 0) {
        text += `References:\n${referencesToPlainText(assistantData.references)}\n\n`;
      }
    }

    // Add separator between messages
    if (index < data.messages.length - 1) {
      text += `----------------------------------------\n\n`;
    }
  });

  return text;
}

/**
 * Extract paragraphs from DOM element
 * @param {HTMLElement} element - The DOM element to process
 * @returns {string} - Text content with preserved paragraphs
 */
function extractParagraphs(element) {
  if (!element) return '';

  const paragraphs = [];
  element.querySelectorAll('p').forEach(p => {
    paragraphs.push(p.textContent.trim());
  });

  return paragraphs.length > 0 ?
    paragraphs.join('\n') :
    element.textContent.trim();
}

/**
 * 从页面中提取所有消息
 * @returns {Array} 消息数组
 */
function extractAllMessagesFromPage() {
  try {
    // 1. 查找用户问题
    const userQuestions = document.querySelectorAll('.fbb737a4');

    // 2. 查找AI回答
    const aiResponses = document.querySelectorAll('.ds-message .ds-markdown:not(.ds-think-content .ds-markdown)');

    // 3. 查找思考过程容器
    const cotContainers = document.querySelectorAll('.ds-message .ds-think-content');

    // 4. 查找对话标题
    const conversationTitle = getConversationTitle();

    if (userQuestions.length === 0 && aiResponses.length === 0 && cotContainers.length === 0) {
      return { };
    }

    // 创建一个数组来存储所有消息元素及其类型和位置
    const allElements = [];

    // 添加用户问题
    userQuestions.forEach(el => {
      allElements.push({
        element: el,
        type: 'user'
      });
    });

    // 添加AI回答
    aiResponses.forEach(el => {
      allElements.push({
        element: el,
        type: 'ai'
      });
    });

    // 添加思考过程容器
    cotContainers.forEach(el => {
      allElements.push({
        element: el,
        type: 'cot'
      });
    });

    // 按照元素在DOM中的位置排序
    allElements.sort((a, b) => {
      const pos = a.element.compareDocumentPosition(b.element);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    // 处理排序后的元素
    const messages = [];
    let cot = null;
    allElements.forEach((item, index) => {
      const { element, type } = item;
      if (type === 'user') {
        const attachments = extractUserAttachments(element);
        const content = formatUserContent(element.textContent.trim(), attachments);
        // 处理用户问题
        const message = {
          role: 'user',
          content,
          element_id: element.id || `user-${index}-${Date.now()}`
        };
        if (attachments.length > 0) {
          message.attachments = attachments;
        }
        messages.push(message);
      }
      else if (type === 'ai') {
        // 处理AI回答
        const message = {
          role: 'assistant',
          content: element,
          element_id: element.id || `ai-${index}-${Date.now()}`
        };
        if (cot !== null) {
          message.chain_of_thought = cot;
          cot = null;
        }
        messages.push(message);
      }
      else if (type === 'cot') {
        cot = element;
      }
    });
    return { title: conversationTitle, messages };
  } catch (error) {
    console.error('Error extracting messages from page:', error);
    return { };
  }
}

function cleanCodeBlockDOM(domElement) {
  if (!domElement) return domElement;

  // 创建一个副本以避免修改原始DOM
  const clonedDOM = domElement.cloneNode(true);

  // 查找所有代码块
  const codeBlocks = clonedDOM.querySelectorAll('.md-code-block');

  codeBlocks.forEach(codeBlock => {
    // 删除banner元素
    const banners = codeBlock.querySelectorAll('.md-code-block-banner-wrap');
    banners.forEach(banner => banner.remove());

    // 删除footer元素
    const footers = codeBlock.querySelectorAll('.md-code-block-footer');
    footers.forEach(footer => footer.remove());

    const decorativeSvgs = codeBlock.querySelectorAll('svg._9bc997d, svg[class*="_9bc997d"]');
    decorativeSvgs.forEach(svg => svg.remove());
  });

  return clonedDOM;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractCodeLanguageForHtml(codeBlock) {
  if (!(codeBlock instanceof HTMLElement)) return '';
  const fromCodeInfo = extractMarkdownCodeInfo(codeBlock);
  if (fromCodeInfo && fromCodeInfo.language) {
    return String(fromCodeInfo.language).trim().toLowerCase();
  }

  const candidates = [
    codeBlock.querySelector('pre code'),
    codeBlock.querySelector('code'),
    codeBlock.querySelector('pre')
  ].filter(Boolean);

  for (const node of candidates) {
    const dataLang = (node.getAttribute('data-language') || '').trim();
    if (dataLang) return dataLang.toLowerCase();
    const className = node.className || '';
    const match = className.match(/(?:^|\s)(?:language|lang)-([a-z0-9_+#.-]+)/i);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  return '';
}

function appendCodeLanguageBadge(codeBlock, language) {
  if (!language) return;
  if (codeBlock.querySelector('[data-export-language-badge="1"]')) return;
  const pre = codeBlock.querySelector('pre');
  if (!pre || !pre.parentNode) return;
  const badge = codeBlock.ownerDocument.createElement('span');
  badge.className = 'language-header';
  badge.setAttribute('data-export-language-badge', '1');
  badge.textContent = String(language).trim().toLowerCase();
  pre.parentNode.insertBefore(badge, pre);
}

let exportCopyTargetId = 0;

function ensureCopyTargetId(pre) {
  if (!pre) return '';
  if (!pre.id) {
    exportCopyTargetId += 1;
    pre.id = `export-code-${exportCopyTargetId}`;
  }
  return pre.id;
}

function appendCopyButtonNearPre(pre) {
  if (!pre || !pre.parentNode) return;
  const targetId = ensureCopyTargetId(pre);
  if (!targetId) return;
  let button = pre.parentNode.querySelector(`button[data-copy-target="${targetId}"]`);
  if (!button) {
    button = pre.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = 'code-copy-btn';
    button.setAttribute('data-copy-target', targetId);
    pre.parentNode.insertBefore(button, pre);
  }
  button.textContent = 'Copy';
}

function assistantElementToHtml(domElement) {
  const normalized = normalizeAssistantContent(domElement);
  const sourceCodeBlocks = Array.from(normalized.element.querySelectorAll('.md-code-block'));
  const htmlElement = cleanCodeBlockDOM(normalized.element);
  const codeBlocks = Array.from(htmlElement.querySelectorAll('.md-code-block'));
  codeBlocks.forEach((codeBlock, index) => {
    const sourceCodeBlock = sourceCodeBlocks[index] || codeBlock;
    const language = extractCodeLanguageForHtml(sourceCodeBlock);
    appendCodeLanguageBadge(codeBlock, language);
    appendCopyButtonNearPre(codeBlock.querySelector('pre'));

    const hasMermaidSvg = !!codeBlock.querySelector('svg.mermaid-svg, .mermaid-svg');
    const tabText = (codeBlock.querySelector('[role="tablist"]')?.textContent || '').trim();
    const likelyDiagram = hasMermaidSvg || /图表|diagram|mermaid/i.test(tabText);
    if (!likelyDiagram) return;

    const codeInfo = extractMarkdownCodeInfo(sourceCodeBlock) || extractMarkdownCodeInfo(codeBlock);
    if (!codeInfo || !codeInfo.content) return;

    const sourceBlock = htmlElement.ownerDocument.createElement('details');
    sourceBlock.className = 'diagram-code-panel';
    const summary = htmlElement.ownerDocument.createElement('summary');
    summary.textContent = 'Diagram Code';
    const pre = htmlElement.ownerDocument.createElement('pre');
    const code = htmlElement.ownerDocument.createElement('code');
    if (codeInfo.language) {
      code.className = `language-${codeInfo.language}`;
    }
    code.textContent = codeInfo.content;
    pre.appendChild(code);
    sourceBlock.appendChild(summary);
    if (codeInfo.language) {
      const badge = htmlElement.ownerDocument.createElement('span');
      badge.className = 'language-header';
      badge.setAttribute('data-export-language-badge', '1');
      badge.textContent = String(codeInfo.language).trim().toLowerCase();
      sourceBlock.appendChild(badge);
    }
    sourceBlock.appendChild(pre);
    codeBlock.insertAdjacentElement('afterend', sourceBlock);
    appendCopyButtonNearPre(pre);
  });
  const htmlBody = htmlElement.innerHTML;

  const items = normalized.references.map((item, index) => {
    const label = escapeHtml((item.label || '').trim());
    const href = escapeHtml((item.href || '').trim());
    if (href && label) {
      return `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
    }
    if (href) {
      return `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a></li>`;
    }
    if (label) {
      return `<li>${label}</li>`;
    }
    return `<li>[${index + 1}]</li>`;
  }).join('');

  return {
    content_html: htmlBody,
    references_html: items ? `<ol>${items}</ol>` : '',
    references: normalized.references
  };
}

/**
 * Convert chat data to HTML format
 * @param {Object} data - The chat data to convert
 * @returns {string} - The HTML content
 */
function convertToHTML(data, settings) {
  const includeReferences = !!(settings && settings.exportWebReferences);
  const safeTitle = escapeHtml(data.title);
  const safeUrl = escapeHtml(data.url);
  const safeDate = escapeHtml(new Date(data.date).toLocaleString());

  // 创建基本的HTML结构
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <title>${safeTitle}</title>
  <style>
    :root {
      --primary-bg: #ffffff;
      --secondary-bg: #f8f9fa;
      --user-msg-bg: #f0f7ff;
      --ai-msg-bg: #f0faf4;
      --user-accent: #0366d6;
      --ai-accent: #28a745;
      --border-color: #e1e4e8;
      --text-primary: #24292e;
      --text-secondary: #586069;
      --code-bg: #f6f8fa;
      --code-block-bg: #1e1e1e;
      --code-text: #e6e6e6;
      --chain-bg: #fffbea;
      --chain-border: #f9c513;
      --chain-title: #b08800;
      --shadow: rgba(0, 0, 0, 0.05);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --primary-bg: #0d1117;
        --secondary-bg: #161b22;
        --user-msg-bg: #0d1d30;
        --ai-msg-bg: #0d2a1a;
        --user-accent: #58a6ff;
        --ai-accent: #3fb950;
        --border-color: #30363d;
        --text-primary: #c9d1d9;
        --text-secondary: #8b949e;
        --code-bg: #161b22;
        --code-block-bg: #1e1e1e;
        --code-text: #e6e6e6;
        --chain-bg: #2d261e;
        --chain-border: #d29922;
        --chain-title: #e3b341;
        --shadow: rgba(0, 0, 0, 0.3);
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--primary-bg);
    }

    .chat-header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .chat-title {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text-primary);
    }

    .chat-metadata {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 5px;
    }

    .message-container {
      margin-bottom: 25px;
      padding-bottom: 25px;
      border-bottom: 1px solid var(--border-color);
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .user-message .message-header {
      color: var(--user-accent);
    }

    .ai-message .message-header {
      color: var(--ai-accent);
    }

    .message-role {
      font-weight: 600;
      font-size: 16px;
      margin-left: 8px;
    }

    .message-content {
      background-color: var(--secondary-bg);
      padding: 18px;
      border-radius: 10px;
      box-shadow: 0 2px 8px var(--shadow);
      overflow-wrap: break-word;
    }

    .message-container.ai-message .message-content {
      margin-top: 12px;
    }

    .user-message .message-content {
      background-color: var(--user-msg-bg);
      border-left: 3px solid var(--user-accent);
    }

    .ai-message .message-content {
      background-color: var(--ai-msg-bg);
      border-left: 3px solid var(--ai-accent);
    }

    .chain-of-thought {
      margin-top: 15px;
    }

    .chain-of-thought details {
      background-color: var(--chain-bg);
      border-radius: 8px;
      border-left: 3px solid var(--chain-border);
      overflow: hidden;
    }

    .chain-of-thought summary {
      padding: 12px 15px;
      font-weight: 600;
      cursor: pointer;
      color: var(--chain-title);
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }

    .chain-of-thought summary::after {
      content: '▼';
      font-size: 10px;
      transition: transform 0.2s ease;
    }

    .chain-of-thought details[open] summary::after {
      transform: rotate(180deg);
    }

    .chain-of-thought-content {
      padding: 15px;
      border-top: 1px solid var(--chain-border);
      color: var(--text-primary);
    }

    pre {
      background-color: var(--code-bg);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 15px 0;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
    }

    .code-block {
      background-color: var(--code-block-bg);
      color: var(--code-text);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .language-header {
      display: inline-block;
      font-size: .78rem;
      color: #475569;
      margin-right: .4rem;
      margin-bottom: .35rem;
      background: #e2e8f0;
      padding: .15rem .45rem;
      border-radius: 999px;
      font-weight: 600;
      text-transform: uppercase;
      vertical-align: middle;
    }

    .code-copy-btn {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      margin-bottom: .35rem;
      padding: .15rem .55rem;
      border-radius: 999px;
      border: 1px solid #e5e7eb;
      background: #f3f4f6;
      color: #374151;
      font-size: .75rem;
      font-weight: 600;
      line-height: 1.3;
      cursor: pointer;
      transition: background-color .15s ease, color .15s ease;
    }

    .code-copy-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 { font-size: 2em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }

    a {
      color: var(--user-accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .reference-sup {
      margin-left: 1px;
      margin-right: 1px;
    }

    .reference-sup a {
      font-size: 0.78em;
      vertical-align: super;
      text-decoration: none;
      font-weight: 600;
    }

    ul, ol {
      padding-left: 2em;
    }

    li + li {
      margin-top: 0.25em;
    }

    blockquote {
      margin: 1em 0;
      padding: 0 1em;
      color: var(--text-secondary);
      border-left: 0.25em solid var(--border-color);
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }

    table th, table td {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
    }

    table th {
      background-color: var(--secondary-bg);
      font-weight: 600;
    }

    img {
      max-width: 100%;
      border-radius: 6px;
    }

    .references ol {
      margin: 0;
      padding-left: 22px;
    }

    .references li {
      margin: 4px 0;
    }

    .reference-panel {
      margin-top: 15px;
    }

    .reference-panel details {
      background-color: var(--secondary-bg);
      border-radius: 8px;
      border-left: 3px solid var(--border-color);
      overflow: hidden;
    }

    .reference-panel summary {
      padding: 12px 15px;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-secondary);
      user-select: none;
    }

    .reference-panel-content {
      padding: 12px 15px;
      border-top: 1px solid var(--border-color);
    }

    .diagram-code-panel {
      margin-top: 10px;
      border-top: 1px dashed var(--border-color);
      padding-top: 8px;
    }

    .diagram-code-panel summary {
      cursor: pointer;
      color: var(--text-secondary);
      font-weight: 600;
      margin-bottom: 8px;
      user-select: none;
    }

    .katex .katex-mathml {
      clip: rect(1px, 1px, 1px, 1px);
      border: 0;
      width: 100px;
      height: 50px;
      padding: 0;
      position: absolute;
      overflow: hidden;
    }

    .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      padding: 2px 0;
    }

    .katex {
      text-rendering: auto;
    }
  </style>
</head>
<body>
  <div class="chat-header">
    <div class="chat-title">${safeTitle}</div>
    <div class="chat-metadata">URL: ${safeUrl}</div>
    <div class="chat-metadata">Date: ${safeDate}</div>
  </div>
`;

  // 处理每条消息
  data.messages.forEach((msg, msgIndex) => {
    const roleClass = msg.role === 'user' ? 'user-message' : 'ai-message';
    const roleIcon = msg.role === 'user' ? '🧑' : '🤖';
    const roleName = msg.role === 'user' ? 'User' : 'DeepSeek AI';

    // 处理消息内容，如果是 Markdown 格式，转换为 HTML
    let processedContent = msg.content;
    let referencesPanel = '';
    if (msg.role === 'assistant') {
      const assistantHtmlData = assistantElementToHtml(msg.content);
      const referencePrefix = `msg-${msgIndex + 1}`;
      if (includeReferences) {
        processedContent = renderHtmlReferenceSuperscripts(
          assistantHtmlData.content_html,
          assistantHtmlData.references,
          referencePrefix
        );
        referencesPanel = buildHtmlReferencesPanel(assistantHtmlData.references, referencePrefix);
      } else {
        processedContent = removeReferenceMarkers(assistantHtmlData.content_html);
      }
    } else {
      processedContent = escapeHtml(msg.content).replace(/\n/g, '<br>');
    }

    html += `  <div class="message-container ${roleClass}">
    <div class="message-header">
      <span>${roleIcon}</span>
      <span class="message-role">${roleName}</span>
    </div>`;

    // Add chain of thought first (before content) to match DeepSeek website
    if (msg.chain_of_thought) {
      html += `    <div class="chain-of-thought">
      <details>
        <summary>Thinking Process</summary>
        <div class="chain-of-thought-content">
          ${msg.chain_of_thought.innerHTML}
        </div>
      </details>
    </div>`;
    }

    html += `    <div class="message-content">
      ${processedContent}
    </div>
${referencesPanel}
  </div>\n`;
  });

  // 关闭HTML结构
  html += `<script>
  (function () {
    function fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
      document.body.removeChild(textarea);
    }

    async function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return;
        } catch (e) {}
      }
      fallbackCopy(text);
    }

    document.addEventListener('click', async function (event) {
      const button = event.target.closest('.code-copy-btn');
      if (!button) return;
      const targetId = button.getAttribute('data-copy-target');
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      const text = target.textContent || '';
      await copyText(text);
      const oldText = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function () {
        button.textContent = oldText || 'Copy';
      }, 1200);
    });
  })();
  </script>
</body>
</html>`;

  return html;
}

/**
 * Convert formatted data to JSON format
 * @param {Object} data - The formatted data to convert
 * @returns {Object} - The JSON-ready data
 */
function convertToJSON(formattedData, settings) {
  const includeReferences = !!(settings && settings.exportWebReferences);
  const messages = formattedData.messages.map(msg => {
    if (msg.role === 'assistant') {
      const assistantContent = assistantElementToMarkdown(msg.content);
      return {
        role: msg.role,
        content: includeReferences ? assistantContent.content : removeReferenceMarkers(assistantContent.content),
        references: includeReferences ? assistantContent.references : [],
        chain_of_thought: extractParagraphs(msg.chain_of_thought),
      };
    }
    const userMessage = {
      role: msg.role,
      content: String(msg.content ?? ''),
    };
    if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      userMessage.attachments = msg.attachments;
    }
    return userMessage;
  })
  return {
    title: formattedData.title,
    url: formattedData.url,
    date: formattedData.date,
    messages: messages
  };
}

// 使用DOMContentLoaded事件更早地初始化插件
document.addEventListener('DOMContentLoaded', function() {
  init();
});

// 如果DOMContentLoaded已经触发，则立即初始化
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
