class AZWConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to AZW...');
        this.converter.updateProgress(10, 'Initializing AZW generator...');
        
        // AZW is essentially MOBI with DRM metadata
        const azwData = this.generateAZWData();
        
        this.converter.updateProgress(95, 'Creating download...');
        
        // Create and download file
        const blob = new Blob([azwData], { type: 'application/vnd.amazon.ebook' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.azw`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }

    generateAZWData() {
        this.converter.updateProgress(20, 'Building AZW structure...');
        
        // AZW uses similar structure to MOBI but with Amazon DRM headers
        const htmlContent = this.generateKindleHTML();
        const htmlBytes = new TextEncoder().encode(htmlContent);
        
        this.converter.updateProgress(40, 'Creating AZW headers...');
        
        // Create AZW-specific headers
        const azwHeader = this.createAZWHeader(htmlBytes.length);
        const palmHeader = this.createPalmHeader(azwHeader.length + htmlBytes.length, 'AZW');
        
        this.converter.updateProgress(80, 'Assembling AZW file...');
        
        // Combine headers and content
        const azwFile = new Uint8Array(palmHeader.length + azwHeader.length + htmlBytes.length);
        azwFile.set(palmHeader, 0);
        azwFile.set(azwHeader, palmHeader.length);
        azwFile.set(htmlBytes, palmHeader.length + azwHeader.length);
        
        return azwFile;
    }

    generateKindleHTML() {
        // Generate HTML optimized for Kindle devices
        let htmlContent = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <title>${this.converter.escapeHTML(this.converter.bookData.title)}</title>
    <style>
        body { 
            font-family: serif; 
            line-height: 1.6; 
            margin: 10px; 
            text-align: justify; 
        }
        h1 { 
            text-align: center; 
            page-break-before: always; 
            font-size: 1.8em; 
            margin-bottom: 0.5em; 
        }
        h2 { 
            text-align: center; 
            page-break-before: always; 
            font-size: 1.5em; 
            margin-top: 2em; 
        }
        h3 { 
            text-align: center; 
            margin-top: 1.5em; 
            font-size: 1.3em; 
        }
        .author { 
            text-align: center; 
            font-style: italic; 
            margin-bottom: 2em; 
        }
        .description { 
            text-align: justify; 
            margin-bottom: 2em; 
            font-style: italic; 
        }
        .chapter { 
            page-break-before: always; 
            margin-bottom: 2em; 
        }
        p { 
            text-align: justify; 
            text-indent: 1.5em; 
            margin-bottom: 1em; 
        }
        .no-indent { 
            text-indent: 0; 
        }
    </style>
</head>
<body>`;
        
        // Title and author
        htmlContent += `<h1>${this.converter.escapeHTML(this.converter.bookData.title)}</h1>`;
        htmlContent += `<p class="author no-indent">By ${this.converter.escapeHTML(this.converter.bookData.author)}</p>`;
        
        // Description
        if (this.converter.bookData.description) {
            htmlContent += `<p class="description">${this.converter.escapeHTML(this.converter.bookData.description)}</p>`;
        }
        
        // Content
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            htmlContent += `<h2>Volume ${volume.volume_index}: ${this.converter.escapeHTML(volume.volume_name)}</h2>`;
            
            volume.chapters.forEach((chapter, chapterIndex) => {
                htmlContent += `<div class="chapter">`;
                htmlContent += `<h3>Chapter ${chapter.chapter_index}: ${this.converter.escapeHTML(chapter.chapter_title)}</h3>`;
                
                // Process chapter content
                const paragraphs = chapter.chapter_content.split('\n\n');
                paragraphs.forEach((paragraph, index) => {
                    if (paragraph.trim()) {
                        const className = index === 0 ? 'no-indent' : '';
                        htmlContent += `<p class="${className}">${this.converter.escapeHTML(paragraph.trim())}</p>`;
                    }
                });
                
                htmlContent += `</div>`;
            });
        });
        
        htmlContent += `</body></html>`;
        return htmlContent;
    }

    createPalmHeader(contentLength, format = 'AZW') {
        const header = new ArrayBuffer(78);
        const view = new DataView(header);
        
        // Palm database header
        const title = this.converter.bookData.title.substring(0, 31).padEnd(32, '\0');
        for (let i = 0; i < Math.min(32, title.length); i++) {
            view.setUint8(i, title.charCodeAt(i));
        }
        
        // Attributes
        view.setUint16(32, 0x0000); // attributes
        view.setUint16(34, 0x0001); // version
        
        // Creation and modification dates (Palm epoch: 1904-01-01)
        const now = Math.floor(Date.now() / 1000) + 2082844800; // Convert to Palm epoch
        view.setUint32(36, now); // creation date
        view.setUint32(40, now); // modification date
        view.setUint32(44, 0);   // last backup date
        view.setUint32(48, 0);   // modification number
        view.setUint32(52, 0);   // app info ID
        view.setUint32(56, 0);   // sort info ID
        
        // Type and creator - AZW specific
        view.setUint32(60, 0x424F4F4B); // 'BOOK'
        view.setUint32(64, 0x5450455A); // 'TPEZ' (AZW creator)
        
        // Unique ID seed and next record list ID
        view.setUint32(68, 0);
        view.setUint32(72, 0);
        
        // Number of records
        view.setUint16(76, 2); // 2 records: header + content
        
        return new Uint8Array(header);
    }

    createAZWHeader(contentLength) {
        // Create AZW-specific header (similar to MOBI but with DRM fields)
        const header = new ArrayBuffer(248);
        const view = new DataView(header);
        
        // MOBI header identifier
        view.setUint32(0, 0x4D4F4249); // 'MOBI'
        
        // Header length
        view.setUint32(4, 248);
        
        // MOBI type (2 = Mobipocket Book)
        view.setUint32(8, 2);
        
        // Text encoding (UTF-8)
        view.setUint32(12, 65001);
        
        // Unique ID
        view.setUint32(16, Math.floor(Math.random() * 0xFFFFFFFF));
        
        // File version
        view.setUint32(20, 6);
        
        // DRM offset (AZW-specific)
        view.setUint32(64, 0);
        
        // DRM count (AZW-specific)
        view.setUint32(68, 0);
        
        // Title offset and length
        view.setUint32(84, 248);
        view.setUint32(88, this.converter.bookData.title.length);
        
        // Language (English)
        view.setUint32(92, 9);
        
        // Set the title at the end of the header
        const titleBytes = new TextEncoder().encode(this.converter.bookData.title);
        const fullHeader = new Uint8Array(248 + titleBytes.length);
        fullHeader.set(new Uint8Array(header), 0);
        fullHeader.set(titleBytes, 248);
        
        return fullHeader;
    }
}

// Export for use in main script
window.AZWConverter = AZWConverter; 