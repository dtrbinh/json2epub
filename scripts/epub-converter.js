class EPUBConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to EPUB...');
        this.converter.updateProgress(10, 'Initializing EPUB generator...');
        
        const zip = new JSZip();
        
        // Add mimetype file (must be first and uncompressed)
        zip.file('mimetype', 'application/epub+zip', {compression: 'STORE'});
        
        // Add META-INF
        zip.file('META-INF/container.xml', this.generateContainerXML());
        
        this.converter.updateProgress(20, 'Adding metadata...');
        
        // Add OEBPS structure
        zip.file('OEBPS/content.opf', this.generateContentOPF());
        zip.file('OEBPS/toc.ncx', this.generateTOCNCX());
        zip.file('OEBPS/toc.xhtml', this.generateTOCXHTML());
        
        this.converter.updateProgress(30, 'Processing chapters...');
        
        // Add chapters
        const totalChapters = this.converter.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
        let processedChapters = 0;
        
        for (const volume of this.converter.bookData.content) {
            for (const chapter of volume.chapters) {
                const chapterFile = `vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                const chapterContent = this.generateChapterXHTML(volume, chapter);
                zip.file(`OEBPS/content/${chapterFile}`, chapterContent);
                
                processedChapters++;
                this.converter.updateProgress(30 + (processedChapters / totalChapters) * 50, 
                    `Processing chapter ${processedChapters} of ${totalChapters}...`);
            }
        }
        
        this.converter.updateProgress(85, 'Adding styles and images...');
        
        // Add cover image if available
        if (this.converter.bookData.cover && this.converter.coverImageData) {
            const coverData = this.converter.coverImageData.data.split(',')[1]; // Remove data URL prefix
            zip.file(`OEBPS/images/cover.${this.converter.coverImageData.extension}`, coverData, {base64: true});
        }
        
        // Add CSS
        zip.file('OEBPS/styles/style.css', this.generateCSS());
        
        this.converter.updateProgress(95, 'Finalizing EPUB...');
        
        // Generate EPUB
        const epubBlob = await zip.generateAsync({ type: 'blob' });
        
        // Download
        const url = URL.createObjectURL(epubBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }

    generateContainerXML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
    }

    generateContentOPF() {
        const uuid = this.converter.generateUUID();
        const now = new Date().toISOString();
        
        let opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${this.converter.escapeXML(this.converter.bookData.title)}</dc:title>
        <dc:creator>${this.converter.escapeXML(this.converter.bookData.author)}</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="BookId">${uuid}</dc:identifier>
        <meta property="dcterms:modified">${now}</meta>
        <dc:description>${this.converter.escapeXML(this.converter.bookData.description || '')}</dc:description>
        <dc:publisher>JSON2EPUB Converter</dc:publisher>
        <dc:rights>All rights reserved</dc:rights>
        <dc:date>${now}</dc:date>`;
        
        if (this.converter.bookData.cover && this.converter.coverImageData) {
            opf += `
        <meta name="cover" content="cover-image"/>`;
        }
        
        opf += `
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

    generateCSS() {
        return `body {
    font-family: Georgia, serif;
    line-height: 1.6;
    margin: 2em;
    color: #333;
}

h1 {
    color: #2c3e50;
    font-size: 2em;
    margin-bottom: 1em;
    text-align: center;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5em;
}

h2 {
    color: #34495e;
    font-size: 1.5em;
    margin-top: 2em;
    margin-bottom: 1em;
}

h3 {
    color: #2c3e50;
    font-size: 1.2em;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
}

p {
    margin-bottom: 1em;
    text-align: justify;
    text-indent: 2em;
}

p:first-child {
    text-indent: 0;
}

/* Table of Contents */
nav#toc ol {
    list-style-type: none;
    padding-left: 0;
}

nav#toc ol ol {
    padding-left: 2em;
    list-style-type: decimal;
}

nav#toc a {
    color: #3498db;
    text-decoration: none;
    padding: 0.2em 0;
    display: block;
}

nav#toc a:hover {
    color: #2980b9;
    text-decoration: underline;
}

nav#toc span {
    font-weight: bold;
    color: #2c3e50;
    font-size: 1.1em;
}

@media screen and (max-width: 600px) {
    body {
        margin: 1em;
        font-size: 0.9em;
    }
    
    h1 {
        font-size: 1.5em;
    }
    
    h2 {
        font-size: 1.3em;
    }
    
    h3 {
        font-size: 1.1em;
    }
}`;
    }
}

// Export for use in main script
window.EPUBConverter = EPUBConverter; 