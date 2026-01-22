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
  // 检查域名
  const domain = new URL(url).hostname;
  return domain === 'chat.deepseek.com';
}

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
 * Export the chat to a file in the specified format
 * @param {string} format - The format to export ('json', 'markdown', or 'text')
 */
function exportChat(format) {
  try {
    const {title, messages} = extractAllMessagesFromPage();
    if (!Array.isArray(messages) || messages.length === 0) {
      alert(chrome.i18n.getMessage('noMessagesFound'));
      return;
    }

    // 准备导出数据
    const exportData = {
      // TODO 提取标题信息
      title: title,
      url: window.location.href,
      date: new Date().toISOString(),
      messages: messages
    };
    // 使用导出函数下载聊天数据
    downloadChat(exportData, format);
  } catch (error) {
    console.error('Error during export:', error);
    alert(chrome.i18n.getMessage('exportError'));
  }
}

/**
 * Download chat data as a file in the specified format
 * @param {Object} exportData - The data to export
 * @param {string} format - The format to export ('json', 'markdown', 'text', or 'html')
 */
function downloadChat(exportData, format) {
  try {
    // 格式化导出数据，确保包含用户问题、AI回答和思考过程
    // 注意：保持原始消息数组的顺序不变
    const formattedData = {
      title: exportData.title,
      url: exportData.url,
      date: exportData.date,
      messages: exportData.messages.map(msg => {
        const formattedMsg = {
          role: msg.role,
          content: msg.content,
        };
        if (msg.role === 'assistant' && msg.chain_of_thought) {
          formattedMsg.chain_of_thought = msg.chain_of_thought;
        }
        return formattedMsg;
      })
    };

    let blob, filename;

    // 根据格式处理导出
    if (format === 'markdown') {
      const markdownContent = convertToMarkdown(formattedData);
      blob = new Blob([markdownContent], { type: 'text/markdown' });
      contentType = 'text/markdown';
      filename = `${formattedData.title}.md`;
    } else if (format === 'text') {
      const textContent = convertToPlainText(formattedData);
      blob = new Blob([textContent], { type: 'text/plain' });
      contentType = 'text/plain';
      filename = `${formattedData.title}.txt`;
    } else if (format === 'html') {
      const htmlContent = convertToHTML(formattedData);
      blob = new Blob([htmlContent], { type: 'text/html' });
      contentType = 'text/html';
      filename = `${formattedData.title}.html`;
    } else {
      const jsonContent = convertToJSON(formattedData);
      blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
      contentType = 'application/json';
      filename = `${formattedData.title}.json`;
    }

    // 创建并下载文件
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // 清理
    setTimeout(() => URL.revokeObjectURL(url), 50);

    // 添加视觉反馈
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
    // 提取语言信息
    const infoStringElement = domElement.querySelector('.d813de27');
    const language = infoStringElement ? infoStringElement.textContent.trim() : '';

    // 提取代码内容
    const preElement = domElement.querySelector('pre');
    const content = preElement ? preElement.textContent : '';

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
      return `> ${content.trim()}\n\n`;
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
      const text = content.trim();
      return `**${text}**`;
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
      return `*${content.trim()}*`;
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

/**
 * Convert chat data to Markdown format
 * @param {Object} data - The chat data to convert
 * @returns {string} - The Markdown content
 */
function convertToMarkdown(data) {
  // Create the header with metadata
  let markdown = `# ${data.title}\n\n`;
  markdown += `- **URL**: ${data.url}\n`;
  markdown += `- **Date**: ${new Date(data.date).toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  // Process each message
  data.messages.forEach((msg, index) => {
    // Format the role header
    const roleIcon = msg.role === 'user' ? '🧑' : '🤖';
    const roleName = msg.role === 'user' ? 'User' : 'DeepSeek AI';
    markdown += `## ${roleIcon} ${roleName}\n\n`;

    // Add chain of thought first (before content) to match DeepSeek website
    if (msg.role === 'assistant' && msg.chain_of_thought) {
      markdown += `<details>\n<summary>Chain of Thought</summary>\n\n`;
      markdown += `${extractParagraphs(msg.chain_of_thought)}\n\n`;
      markdown += `</details>\n\n`;
    }

    // Process the content with special handling for code blocks
    if (msg.role === 'assistant') {
      const formattedContent = domToMarkdown(msg.content);
      markdown += `${formattedContent}\n\n`;
    } else {
      markdown += `${msg.content}\n\n`;
    }

    // Add separator between messages
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
function convertToPlainText(data) {
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

    text += msg.role === 'user' ? `${msg.content}\n\n` : `${domToMarkdown(msg.content)}\n\n`;

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
    const conversationTitle = document.querySelector('.f8d1e4c0');

    if (userQuestions.length === 0 && aiResponses.length === 0 && cotContainers.length === 0) {
      return { };
    }

    // 创建一个数组来存储所有消息元素及其类型和位置
    const allElements = [];

    // 添加用户问题
    userQuestions.forEach(el => {
      allElements.push({
        element: el,
        type: 'user',
        position: getElementPosition(el)
      });
    });

    // 添加AI回答
    aiResponses.forEach(el => {
      allElements.push({
        element: el,
        type: 'ai',
        position: getElementPosition(el)
      });
    });

    // 添加思考过程容器
    cotContainers.forEach(el => {
      allElements.push({
        element: el,
        type: 'cot',
        position: getElementPosition(el)
      });
    });

    // 按照元素在DOM中的位置排序
    allElements.sort((a, b) => {
      return a.position - b.position;
    });

    // 处理排序后的元素
    const messages = [];
    let cot = null;
    allElements.forEach((item, index) => {
      const { element, type } = item;
      if (type === 'user') {
        // 处理用户问题
        const message = {
          role: 'user',
          content: element.textContent.trim(),
          element_id: element.id || `user-${index}-${Date.now()}`
        };
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
    return { title: conversationTitle.textContent.trim(), messages };
  } catch (error) {
    console.error('Error extracting messages from page:', error);
    return { };
  }
}

/**
 * 获取元素在DOM中的位置
 * @param {Element} element - 要获取位置的元素
 * @returns {number} 元素的位置值
 */
function getElementPosition(element) {
  // 使用TreeWalker遍历DOM树，找到元素的位置
  const treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  let position = 0;
  let found = false;

  while (treeWalker.nextNode()) {
    position++;
    if (treeWalker.currentNode === element) {
      found = true;
      break;
    }
  }

  return found ? position : Number.MAX_SAFE_INTEGER;
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

    // 删除svg元素
    const svgs = codeBlock.querySelectorAll('svg');
    svgs.forEach(svg => svg.remove());

    // 删除footer元素
    const footers = codeBlock.querySelectorAll('.md-code-block-footer');
    footers.forEach(footer => footer.remove());
  });

  return clonedDOM;
}

/**
 * Convert chat data to HTML format
 * @param {Object} data - The chat data to convert
 * @returns {string} - The HTML content
 */
function convertToHTML(data) {
  // 创建基本的HTML结构
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
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
      font-size: 12px;
      color: #888;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
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

    .katex .katex-mathml {
      clip: rect(1px, 1px, 1px, 1px);
      border: 0;
      width: 100px;
      height: 50px;
      padding: 0;
      position: absolute;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="chat-header">
    <div class="chat-title">${data.title}</div>
    <div class="chat-metadata">URL: ${data.url}</div>
    <div class="chat-metadata">Date: ${new Date(data.date).toLocaleString()}</div>
  </div>
`;

  // 处理每条消息
  data.messages.forEach(msg => {
    const roleClass = msg.role === 'user' ? 'user-message' : 'ai-message';
    const roleIcon = msg.role === 'user' ? '🧑' : '🤖';
    const roleName = msg.role === 'user' ? 'User' : 'DeepSeek AI';

    // 处理消息内容，如果是 Markdown 格式，转换为 HTML
    let processedContent = msg.content;
    if (msg.role === 'assistant') {
      processedContent = cleanCodeBlockDOM(msg.content).innerHTML;
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
  </div>\n`;
  });

  // 关闭HTML结构
  html += `</body>
</html>`;

  return html;
}

/**
 * Convert formatted data to JSON format
 * @param {Object} data - The formatted data to convert
 * @returns {Object} - The JSON-ready data
 */
function convertToJSON(formattedData) {
  const messages = formattedData.messages.map(msg => {
    if (msg.role === 'assistant') {
      return {
        role: msg.role,
        content: domToMarkdown(msg.content),
        chain_of_thought: extractParagraphs(msg.chain_of_thought),
      };
    }
    return {
      role: msg.role,
      content: domToMarkdown(msg.content),
    }
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
