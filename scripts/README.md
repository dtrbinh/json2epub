# Converter Modules

This folder contains modular converter classes for different ebook formats. Each converter is responsible for handling the conversion logic for a specific format.

## Structure

Each converter module follows a consistent pattern:

```javascript
class FormatConverter {
    constructor(converter) {
        this.converter = converter; // Reference to main converter instance
    }

    async convert() {
        // Conversion logic specific to this format
    }

    // Helper methods specific to this format
}

// Export for use in main script
window.FormatConverter = FormatConverter;
```

## Available Converters

### Core Formats
- **`epub-converter.js`** - EPUB 3.0 format with full metadata, TOC, and styling
- **`pdf-converter.js`** - PDF format using jsPDF library with proper pagination
- **`html-converter.js`** - HTML bundle with navigation and responsive styling

### Text Formats
- **`txt-converter.js`** - Plain text format with basic formatting
- **`rtf-converter.js`** - Rich Text Format with text styling

### Amazon Kindle Formats
- **`mobi-converter.js`** - MOBI format with Palm database structure
- **`azw-converter.js`** - Amazon AZW format (MOBI with DRM metadata)
- **`azw3-converter.js`** - Amazon AZW3 format (EPUB-based with KF8 features)

## Main Converter Interface

Each converter has access to the main converter instance through `this.converter`, providing:

### Properties
- `this.converter.bookData` - The parsed JSON book data
- `this.converter.coverImageData` - Cover image data if available

### Methods
- `this.converter.setConvertingState(message)` - Update UI with conversion status
- `this.converter.updateProgress(percentage, text)` - Update progress bar
- `this.converter.completeConversion()` - Mark conversion as complete
- `this.converter.escapeHTML(text)` - Escape HTML entities
- `this.converter.escapeXML(text)` - Escape XML entities
- `this.converter.generateUUID()` - Generate unique identifier

## Adding New Formats

To add a new format converter:

1. Create a new file `format-converter.js` in this folder
2. Implement the converter class following the pattern above
3. Add the script reference to `index.html`
4. Add the case statement in the main `convertToFormat()` method

## Usage

The converters are automatically loaded by the main application and instantiated based on user format selection. Each converter handles its own progress tracking, file generation, and download process. 