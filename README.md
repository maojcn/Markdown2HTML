# Markdown to HTML Converter

A lightweight web application that converts Markdown syntax to HTML with real-time preview.

## Features

- Convert Markdown to clean, semantic HTML
- Live preview of rendered HTML output
- View generated HTML code
- Support for common Markdown elements:
  - Headings (h1-h6)
  - Text formatting (bold, italic, strikethrough)
  - Lists (ordered and unordered)
  - Code blocks with syntax highlighting
  - Blockquotes
  - Links and images
  - Horizontal rules

## How to Use

1. Clone this repository
2. Open [index.html](index.html) in your browser
3. Enter Markdown in the left textarea
4. Click "Convert Markdown" or see real-time preview
5. View the generated HTML code and rendered output

## Implementation Details

- Pure JavaScript implementation without dependencies
- Clean, responsive UI with Tailwind CSS
- Custom CSS styling for code and preview sections

## Project Structure

- [index.html](index.html) - Main HTML structure
- [script.js](script.js) - JavaScript implementation of the Markdown parser
- [styles.css](styles.css) - Custom CSS styling

## Supported Markdown Syntax

```markdown
# Heading 1
## Heading 2

**Bold** or __Bold__
*Italic* or _Italic_
***Bold and Italic***
~~Strikethrough~~

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