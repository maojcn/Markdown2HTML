# Markdown to HTML Converter

A lightweight web application that converts Markdown syntax to HTML with real-time preview.

## Features

- Convert Markdown to clean, semantic HTML
- Live preview of rendered HTML output with syntax highlighting
- Multiple theme options (Default, GitHub, Sepia, Dark)
- View generated HTML code with copy to clipboard
- Download HTML or print the rendered content
- Support for common Markdown elements:
  - Headings (h1-h6)
  - Text formatting (bold, italic, strikethrough)
  - Lists (ordered and unordered)
  - Task lists with checkboxes
  - Code blocks with syntax highlighting
  - Blockquotes
  - Links and images
  - Horizontal rules
  - Table of contents generation

## How to Use

1. Clone this repository
2. Open [index.html](index.html) in your browser
3. Enter Markdown in the left textarea
4. See real-time preview as you type
5. Change themes, copy HTML, download or print as needed

## Implementation Details

- Pure JavaScript implementation with Prism.js for syntax highlighting
- Clean, responsive UI with Tailwind CSS
- Custom CSS styling for various themes
- Automatic table of contents generation

## Project Structure

- [index.html](index.html) - Main HTML structure
- [script.js](script.js) - JavaScript implementation of the Markdown parser
- [styles.css](styles.css) - Custom CSS styling including themes

## Supported Markdown Syntax

```markdown
# Heading 1
## Heading 2

[TOC]  <!-- Table of Contents -->

**Bold** or __Bold__
*Italic* or _Italic_
***Bold and Italic***
~~Strikethrough~~

- [x] Completed task
- [ ] Incomplete task

- Unordered list
- Items

1. Ordered list
2. Items

> Blockquotes
> Multiple lines

[Link text](https://example.com "Title")
![Alt text](image-url "Title")

`Inline code`

```javascript
// Code blocks
function example() {
  return "Hello world";
}
```

---
```

## License

MIT