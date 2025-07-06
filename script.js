class JSONToEPUBConverter {
    constructor() {
        this.bookData = null;
        this.coverImageData = null;
        this.initializeEventListeners();
        this.showHelpExample();
    }

    initializeEventListeners() {
        // File upload elements
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseLink = document.getElementById('browseLink');
        
        // Drag and drop
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // File input
        browseLink.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Convert button
        document.getElementById('convertBtn').addEventListener('click', this.convertToEPUB.bind(this));
        
        // Retry button
        document.getElementById('retryBtn').addEventListener('click', this.resetApp.bind(this));
        
        // Help modal
        document.getElementById('showHelp').addEventListener('click', this.showHelpModal.bind(this));
        document.getElementById('closeModal').addEventListener('click', this.closeHelpModal.bind(this));
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('helpModal')) {
                this.closeHelpModal();
            }
        });
    }

    showHelpExample() {
        const exampleJSON = {
            "title": "The Great Adventure",
            "description": "An epic tale of courage and discovery.",
            "author": "Jane Doe",
            "cover": "https://example.com/cover.jpg",
            "content": [
                {
                    "volume_index": 1,
                    "volume_name": "The Beginning",
                    "chapters": [
                        {
                            "chapter_index": 1,
                            "chapter_title": "The Journey Starts",
                            "chapter_content": "It was a bright morning when..."
                        },
                        {
                            "chapter_index": 2,
                            "chapter_title": "First Challenge",
                            "chapter_content": "The path ahead was treacherous..."
                        }
                    ]
                }
            ]
        };
        
        document.getElementById('jsonExample').textContent = JSON.stringify(exampleJSON, null, 2);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        try {
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.json')) {
                throw new Error('Please select a JSON file.');
            }

            // Validate file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('File size must be less than 50MB.');
            }

            // Show file info
            this.showFileInfo(file);

            // Read file content
            const content = await this.readFileContent(file);
            
            // Parse and validate JSON
            this.bookData = JSON.parse(content);
            this.validateBookData(this.bookData);

            // Load cover image if available
            if (this.bookData.cover) {
                await this.loadCoverImage(this.bookData.cover);
            }

            // Show preview
            this.showPreview();
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    validateBookData(data) {
        const errors = [];

        // Check required fields
        if (!data.title || typeof data.title !== 'string') {
            errors.push('Missing or invalid "title" field');
        }
        if (!data.author || typeof data.author !== 'string') {
            errors.push('Missing or invalid "author" field');
        }
        if (!data.content || !Array.isArray(data.content)) {
            errors.push('Missing or invalid "content" field (must be an array)');
        }

        // Validate content structure
        if (data.content && Array.isArray(data.content)) {
            data.content.forEach((volume, volumeIndex) => {
                if (!volume.volume_name || typeof volume.volume_name !== 'string') {
                    errors.push(`Volume ${volumeIndex + 1}: Missing or invalid "volume_name"`);
                }
                if (!volume.chapters || !Array.isArray(volume.chapters)) {
                    errors.push(`Volume ${volumeIndex + 1}: Missing or invalid "chapters" field`);
                } else {
                    volume.chapters.forEach((chapter, chapterIndex) => {
                        if (!chapter.chapter_title || typeof chapter.chapter_title !== 'string') {
                            errors.push(`Volume ${volumeIndex + 1}, Chapter ${chapterIndex + 1}: Missing or invalid "chapter_title"`);
                        }
                        if (!chapter.chapter_content || typeof chapter.chapter_content !== 'string') {
                            errors.push(`Volume ${volumeIndex + 1}, Chapter ${chapterIndex + 1}: Missing or invalid "chapter_content"`);
                        }
                    });
                }
            });
        }

        if (errors.length > 0) {
            throw new Error('JSON validation failed:\n' + errors.join('\n'));
        }
    }

    async loadCoverImage(coverUrl) {
        try {
            const response = await fetch(coverUrl);
            if (!response.ok) {
                throw new Error('Failed to load cover image');
            }
            
            const blob = await response.blob();
            
            // Validate image type
            if (!blob.type.startsWith('image/')) {
                throw new Error('Cover URL must point to an image file');
            }
            
            // Convert to base64
            const reader = new FileReader();
            reader.onload = e => {
                this.coverImageData = {
                    data: e.target.result,
                    type: blob.type,
                    extension: blob.type.split('/')[1]
                };
            };
            reader.readAsDataURL(blob);
            
        } catch (error) {
            console.warn('Failed to load cover image:', error.message);
            this.coverImageData = null;
        }
    }

    showPreview() {
        const data = this.bookData;
        
        // Update book info
        document.getElementById('bookTitle').textContent = data.title;
        document.getElementById('bookAuthor').textContent = `by ${data.author}`;
        document.getElementById('bookDescription').textContent = data.description || 'No description available';
        
        // Update cover
        const bookCover = document.getElementById('bookCover');
        if (this.coverImageData) {
            bookCover.innerHTML = `<img src="${this.coverImageData.data}" alt="Book Cover">`;
        } else {
            bookCover.innerHTML = '📖';
        }
        
        // Update stats
        const totalChapters = data.content.reduce((total, volume) => total + volume.chapters.length, 0);
        document.getElementById('volumeCount').textContent = `${data.content.length} Volume${data.content.length > 1 ? 's' : ''}`;
        document.getElementById('chapterCount').textContent = `${totalChapters} Chapter${totalChapters > 1 ? 's' : ''}`;
        
        // Update content preview
        const volumeList = document.getElementById('volumeList');
        volumeList.innerHTML = '';
        
        data.content.forEach(volume => {
            const volumeDiv = document.createElement('div');
            volumeDiv.className = 'volume-item';
            
            const volumeTitle = document.createElement('div');
            volumeTitle.className = 'volume-title';
            volumeTitle.textContent = `Volume ${volume.volume_index}: ${volume.volume_name}`;
            
            const chapterList = document.createElement('div');
            chapterList.className = 'chapter-list';
            
            volume.chapters.forEach(chapter => {
                const chapterDiv = document.createElement('div');
                chapterDiv.className = 'chapter-item';
                chapterDiv.textContent = `Ch. ${chapter.chapter_index}: ${chapter.chapter_title}`;
                chapterList.appendChild(chapterDiv);
            });
            
            volumeDiv.appendChild(volumeTitle);
            volumeDiv.appendChild(chapterList);
            volumeList.appendChild(volumeDiv);
        });
        
        // Show preview and convert sections
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('convertSection').style.display = 'block';
        document.getElementById('errorSection').style.display = 'none';
    }

    async convertToEPUB() {
        try {
            const convertBtn = document.getElementById('convertBtn');
            const btnText = document.querySelector('.btn-text');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            // Disable button and show loading
            convertBtn.disabled = true;
            btnText.textContent = 'Converting...';
            loadingSpinner.style.display = 'inline-block';
            progressBar.style.display = 'block';
            
            // Create EPUB
            const zip = new JSZip();
            
            // Update progress
            this.updateProgress(10, 'Creating EPUB structure...');
            
            // Add mimetype
            zip.file('mimetype', 'application/epub+zip');
            
            // Add META-INF
            zip.folder('META-INF');
            zip.file('META-INF/container.xml', this.generateContainerXML());
            
            // Add OEBPS folder
            const oebps = zip.folder('OEBPS');
            
            this.updateProgress(20, 'Generating metadata...');
            
            // Add content.opf
            oebps.file('content.opf', this.generateContentOPF());
            
            // Add table of contents
            oebps.file('toc.ncx', this.generateTOCNCX());
            oebps.file('toc.xhtml', this.generateTOCXHTML());
            
            this.updateProgress(30, 'Adding styles...');
            
            // Add styles
            const styles = oebps.folder('styles');
            styles.file('style.css', this.generateCSS());
            
            // Add images folder and cover
            if (this.coverImageData) {
                this.updateProgress(40, 'Processing cover image...');
                const images = oebps.folder('images');
                const coverData = this.coverImageData.data.split(',')[1]; // Remove data URL prefix
                images.file(`cover.${this.coverImageData.extension}`, coverData, {base64: true});
            }
            
            this.updateProgress(50, 'Generating chapters...');
            
            // Add content folder and chapters
            const content = oebps.folder('content');
            const totalChapters = this.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
            let processedChapters = 0;
            
            this.bookData.content.forEach(volume => {
                volume.chapters.forEach(chapter => {
                    const chapterFileName = `vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                    const chapterContent = this.generateChapterXHTML(volume, chapter);
                    content.file(chapterFileName, chapterContent);
                    
                    processedChapters++;
                    const progress = 50 + (processedChapters / totalChapters) * 40;
                    this.updateProgress(progress, `Processing chapter ${processedChapters} of ${totalChapters}...`);
                });
            });
            
            this.updateProgress(95, 'Finalizing EPUB...');
            
            // Generate EPUB file
            const epubBlob = await zip.generateAsync({
                type: 'blob',
                mimeType: 'application/epub+zip',
                compression: 'DEFLATE'
            });
            
            this.updateProgress(100, 'Download ready!');
            
            // Create download link
            const url = URL.createObjectURL(epubBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Reset button
            setTimeout(() => {
                convertBtn.disabled = false;
                btnText.textContent = '🚀 Convert to EPUB';
                loadingSpinner.style.display = 'none';
                progressBar.style.display = 'none';
                this.updateProgress(0, '');
            }, 2000);
            
        } catch (error) {
            this.showError(`Conversion failed: ${error.message}`);
            this.resetConvertButton();
        }
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = text;
    }

    resetConvertButton() {
        const convertBtn = document.getElementById('convertBtn');
        const btnText = document.querySelector('.btn-text');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const progressBar = document.getElementById('progressBar');
        
        convertBtn.disabled = false;
        btnText.textContent = '🚀 Convert to EPUB';
        loadingSpinner.style.display = 'none';
        progressBar.style.display = 'none';
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
        const data = this.bookData;
        const uuid = 'urn:uuid:' + this.generateUUID();
        const currentDate = new Date().toISOString();
        
        let manifest = '';
        let spine = '';
        
        // Add cover image to manifest
        if (this.coverImageData) {
            manifest += `    <item id="cover-image" href="images/cover.${this.coverImageData.extension}" media-type="${this.coverImageData.type}"/>\n`;
        }
        
        // Add chapters to manifest and spine
        data.content.forEach(volume => {
            volume.chapters.forEach(chapter => {
                const chapterFileName = `vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                const chapterId = `vol${volume.volume_index}_ch${chapter.chapter_index}`;
                
                manifest += `    <item id="${chapterId}" href="content/${chapterFileName}" media-type="application/xhtml+xml"/>\n`;
                spine += `    <itemref idref="${chapterId}"/>\n`;
            });
        });
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${uuid}</dc:identifier>
    <dc:title>${this.escapeXML(data.title)}</dc:title>
    <dc:creator>${this.escapeXML(data.author)}</dc:creator>
    <dc:description>${this.escapeXML(data.description || '')}</dc:description>
    <dc:language>en</dc:language>
    <dc:date>${currentDate}</dc:date>
    <meta name="cover" content="cover-image"/>
  </metadata>
  
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="styles/style.css" media-type="text/css"/>
${manifest}  </manifest>
  
  <spine toc="ncx">
    <itemref idref="toc"/>
${spine}  </spine>
  
  <guide>
    <reference type="toc" title="Table of Contents" href="toc.xhtml"/>
  </guide>
</package>`;
    }

    generateTOCNCX() {
        const data = this.bookData;
        const uuid = 'urn:uuid:' + this.generateUUID();
        
        let navPoints = '';
        let playOrder = 2; // Start at 2 (1 is for TOC itself)
        
        data.content.forEach(volume => {
            volume.chapters.forEach(chapter => {
                const chapterFileName = `content/vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                const chapterTitle = `${volume.volume_name} - ${chapter.chapter_title}`;
                
                navPoints += `    <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
      <navLabel>
        <text>${this.escapeXML(chapterTitle)}</text>
      </navLabel>
      <content src="${chapterFileName}"/>
    </navPoint>
`;
                playOrder++;
            });
        });
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  
  <docTitle>
    <text>${this.escapeXML(data.title)}</text>
  </docTitle>
  
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>Table of Contents</text>
      </navLabel>
      <content src="toc.xhtml"/>
    </navPoint>
${navPoints}  </navMap>
</ncx>`;
    }

    generateTOCXHTML() {
        const data = this.bookData;
        
        let tocEntries = '';
        
        data.content.forEach(volume => {
            tocEntries += `        <li><strong>${this.escapeXML(volume.volume_name)}</strong>
          <ol>
`;
            
            volume.chapters.forEach(chapter => {
                const chapterFileName = `content/vol${volume.volume_index}_ch${chapter.chapter_index}.xhtml`;
                tocEntries += `            <li><a href="${chapterFileName}">${this.escapeXML(chapter.chapter_title)}</a></li>
`;
            });
            
            tocEntries += `          </ol>
        </li>
`;
        });
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" href="styles/style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocEntries}    </ol>
  </nav>
</body>
</html>`;
    }

    generateChapterXHTML(volume, chapter) {
        const chapterTitle = `${volume.volume_name} - ${chapter.chapter_title}`;
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeXML(chapterTitle)}</title>
  <link rel="stylesheet" href="../styles/style.css"/>
</head>
<body>
  <div class="chapter">
    <h1>${this.escapeXML(chapter.chapter_title)}</h1>
    <div class="content">
      ${this.formatChapterContent(chapter.chapter_content)}
    </div>
  </div>
</body>
</html>`;
    }

    formatChapterContent(content) {
        // Split content into paragraphs and wrap in <p> tags
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
        return paragraphs.map(p => `<p>${this.escapeXML(p.trim())}</p>`).join('\n    ');
    }

    generateCSS() {
        return `/* EPUB Styles */
body {
  font-family: serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  color: #333;
}

h1, h2, h3, h4, h5, h6 {
  color: #2c3e50;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2em;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

p {
  margin-bottom: 1em;
  text-align: justify;
  text-indent: 1.5em;
}

.chapter {
  max-width: 800px;
  margin: 0 auto;
}

.content {
  margin-top: 2em;
}

/* Table of Contents */
nav#toc ol {
  list-style-type: none;
  padding-left: 0;
}

nav#toc ol ol {
  padding-left: 20px;
  margin-top: 10px;
}

nav#toc li {
  margin-bottom: 8px;
}

nav#toc a {
  text-decoration: none;
  color: #3498db;
  font-size: 1.1em;
}

nav#toc a:hover {
  text-decoration: underline;
}

/* Responsive */
@media screen and (max-width: 600px) {
  body {
    padding: 10px;
  }
  
  h1 {
    font-size: 1.5em;
  }
}`;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    escapeXML(text) {
        return text.replace(/[<>&'"]/g, function(c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('convertSection').style.display = 'none';
    }

    showHelpModal() {
        document.getElementById('helpModal').style.display = 'block';
    }

    closeHelpModal() {
        document.getElementById('helpModal').style.display = 'none';
    }

    resetApp() {
        // Reset all data
        this.bookData = null;
        this.coverImageData = null;
        
        // Reset UI
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('convertSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
        document.getElementById('uploadArea').classList.remove('dragover');
        
        this.resetConvertButton();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new JSONToEPUBConverter();
}); 