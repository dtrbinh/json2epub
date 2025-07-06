class RTFConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to RTF...');
        this.converter.updateProgress(10, 'Generating RTF content...');
        
        let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs24 ';
        
        // Title page
        rtf += `{\\fs36\\b ${this.escapeRTF(this.converter.bookData.title)}\\par}`;
        rtf += `{\\fs24 by ${this.escapeRTF(this.converter.bookData.author)}\\par\\par}`;
        
        if (this.converter.bookData.description) {
            rtf += `{\\fs20 ${this.escapeRTF(this.converter.bookData.description)}\\par\\par}`;
        }
        
        const totalChapters = this.converter.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
        let processedChapters = 0;
        
        // Add content
        for (const volume of this.converter.bookData.content) {
            rtf += `{\\page}{\\fs28\\b ${this.escapeRTF(volume.volume_name)}\\par\\par}`;
            
            for (const chapter of volume.chapters) {
                this.converter.updateProgress(10 + (processedChapters / totalChapters) * 80, 
                    `Processing chapter ${processedChapters + 1} of ${totalChapters}...`);
                
                rtf += `{\\fs24\\b ${this.escapeRTF(chapter.chapter_title)}\\par\\par}`;
                rtf += `{\\fs20 ${this.escapeRTF(chapter.chapter_content)}\\par\\par}`;
                
                processedChapters++;
            }
        }
        
        rtf += '}';
        
        this.converter.updateProgress(95, 'Creating download...');
        
        // Create and download file
        const blob = new Blob([rtf], { type: 'application/rtf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.rtf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }

    escapeRTF(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\n/g, '\\par ');
    }
}

// Export for use in main script
window.RTFConverter = RTFConverter; 