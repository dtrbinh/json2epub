class HTMLConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to HTML...');
        this.converter.updateProgress(10, 'Creating HTML structure...');
        
        const zip = new JSZip();
        
        // Create CSS
        const css = this.generateCSS();
        zip.file('styles.css', css);
        
        this.converter.updateProgress(20, 'Generating index page...');
        
        // Create index.html
        let indexHTML = this.generateIndex();
        zip.file('index.html', indexHTML);
        
        this.converter.updateProgress(30, 'Creating chapter files...');
        
        const totalChapters = this.converter.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
        let processedChapters = 0;
        
        // Create chapter files
        for (const volume of this.converter.bookData.content) {
            for (const chapter of volume.chapters) {
                const fileName = `vol${volume.volume_index}_ch${chapter.chapter_index}.html`;
                const chapterHTML = this.generateChapter(volume, chapter);
                zip.file(fileName, chapterHTML);
                
                processedChapters++;
                this.converter.updateProgress(30 + (processedChapters / totalChapters) * 60, 
                    `Processing chapter ${processedChapters} of ${totalChapters}...`);
            }
        }
        
        this.converter.updateProgress(95, 'Creating download...');
        
        // Generate ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Download
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_html.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }

    generateCSS() {
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

.navigation {
    background: #ecf0f1;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
    text-align: center;
}

.nav-button {
    display: inline-block;
    padding: 10px 20px;
    margin: 0 10px;
    background: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.3s;
}

.nav-button:hover {
    background: #2980b9;
}

.nav-button:disabled {
    background: #95a5a6;
    cursor: not-allowed;
}

p {
    text-align: justify;
    text-indent: 2em;
    margin-bottom: 1em;
}

p:first-child {
    text-indent: 0;
}

@media (max-width: 600px) {
    body {
        padding: 10px;
    }
    
    .container {
        padding: 20px;
    }
    
    h1 {
        font-size: 2em;
    }
    
    h2 {
        font-size: 1.5em;
    }
    
    h3 {
        font-size: 1.2em;
    }
    
    .chapter-nav a, .volume-nav a {
        display: block;
        margin: 5px 0;
    }
}
`;
    }

    generateIndex() {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.converter.escapeHTML(this.converter.bookData.title)}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="book-header">
            <h1>${this.converter.escapeHTML(this.converter.bookData.title)}</h1>
            <p class="author">by ${this.converter.escapeHTML(this.converter.bookData.author)}</p>`;
        
        if (this.converter.bookData.description) {
            html += `
            <p class="description">${this.converter.escapeHTML(this.converter.bookData.description)}</p>`;
        }
        
        html += `
        </div>
        
        <div class="table-of-contents">
            <h2>Table of Contents</h2>`;
        
        this.converter.bookData.content.forEach((volume, volumeIndex) => {
            html += `
            <div class="volume-nav">
                <h3>${this.converter.escapeHTML(volume.volume_name)}</h3>`;
            
            volume.chapters.forEach((chapter, chapterIndex) => {
                const chapterFile = `vol${volume.volume_index}_ch${chapter.chapter_index}.html`;
                html += `
                <a href="${chapterFile}">${this.converter.escapeHTML(chapter.chapter_title)}</a>`;
            });
            
            html += `
            </div>`;
        });
        
        html += `
        </div>
    </div>
</body>
</html>`;
        
        return html;
    }

    generateChapter(volume, chapter) {
        const chapterIndex = volume.chapters.findIndex(c => c.chapter_index === chapter.chapter_index);
        const prevChapter = chapterIndex > 0 ? volume.chapters[chapterIndex - 1] : null;
        const nextChapter = chapterIndex < volume.chapters.length - 1 ? volume.chapters[chapterIndex + 1] : null;
        
        // Find next volume if at end of current volume
        let nextVolumeChapter = null;
        if (!nextChapter) {
            const volumeIndex = this.converter.bookData.content.findIndex(v => v.volume_index === volume.volume_index);
            if (volumeIndex < this.converter.bookData.content.length - 1) {
                const nextVolume = this.converter.bookData.content[volumeIndex + 1];
                nextVolumeChapter = nextVolume.chapters[0];
            }
        }
        
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.converter.escapeHTML(chapter.chapter_title)} - ${this.converter.escapeHTML(this.converter.bookData.title)}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="navigation">
            <a href="index.html" class="nav-button">← Table of Contents</a>`;
        
        if (prevChapter) {
            html += `
            <a href="vol${volume.volume_index}_ch${prevChapter.chapter_index}.html" class="nav-button">← Previous</a>`;
        }
        
        if (nextChapter) {
            html += `
            <a href="vol${volume.volume_index}_ch${nextChapter.chapter_index}.html" class="nav-button">Next →</a>`;
        } else if (nextVolumeChapter) {
            const nextVolume = this.converter.bookData.content.find(v => v.chapters.includes(nextVolumeChapter));
            html += `
            <a href="vol${nextVolume.volume_index}_ch${nextVolumeChapter.chapter_index}.html" class="nav-button">Next →</a>`;
        }
        
        html += `
        </div>
        
        <h1>${this.converter.escapeHTML(chapter.chapter_title)}</h1>
        <h2>${this.converter.escapeHTML(volume.volume_name)}</h2>`;
        
        // Process chapter content
        const paragraphs = chapter.chapter_content.split('\n\n');
        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                html += `
        <p>${this.converter.escapeHTML(paragraph.trim())}</p>`;
            }
        });
        
        html += `
        
        <div class="navigation">
            <a href="index.html" class="nav-button">← Table of Contents</a>`;
        
        if (prevChapter) {
            html += `
            <a href="vol${volume.volume_index}_ch${prevChapter.chapter_index}.html" class="nav-button">← Previous</a>`;
        }
        
        if (nextChapter) {
            html += `
            <a href="vol${volume.volume_index}_ch${nextChapter.chapter_index}.html" class="nav-button">Next →</a>`;
        } else if (nextVolumeChapter) {
            const nextVolume = this.converter.bookData.content.find(v => v.chapters.includes(nextVolumeChapter));
            html += `
            <a href="vol${nextVolume.volume_index}_ch${nextVolumeChapter.chapter_index}.html" class="nav-button">Next →</a>`;
        }
        
        html += `
        </div>
    </div>
</body>
</html>`;
        
        return html;
    }
}

// Export for use in main script
window.HTMLConverter = HTMLConverter; 