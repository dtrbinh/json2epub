class JSONToEPUBConverter {
    constructor() {
        this.bookData = null;
        this.coverImageData = null;
        this.initializeEventListeners();
        this.showHelpExample();
        this.updateConvertButton();
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
        
        // Format selection
        const formatOptions = document.querySelectorAll('input[name="outputFormat"]');
        formatOptions.forEach(option => {
            option.addEventListener('change', this.updateConvertButton.bind(this));
        });
        
        // Convert button
        document.getElementById('convertBtn').addEventListener('click', this.convertToFormat.bind(this));
        
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
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
            this.coverImageData = {
                data: dataUrl,
                type: blob.type,
                extension: blob.type.split('/')[1]
            };
            
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

    updateConvertButton() {
        const selectedFormat = document.querySelector('input[name="outputFormat"]:checked');
        const btnText = document.querySelector('.btn-text');
        
        if (selectedFormat && btnText) {
            const formatName = selectedFormat.value.toUpperCase();
            const formatEmojis = {
                'epub': '📚',
                'mobi': '📱',
                'azw': '🔒',
                'azw3': '🚀',
                'pdf': '📄',
                'html': '🌐',
                'txt': '📝',
                'rtf': '📋'
            };
            
            const emoji = formatEmojis[selectedFormat.value] || '🚀';
            btnText.textContent = `${emoji} Convert to ${formatName}`;
        }
    }

    async convertToFormat() {
        try {
            const selectedRadio = document.querySelector('input[name="outputFormat"]:checked');
            if (!selectedRadio) {
                this.showError('Please select a format first');
                return;
            }
            const selectedFormat = selectedRadio.value;

            let converter;
            switch (selectedFormat) {
                case 'epub':
                    converter = new EPUBConverter(this);
                    break;
                case 'mobi':
                    converter = new MOBIConverter(this);
                    break;
                case 'azw':
                    converter = new AZWConverter(this);
                    break;
                case 'azw3':
                    converter = new AZW3Converter(this);
                    break;
                case 'pdf':
                    converter = new PDFConverter(this);
                    break;
                case 'html':
                    converter = new HTMLConverter(this);
                    break;
                case 'txt':
                    converter = new TXTConverter(this);
                    break;
                case 'rtf':
                    converter = new RTFConverter(this);
                    break;
                default:
                    throw new Error(`Unsupported format: ${selectedFormat}`);
            }

            await converter.convert();
        } catch (error) {
            this.showError(`Conversion failed: ${error.message}`);
            this.resetConvertButton();
        }
    }

    // Old conversion methods removed - now using modular converters
    // All conversion methods have been moved to separate modules in the scripts/ folder
    
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
        this.updateConvertButton();
        loadingSpinner.style.display = 'none';
        progressBar.style.display = 'none';
    }

    setConvertingState(message) {
        const convertBtn = document.getElementById('convertBtn');
        const btnText = document.querySelector('.btn-text');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const progressBar = document.getElementById('progressBar');
        
        convertBtn.disabled = true;
        btnText.textContent = message;
        loadingSpinner.style.display = 'inline-block';
        progressBar.style.display = 'block';
    }

    completeConversion() {
        this.updateProgress(100, 'Download ready!');
        
        setTimeout(() => {
            const convertBtn = document.getElementById('convertBtn');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const progressBar = document.getElementById('progressBar');
            
            convertBtn.disabled = false;
            this.updateConvertButton();
            loadingSpinner.style.display = 'none';
            progressBar.style.display = 'none';
            this.updateProgress(0, '');
        }, 2000);
    }

    generateHTMLCSS() {
        return `
body {
    font-family: Georgia, serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background: #fafafa;
    color: #333;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 40px;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
}

h1 {
    color: #2c3e50;
    font-size: 2.5em;
    margin-bottom: 0.5em;
    text-align: center;
    border-bottom: 3px solid #3498db;
    padding-bottom: 10px;
}

h2 {
    color: #34495e;
    font-size: 2em;
    margin-top: 2em;
    margin-bottom: 1em;
}

h3 {
    color: #2c3e50;
    font-size: 1.5em;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
}

.book-header {
    text-align: center;
    margin-bottom: 3em;
    padding-bottom: 2em;
    border-bottom: 1px solid #ddd;
}

.author {
    font-size: 1.2em;
    color: #666;
    margin-bottom: 1em;
}

.description {
    font-style: italic;
    color: #555;
    margin-bottom: 2em;
}

.volume-nav {
    background: #f8f9fa;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
}

.chapter-nav {
    margin: 20px 0;
}

.chapter-nav a, .volume-nav a {
    display: inline-block;
    margin: 5px 10px 5px 0;
    padding: 8px 15px;
    background: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.3s;
}

.chapter-nav a:hover, .volume-nav a:hover {
    background: #2980b9;
}

.chapter-content {
    margin-top: 2em;
}

.chapter-content p {
    margin-bottom: 1em;
    text-align: justify;
    text-indent: 2em;
}

.back-nav {
    margin-top: 3em;
    padding-top: 2em;
    border-top: 1px solid #ddd;
    text-align: center;
}

@media (max-width: 600px) {
    .container {
        padding: 20px;
    }
    
    h1 {
        font-size: 2em;
    }
    
    h2 {
        font-size: 1.5em;
    }
}
`;
    }

    generateHTMLIndex() {
        const data = this.bookData;
        
        let tocHTML = '';
        
        for (const volume of data.content) {
            tocHTML += `
                <div class="volume-nav">
                    <h3>${this.escapeHTML(volume.volume_name)}</h3>
                    <div class="chapter-nav">
`;
            
            for (const chapter of volume.chapters) {
                const fileName = `vol${volume.volume_index}_ch${chapter.chapter_index}.html`;
                tocHTML += `                        <a href="${fileName}">${this.escapeHTML(chapter.chapter_title)}</a>\n`;
            }
            
            tocHTML += `
                    </div>
                </div>
`;
        }
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(data.title)}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="book-header">
            <h1>${this.escapeHTML(data.title)}</h1>
            <p class="author">by ${this.escapeHTML(data.author)}</p>
            ${data.description ? `<p class="description">${this.escapeHTML(data.description)}</p>` : ''}
        </div>
        
        <h2>Table of Contents</h2>
        ${tocHTML}
    </div>
</body>
</html>`;
    }

    generateHTMLChapter(volume, chapter) {
        const data = this.bookData;
        
        // Format chapter content into paragraphs
        const paragraphs = chapter.chapter_content.split(/\n\s*\n/).filter(p => p.trim());
        const contentHTML = paragraphs.map(p => `                <p>${this.escapeHTML(p.trim())}</p>`).join('\n');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(chapter.chapter_title)} - ${this.escapeHTML(data.title)}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="book-header">
            <h1>${this.escapeHTML(data.title)}</h1>
            <p class="author">by ${this.escapeHTML(data.author)}</p>
        </div>
        
        <h2>${this.escapeHTML(volume.volume_name)}</h2>
        <h3>${this.escapeHTML(chapter.chapter_title)}</h3>
        
        <div class="chapter-content">
${contentHTML}
        </div>
        
        <div class="back-nav">
            <a href="index.html">← Back to Table of Contents</a>
        </div>
    </div>
</body>
</html>`;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRTF(text) {
        return text.replace(/\\/g, '\\\\')
                   .replace(/\{/g, '\\{')
                   .replace(/\}/g, '\\}')
                   .replace(/\n/g, '\\par ')
                   .replace(/[\u0080-\uFFFF]/g, (match) => {
                       return '\\u' + match.charCodeAt(0) + '?';
                   });
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
}
`;
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