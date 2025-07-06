# JSON to EPUB Converter

A static web application that converts structured JSON data into EPUB files. This tool allows you to transform book content stored in JSON format into a properly formatted EPUB file that can be read on various e-readers and devices.

## Features

- 🚀 **Client-side conversion** - No server required, works entirely in the browser
- 📚 **Multi-volume support** - Handle books with multiple volumes and chapters
- 🎨 **Cover image support** - Include cover images from URLs
- 📖 **Proper EPUB structure** - Generates valid EPUB 3.0 files
- 💻 **Simple web interface** - Easy-to-use drag-and-drop or file selection
- 📱 **Responsive design** - Works on desktop and mobile devices

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
4. **Click "Convert to EPUB"** to generate the file
5. **Download** the generated EPUB file

## Technical Details

### Technologies Used
- **HTML5** - Structure and layout
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Core conversion logic
- **JSZip** - For creating ZIP-based EPUB files
- **File API** - For handling file uploads

### EPUB Structure
The generated EPUB files follow the EPUB 3.0 specification and include:
- **META-INF/container.xml** - Container specification
- **OEBPS/content.opf** - Package document with metadata
- **OEBPS/toc.ncx** - Navigation control file
- **OEBPS/toc.xhtml** - HTML table of contents
- **OEBPS/content/*.xhtml** - Individual chapter files
- **OEBPS/images/** - Cover and other images (if applicable)
- **OEBPS/styles/style.css** - Basic styling for chapters

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

To run the application locally:

1. Clone this repository
2. Open `index.html` in your web browser
3. No build process or server required!

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## Support

If you encounter any issues or have questions, please:
1. Check the example JSON structure
2. Verify your JSON is valid
3. Open an issue in this repository
