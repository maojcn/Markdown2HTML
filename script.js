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

    // Task list items
    currentText = currentText.replace(/\[([ xX])\]/g, (match, check) => {
        const isChecked = check === 'x' || check === 'X';
        return `<input type="checkbox" ${isChecked ? 'checked' : ''} disabled> `;
    });

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
    
    // Extract all headings for TOC generation
    const headings = [];
    let tocRequested = false;

    // First pass to identify if TOC is requested and collect headings
    for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        
        if (line.trim().toLowerCase() === '[toc]') {
            tocRequested = true;
        }
        
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const content = headerMatch[2].trim();
            // Create an ID from the heading text
            const id = content.toLowerCase().replace(/[^\w\s-]/g, '')
                              .replace(/\s+/g, '-');
            headings.push({ level, content, id });
        }
    }

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

    function generateTOC() {
        if (headings.length === 0) return '';
        
        let toc = '<div class="markdown-toc">\n<h2>Table of Contents</h2>\n<ul>\n';
        
        headings.forEach(heading => {
            const indentation = '  '.repeat(heading.level - 1);
            toc += `${indentation}<li><a href="#${heading.id}">${heading.content}</a></li>\n`;
        });
        
        toc += '</ul>\n</div>\n';
        return toc;
    }

    while (i < lines.length) {
        const line = lines[i];
        
        // Handle TOC placeholder
        if (line.trim().toLowerCase() === '[toc]') {
            closeOpenList();
            html += generateTOC();
            i++;
            continue;
        }

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
            // Create an ID from the heading text for anchor links
            const id = headerMatch[2].trim().toLowerCase().replace(/[^\w\s-]/g, '')
                              .replace(/\s+/g, '-');
            html += `<h${level} id="${id}">${content}</h${level}>\n`;
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
    const copyHtmlButton = document.getElementById('copyHtmlButton');
    const printPreviewButton = document.getElementById('printPreviewButton');
    const downloadHtmlButton = document.getElementById('downloadHtmlButton');
    const themeSelector = document.getElementById('themeSelector');

    // Theme selector functionality
    themeSelector.addEventListener('change', () => {
        const selectedTheme = themeSelector.value;
        // Remove all theme classes
        renderedOutputElement.classList.remove('theme-default', 'theme-github', 'theme-sepia', 'theme-dark');
        // Add the selected theme class
        if (selectedTheme !== 'default') {
            renderedOutputElement.classList.add(`theme-${selectedTheme}`);
        } else {
            renderedOutputElement.classList.add('theme-default');
        }
    });

    // Download HTML button functionality
    downloadHtmlButton.addEventListener('click', () => {
        const htmlContent = htmlOutputElement.textContent;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Generate a filename based on the first heading or use default
        let filename = 'markdown-export.html';
        const firstHeadingMatch = markdownInput.value.match(/^#\s+(.*)/m);
        if (firstHeadingMatch && firstHeadingMatch[1]) {
            filename = firstHeadingMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
        }
        
        a.href = url;
        a.download = filename;
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        // Show feedback
        const originalText = downloadHtmlButton.innerHTML;
        downloadHtmlButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Downloaded!
        `;
        downloadHtmlButton.classList.remove('bg-blue-100', 'hover:bg-blue-200', 'text-blue-800');
        downloadHtmlButton.classList.add('bg-green-200', 'hover:bg-green-300', 'text-green-800');
        
        setTimeout(() => {
            downloadHtmlButton.innerHTML = originalText;
            downloadHtmlButton.classList.remove('bg-green-200', 'hover:bg-green-300', 'text-green-800');
            downloadHtmlButton.classList.add('bg-blue-100', 'hover:bg-blue-200', 'text-blue-800');
        }, 2000);
    });

    // Print preview button functionality
    printPreviewButton.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        const htmlContent = renderedOutputElement.innerHTML;
        const styleSheets = document.styleSheets;
        let styles = '';
        
        // Get the CSS from the current page
        Array.from(styleSheets).forEach(sheet => {
            try {
                if (sheet.href) {
                    styles += `<link rel="stylesheet" href="${sheet.href}" />`;
                } else if (sheet.cssRules) {
                    Array.from(sheet.cssRules).forEach(rule => {
                        styles += rule.cssText;
                    });
                }
            } catch (e) {
                console.log('Error accessing stylesheet:', e);
            }
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Markdown HTML Preview</title>
                <style>
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.6;
                        padding: 40px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    ${styles}
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/themes/prism.min.css" rel="stylesheet" />
            </head>
            <body>
                <div class="rendered-html-content">
                    ${htmlContent}
                </div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/components/prism-core.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/plugins/autoloader/prism-autoloader.min.js"></script>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });

    // Copy HTML button functionality
    copyHtmlButton.addEventListener('click', () => {
        const htmlToCopy = htmlOutputElement.textContent;
        navigator.clipboard.writeText(htmlToCopy).then(() => {
            const originalText = copyHtmlButton.innerHTML;
            copyHtmlButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
            `;
            copyHtmlButton.classList.remove('bg-gray-200', 'hover:bg-gray-300');
            copyHtmlButton.classList.add('bg-green-200', 'hover:bg-green-300');
            
            setTimeout(() => {
                copyHtmlButton.innerHTML = originalText;
                copyHtmlButton.classList.remove('bg-green-200', 'hover:bg-green-300');
                copyHtmlButton.classList.add('bg-gray-200', 'hover:bg-gray-300');
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy HTML');
        });
    });

    // Add real-time preview functionality
    markdownInput.addEventListener('input', debounce(() => {
        updatePreview();
    }, 300));

    convertButton.addEventListener('click', () => {
        updatePreview();
    });

    function updatePreview() {
        const markdownText = markdownInput.value;
        const htmlResult = markdownToHtml(markdownText);

        // Escape HTML for code display
        htmlOutputElement.textContent = htmlResult;
        
        // Update rendered preview
        renderedOutputElement.innerHTML = htmlResult;
        
        // Add syntax highlighting if available
        if (window.Prism) {
            Prism.highlightAllUnder(renderedOutputElement);
        }
    }

    // Debounce function to prevent excessive updates
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    markdownInput.value = `# Welcome to the Markdown to HTML Converter

This tool converts Markdown to HTML with enhanced features.

[TOC]

## Features
- **Bold Text** and __also bold__
- *Italic Text* and _also italic_
- ***Bold and Italic*** and ___also bold and italic___
- ~~Strikethrough~~
- \`Inline Code\` like this: \`const greeting = "Hello";\`

## Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
- [ ] Another incomplete task

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
    // Initialize the preview on page load
    convertButton.click();
});
