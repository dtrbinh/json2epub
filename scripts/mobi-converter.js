class MOBIConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to MOBI...');
        this.converter.updateProgress(10, 'Initializing MOBI generator...');
        
        // Create MOBI structure
        const mobiData = this.generateMOBIData();
        
        this.converter.updateProgress(95, 'Creating download...');
        
        // Create and download file
        const blob = new Blob([mobiData], { type: 'application/x-mobipocket-ebook' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mobi`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }

    generateMOBIData() {
        this.converter.updateProgress(20, 'Building MOBI structure...');
        
        // Create HTML content for MOBI
        let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.converter.bookData.title}</title>
    <style>
        body { font-family: serif; line-height: 1.6; margin: 20px; }
        h1 { text-align: center; page-break-before: always; }
        h2 { text-align: center; page-break-before: always; }
        h3 { text-align: center; margin-top: 30px; }
        .author { text-align: center; font-style: italic; margin-bottom: 30px; }
        .description { text-align: justify; margin-bottom: 30px; }
        .chapter { page-break-before: always; }
        p { text-align: justify; text-indent: 2em; margin-bottom: 1em; }
    </style>
</head>
<body>`;
        
        // Title and author
        htmlContent += `<h1>${this.converter.escapeHTML(this.converter.bookData.title)}</h1>`;
        htmlContent += `<p class="author">By ${this.converter.escapeHTML(this.converter.bookData.author)}</p>`;
        
        // Description
        if (this.converter.bookData.description) {
            htmlContent += `<p class="description">${this.converter.escapeHTML(this.converter.bookData.description)}</p>`;
        }
        
        this.converter.updateProgress(40, 'Processing content...');
        
        // Content
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            htmlContent += `<h2>Volume ${volume.volume_index}: ${this.converter.escapeHTML(volume.volume_name)}</h2>`;
            
            volume.chapters.forEach((chapter, chapterIndex) => {
                htmlContent += `<div class="chapter">`;
                htmlContent += `<h3>Chapter ${chapter.chapter_index}: ${this.converter.escapeHTML(chapter.chapter_title)}</h3>`;
                
                // Process chapter content
                const paragraphs = chapter.chapter_content.split('\n\n');
                paragraphs.forEach(paragraph => {
                    if (paragraph.trim()) {
                        htmlContent += `<p>${this.converter.escapeHTML(paragraph.trim())}</p>`;
                    }
                });
                
                htmlContent += `</div>`;
            });
        });
        
        htmlContent += `</body></html>`;
        
        this.converter.updateProgress(60, 'Creating MOBI file structure...');
        
        // Create a simplified MOBI structure
        const htmlBytes = new TextEncoder().encode(htmlContent);
        const mobiHeader = this.createMOBIHeader(htmlBytes.length);
        const palmHeader = this.createPalmHeader(mobiHeader.length + htmlBytes.length);
        
        this.converter.updateProgress(80, 'Assembling MOBI file...');
        
        // Combine headers and content
        const mobiFile = new Uint8Array(palmHeader.length + mobiHeader.length + htmlBytes.length);
        mobiFile.set(palmHeader, 0);
        mobiFile.set(mobiHeader, palmHeader.length);
        mobiFile.set(htmlBytes, palmHeader.length + mobiHeader.length);
        
        return mobiFile;
    }
    
    createPalmHeader(contentLength, format = 'MOBI') {
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
        
        // Type and creator - different for AZW
        view.setUint32(60, 0x424F4F4B); // 'BOOK'
        if (format === 'AZW') {
            view.setUint32(64, 0x5450455A); // 'TPEZ' (AZW creator)
        } else {
            view.setUint32(64, 0x4D4F4249); // 'MOBI'
        }
        
        // Unique ID seed and next record list ID
        view.setUint32(68, 0);
        view.setUint32(72, 0);
        
        // Number of records
        view.setUint16(76, 2); // 2 records: header + content
        
        return new Uint8Array(header);
    }
    
    createMOBIHeader(contentLength) {
        const header = new ArrayBuffer(232);
        const view = new DataView(header);
        
        // MOBI header identifier
        view.setUint32(0, 0x4D4F4249); // 'MOBI'
        
        // Header length
        view.setUint32(4, 232);
        
        // MOBI type (2 = Mobipocket Book)
        view.setUint32(8, 2);
        
        // Text encoding (UTF-8)
        view.setUint32(12, 65001);
        
        // Unique ID
        view.setUint32(16, Math.floor(Math.random() * 0xFFFFFFFF));
        
        // File version
        view.setUint32(20, 6);
        
        // First non-book record number
        view.setUint32(68, 1);
        
        // First image record number
        view.setUint32(72, 0);
        
        // First HuffmanRecord record number
        view.setUint32(76, 0);
        
        // Number of HuffmanRecord records
        view.setUint32(80, 0);
        
        // Title offset and length
        view.setUint32(84, 232); // Title starts after header
        view.setUint32(88, this.converter.bookData.title.length);
        
        // Language (English)
        view.setUint32(92, 9);
        
        // Min version
        view.setUint32(96, 6);
        
        // Set the title at the end of the header
        const titleBytes = new TextEncoder().encode(this.converter.bookData.title);
        const fullHeader = new Uint8Array(232 + titleBytes.length);
        fullHeader.set(new Uint8Array(header), 0);
        fullHeader.set(titleBytes, 232);
        
        return fullHeader;
    }
}

// Export for use in main script
window.MOBIConverter = MOBIConverter; 