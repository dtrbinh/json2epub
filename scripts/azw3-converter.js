class AZW3Converter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to AZW3...');
        this.converter.updateProgress(10, 'Initializing AZW3 generator...');
        
        // AZW3 is based on EPUB but with Amazon-specific features
        const azw3Data = await this.generateAZW3Data();
        
        this.converter.updateProgress(95, 'Creating download...');
        
        // Create and download file
        const blob = new Blob([azw3Data], { type: 'application/vnd.amazon.mobi8-ebook' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.azw3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }

    async generateAZW3Data() {
        this.converter.updateProgress(20, 'Building AZW3 structure...');
        
        // AZW3 uses EPUB structure but with Amazon-specific metadata
        const zip = new JSZip();
        
        // Add META-INF
        zip.file('META-INF/container.xml', this.generateContainerXML());
        
        this.converter.updateProgress(30, 'Adding AZW3 metadata...');
        
        // Add content with AZW3-specific features
        const contentOPF = this.generateAZW3ContentOPF();
        zip.file('OEBPS/content.opf', contentOPF);
        
        // Add navigation files
        zip.file('OEBPS/toc.ncx', this.generateTOCNCX());
        zip.file('OEBPS/toc.xhtml', this.generateTOCXHTML());
        
        this.converter.updateProgress(50, 'Processing chapters...');
        
        // Add chapters
        const totalChapters = this.converter.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
        let processedChapters = 0;
        
        for (const volume of this.converter.bookData.content) {
            for (const chapter of volume.chapters) {
                const chapterFile = `vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                const chapterContent = this.generateChapterXHTML(volume, chapter);
                zip.file(`OEBPS/content/${chapterFile}`, chapterContent);
                
                processedChapters++;
                this.converter.updateProgress(50 + (processedChapters / totalChapters) * 30, 
                    `Processing chapter ${processedChapters} of ${totalChapters}...`);
            }
        }
        
        // Add cover image if available
        if (this.converter.bookData.cover && this.converter.coverImageData) {
            const coverData = this.converter.coverImageData.data.split(',')[1]; // Remove data URL prefix
            zip.file(`OEBPS/images/cover.${this.converter.coverImageData.extension}`, coverData, {base64: true});
        }
        
        // Add AZW3 CSS
        zip.file('OEBPS/styles/style.css', this.generateAZW3CSS());
        
        this.converter.updateProgress(90, 'Finalizing AZW3 file...');
        
        // Generate ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return zipBlob;
    }

    generateContainerXML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
    }

    generateAZW3ContentOPF() {
        // Generate OPF with AZW3-specific metadata
        const uuid = this.converter.generateUUID();
        const now = new Date().toISOString();
        
        let opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId" prefix="calibre: https://calibre-ebook.com">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>${this.converter.escapeXML(this.converter.bookData.title)}</dc:title>
        <dc:creator opf:role="aut">${this.converter.escapeXML(this.converter.bookData.author)}</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="BookId">${uuid}</dc:identifier>
        <meta property="dcterms:modified">${now}</meta>
        <dc:description>${this.converter.escapeXML(this.converter.bookData.description || '')}</dc:description>
        <dc:publisher>JSON2eBook Converter</dc:publisher>
        <dc:rights>All rights reserved</dc:rights>
        <dc:date>${now}</dc:date>
        
        <!-- AZW3 specific metadata -->
        <meta name="cover" content="cover-image"/>
        <meta name="calibre:series_index" content="1"/>
        <meta name="calibre:timestamp" content="${now}"/>
        <meta name="calibre:title_sort" content="${this.converter.escapeXML(this.converter.bookData.title)}"/>
        <meta name="calibre:author_link_map" content="{}"/>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
        <item id="css" href="styles/style.css" media-type="text/css"/>`;
        
        // Add cover image if available
        if (this.converter.bookData.cover && this.converter.coverImageData) {
            opf += `
        <item id="cover-image" href="images/cover.${this.converter.coverImageData.extension}" media-type="image/${this.converter.coverImageData.extension === 'jpg' ? 'jpeg' : this.converter.coverImageData.extension}" properties="cover-image"/>`;
        }
        
        // Add chapters
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            volume.chapters.forEach((chapter, chapterIndex) => {
                const chapterFile = `vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                const chapterId = `vol${volume.volume_index}_ch${chapter.chapter_index}`;
                opf += `
        <item id="${chapterId}" href="content/${chapterFile}" media-type="application/xhtml+xml"/>`;
            });
        });
        
        opf += `
    </manifest>
    <spine toc="ncx">`;
        
        // Add spine items
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            volume.chapters.forEach((chapter, chapterIndex) => {
                const chapterId = `vol${volume.volume_index}_ch${chapter.chapter_index}`;
                opf += `
        <itemref idref="${chapterId}"/>`;
            });
        });
        
        opf += `
    </spine>
</package>`;
        
        return opf;
    }

    generateTOCNCX() {
        const uuid = this.converter.generateUUID();
        
        let ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${uuid}"/>
        <meta name="dtb:depth" content="2"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>${this.converter.escapeXML(this.converter.bookData.title)}</text>
    </docTitle>
    <navMap>`;
        
        let playOrder = 1;
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            volume.chapters.forEach((chapter, chapterIndex) => {
                const chapterFile = `content/vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                const chapterTitle = `${volume.volume_name} - ${chapter.chapter_title}`;
                ncx += `
        <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
            <navLabel>
                <text>${this.converter.escapeXML(chapterTitle)}</text>
            </navLabel>
            <content src="${chapterFile}"/>
        </navPoint>`;
                playOrder++;
            });
        });
        
        ncx += `
    </navMap>
</ncx>`;
        
        return ncx;
    }

    generateTOCXHTML() {
        let toc = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>Table of Contents</title>
    <link rel="stylesheet" href="styles/style.css"/>
</head>
<body>
    <nav epub:type="toc" id="toc">
        <h1>Table of Contents</h1>
        <ol>`;
        
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            toc += `
            <li><span>${this.converter.escapeXML(volume.volume_name)}</span>
                <ol>`;
            
            volume.chapters.forEach((chapter, chapterIndex) => {
                const chapterFile = `content/vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                toc += `
                    <li><a href="${chapterFile}">${this.converter.escapeXML(chapter.chapter_title)}</a></li>`;
            });
            
            toc += `
                </ol>
            </li>`;
        });
        
        toc += `
        </ol>
    </nav>
</body>
</html>`;
        
        return toc;
    }

    generateChapterXHTML(volume, chapter) {
        const content = this.formatChapterContent(chapter.chapter_content);
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${this.converter.escapeXML(chapter.chapter_title)}</title>
    <link rel="stylesheet" href="../styles/style.css"/>
</head>
<body>
    <h1>${this.converter.escapeXML(chapter.chapter_title)}</h1>
    ${content}
</body>
</html>`;
    }

    formatChapterContent(content) {
        // Split content into paragraphs and wrap in <p> tags
        const paragraphs = content.split('\n\n');
        return paragraphs.map(p => p.trim() ? `<p>${this.converter.escapeXML(p.trim())}</p>` : '').join('\n    ');
    }

    generateAZW3CSS() {
        // Generate CSS optimized for AZW3/Kindle
        return `
@namespace h "http://www.w3.org/1999/xhtml";

body {
    font-family: serif;
    line-height: 1.6;
    margin: 0;
    padding: 10px;
    text-align: justify;
}

h1, h2, h3 {
    text-align: center;
    font-weight: bold;
    page-break-after: avoid;
}

h1 {
    font-size: 1.8em;
    margin: 2em 0 1em 0;
    page-break-before: always;
}

h2 {
    font-size: 1.5em;
    margin: 2em 0 1em 0;
    page-break-before: always;
}

h3 {
    font-size: 1.3em;
    margin: 1.5em 0 1em 0;
}

p {
    text-align: justify;
    text-indent: 1.5em;
    margin: 0 0 1em 0;
    orphans: 2;
    widows: 2;
}

.no-indent {
    text-indent: 0;
}

.author {
    text-align: center;
    font-style: italic;
    margin-bottom: 2em;
}

.description {
    font-style: italic;
    margin-bottom: 2em;
}

.chapter {
    page-break-before: always;
    margin-bottom: 2em;
}

/* Kindle-specific improvements */
@media amzn-kf8 {
    body {
        font-size: 1em;
    }
    
    h1 {
        font-size: 1.6em;
    }
    
    h2 {
        font-size: 1.4em;
    }
    
    h3 {
        font-size: 1.2em;
    }
}
`;
    }
}

// Export for use in main script
window.AZW3Converter = AZW3Converter; 