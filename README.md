# JSON to eBook Converter

[![Deploy to GitHub Pages](https://github.com/dtrbinh/json2epub/actions/workflows/deploy.yml/badge.svg)](https://github.com/dtrbinh/json2epub/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://dtrbinh.github.io/json2epub/)

A static web application that converts structured JSON data into multiple ebook formats. This tool allows you to transform book content stored in JSON format into various formats including EPUB, MOBI, AZW, AZW3, PDF, HTML, TXT, and RTF.

## 🚀 Live Demo

**Try it now:** [https://dtrbinh.github.io/json2epub/](https://dtrbinh.github.io/json2epub/)

No installation required! Use the live demo to convert your JSON files to multiple ebook formats directly in your browser.

## Features

- 🚀 **Client-side conversion** - No server required, works entirely in the browser
- 📚 **Multiple output formats** - EPUB, MOBI, AZW, AZW3, PDF, HTML, TXT, and RTF
- 📖 **Multi-volume support** - Handle books with multiple volumes and chapters
- 🎨 **Cover image support** - Include cover images from URLs (EPUB format)
- ✅ **Standards compliant** - Generates valid EPUB 3.0, proper PDF, and clean HTML
- 💻 **Simple web interface** - Easy-to-use format selection and drag-and-drop
- 📱 **Responsive design** - Works on desktop and mobile devices

## Supported Output Formats

| Format | Extension | Description | Best For |
|--------|-----------|-------------|----------|
| 📚 **EPUB** | `.epub` | Standard ebook format with full metadata, TOC, and styling | E-readers, ebook libraries |
| 📱 **MOBI** | `.mobi` | Amazon Kindle format with reflowable text | Older Kindle devices, Kindle apps |
| 🔒 **AZW** | `.azw` | Amazon Kindle format with DRM support | Kindle devices with DRM |
| 🚀 **AZW3** | `.azw3` | Modern Amazon Kindle format with enhanced features | Modern Kindle devices, KF8 |
| 📄 **PDF** | `.pdf` | Portable Document Format with proper pagination | Printing, archival, sharing |
| 🌐 **HTML** | `.zip` | Bundle of HTML files with navigation and styling | Web publishing, custom readers |
| 📝 **TXT** | `.txt` | Plain text format with simple formatting | Basic readers, accessibility |
| 📋 **RTF** | `.rtf` | Rich Text Format with basic formatting | Word processors, compatibility |

## JSON Structure

The application expects JSON files with the following structure:

```json
{
  "title": "Book Title",
  "description": "A short description of the book.",
  "author": "Author Name",
  "cover": "https://example.com/cover.jpg",
  "content": [
    {
      "volume_index": 1,
      "volume_name": "Volume One Name",
      "chapters": [
        {
          "chapter_index": 1,
          "chapter_title": "Chapter One Title",
          "chapter_content": "Full text content of chapter one..."
        },
        {
          "chapter_index": 2,
          "chapter_title": "Chapter Two Title",
          "chapter_content": "Full text content of chapter two..."
        }
      ]
    },
    {
      "volume_index": 2,
      "volume_name": "Volume Two Name",
      "chapters": [
        {
          "chapter_index": 1,
          "chapter_title": "Chapter One of Volume Two",
          "content": "Content of chapter..."
        }
      ]
    }
  ]
}
```

### Field Descriptions

- **title**: The book's main title
- **description**: A brief description or summary of the book
- **author**: The author's name
- **cover**: URL to the cover image (optional)
- **content**: Array of volumes containing chapters
  - **volume_index**: Numeric index of the volume
  - **volume_name**: Display name for the volume
  - **chapters**: Array of chapters within the volume
    - **chapter_index**: Numeric index of the chapter within the volume
    - **chapter_title**: Title of the chapter
    - **chapter_content**: Full text content of the chapter

## Usage

1. **Open the application** in your web browser
2. **Select or drag-and-drop** your JSON file
3. **Preview** the parsed content (optional)
4. **Choose your preferred output format** (EPUB, MOBI, AZW, AZW3, PDF, HTML, TXT, or RTF)
5. **Configure conversion options** if needed
6. **Click "Convert to [Format]"** to generate the file
7. **Download** the generated file

## Technical Details

### Technologies Used
- **HTML5** - Structure and layout
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Core conversion logic
- **JSZip** - For creating ZIP-based files (EPUB, HTML)
- **jsPDF** - For PDF generation
- **File API** - For handling file uploads and downloads

### EPUB Structure
The generated EPUB files follow the EPUB 3.0 specification and include:
- **META-INF/container.xml** - Container specification
- **OEBPS/content.opf** - Package document with metadata
- **OEBPS/toc.ncx** - Navigation control file
- **OEBPS/toc.xhtml** - HTML table of contents
- **OEBPS/content/*.xhtml** - Individual chapter files
- **OEBPS/images/** - Cover and other images (if applicable)
- **OEBPS/styles/style.css** - Basic styling for chapters

### Kindle Format Details
- **MOBI** - Uses Palm database format with HTML content, compatible with all Kindle devices
- **AZW** - MOBI format with Amazon DRM metadata, optimized for Kindle ecosystem
- **AZW3** - Modern format based on EPUB with KF8 features, enhanced typography and layout

## Browser Compatibility

- Chrome 45+
- Firefox 42+
- Safari 10+
- Edge 12+

## File Size Limitations

- Maximum JSON file size: 50MB
- Maximum cover image size: 10MB
- Recommended chapter count: Up to 1000 chapters

## Example Files

Check the `example.json` file in this repository for a sample structure you can use to test the converter.

## Development

### Running Locally

To run the application locally:

1. Clone this repository
   ```bash
   git clone https://github.com/dtrbinh/json2epub.git
   cd json2epub
   ```
2. Open `index.html` in your web browser
3. No build process or server required!

### Deployment

The application is automatically deployed to GitHub Pages via GitHub Actions:

- **Live URL**: [https://dtrbinh.github.io/json2epub/](https://dtrbinh.github.io/json2epub/)
- **Auto-deploy**: Triggered on every push to the `main` branch
- **Status**: Check the deployment badge above for current status

The deployment workflow:
1. Triggers on push to `main` branch
2. Uses GitHub Actions to build and deploy
3. Serves the static files directly from GitHub Pages

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## Support

If you encounter any issues or have questions, please:
1. Check the example JSON structure
2. Verify your JSON is valid
3. Open an issue in this repository
