function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function applyInlineFormatting(text) {
    if (typeof text !== 'string') return '';
    let currentText = text;

    currentText = currentText.replace(/`([^`]+?)`/g, (match, code) => `<code>${escapeHtml(code)}</code>`);
    currentText = currentText.replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, alt, url, title) => {
        const escapedAlt = escapeHtml(alt);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(url)}" alt="${escapedAlt}"${titleAttr}>`;
    });
    currentText = currentText.replace(/\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, linkText, url, title) => {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(url)}"${titleAttr}>${linkText}</a>`;
    });
    currentText = currentText.replace(/\*{3}(.*?)\*{3}|_{3}(.*?)_{3}/g, (match, p1, p2) => `<strong><em>${p1 || p2}</em></strong>`);
    currentText = currentText.replace(/\*{2}(.*?)\*{2}|_{2}(.*?)_{2}/g, (match, p1, p2) => `<strong>${p1 || p2}</strong>`);
    currentText = currentText.replace(/\*(.*?)\*|_(.*?)_/g, (match, p1, p2) => `<em>${p1 || p2}</em>`);
    currentText = currentText.replace(/~~(.*?)~~/g, '<s>$1</s>');

    return currentText;
}

function markdownToHtml(markdownText) {
    if (markdownText === null || typeof markdownText === 'undefined') return '';
    const lines = String(markdownText).split('\n');
    let html = '';
    let i = 0;
    let inList = null;
    let listLines = [];

    function closeOpenList() {
        if (inList && listLines.length > 0) {
            html += `<${inList}>\n`;
            listLines.forEach(item => {
                html += `  <li>${applyInlineFormatting(item.substring(item.indexOf(' ') + 1).trim())}</li>\n`;
            });
            html += `</${inList}>\n`;
        }
        inList = null;
        listLines = [];
    }

    while (i < lines.length) {
        const line = lines[i];

        const codeBlockMatch = line.match(/^```(\w*)/);
        if (codeBlockMatch) {
            closeOpenList();
            const lang = codeBlockMatch[1] || '';
            const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
            let codeContent = '';
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeContent += escapeHtml(lines[i]) + '\n';
                i++;
            }
            html += `<pre><code${langClass}>${codeContent.trimRight()}</code></pre>\n`;
            i++;
            continue;
        }

        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
            closeOpenList();
            const level = headerMatch[1].length;
            const content = applyInlineFormatting(headerMatch[2].trim());
            html += `<h${level}>${content}</h${level}>\n`;
            i++;
            continue;
        }

        if (line.match(/^(\*\*\*|---|___)\s*$/)) {
            closeOpenList();
            html += '<hr>\n';
            i++;
            continue;
        }

        if (line.startsWith('>')) {
            closeOpenList();
            let bqContent = '';
            let bqLines = [];
            while (i < lines.length && lines[i].startsWith('>')) {
                bqLines.push(lines[i].substring(1).trimLeft());
                i++;
            }
            bqContent = markdownToHtml(bqLines.join('\n'));
            html += `<blockquote>\n${bqContent}</blockquote>\n`;
            continue;
        }

        const ulMatch = line.match(/^([\-\*\+])\s+(.*)/);
        if (ulMatch) {
            if (inList !== 'ul') {
                closeOpenList();
                inList = 'ul';
            }
            listLines.push(line);
            i++;
            continue;
        }

        const olMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (olMatch) {
            if (inList !== 'ol') {
                closeOpenList();
                inList = 'ol';
            }
            listLines.push(line);
            i++;
            continue;
        }

        if (inList && !ulMatch && !olMatch) {
            closeOpenList();
        }

        if (line.trim() === '') {
            closeOpenList();
            i++;
            continue;
        }

        let paraLines = [];
        while (i < lines.length && lines[i].trim() !== '' &&
               !lines[i].match(/^(?:#{1,6}\s|[\-\*\+]\s|\d+\.\s|>|---|```|(\*\*\*|---|___)\s*$)/)) {
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            const paraContent = paraLines.map(pl => applyInlineFormatting(pl)).join(' ');
            html += `<p>${paraContent}</p>\n`;
        }
    }
    closeOpenList();
    return html.trim();
}

document.addEventListener('DOMContentLoaded', function() {
    const markdownInput = document.getElementById('markdownInput');
    const convertButton = document.getElementById('convertButton');
    const htmlOutputElement = document.getElementById('htmlOutput');
    const renderedOutputElement = document.getElementById('renderedOutput');

    convertButton.addEventListener('click', () => {
        const markdownText = markdownInput.value;
        const htmlResult = markdownToHtml(markdownText);

        htmlOutputElement.textContent = htmlResult;
        renderedOutputElement.innerHTML = htmlResult;
    });

    markdownInput.value = `# Welcome to the Markdown to HTML Converter

This tool converts Markdown to HTML with enhanced features.

## Features
- **Bold Text** and __also bold__
- *Italic Text* and _also italic_
- ***Bold and Italic*** and ___also bold and italic___
- ~~Strikethrough~~
- \`Inline Code\` like this: \`const greeting = "Hello";\`

## Lists

### Unordered List
- Item One
- Item Two
  - Sub-item (basic list handling, no nesting support)
* Another item

### Ordered List
1. First Item
2. Second Item
3. Third Item

## Code Blocks
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`

## Blockquotes
> This is a blockquote.
> It can span multiple lines.

## Links and Images
- [Google](https://www.google.com "Search Engine")
- ![Sample Image](https://placehold.co/300x200/EABEBF/4F4F4F?text=Sample+Image)

## Horizontal Rule
---
End of content.
`;
    convertButton.click();
});
