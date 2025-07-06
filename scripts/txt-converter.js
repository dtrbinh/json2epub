class TXTConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        this.converter.setConvertingState('Converting to TXT...');
        this.converter.updateProgress(10, 'Generating text content...');
        
        let content = '';
        
        // Title page
        content += `${this.converter.bookData.title.toUpperCase()}\n`;
        content += `by ${this.converter.bookData.author}\n\n`;
        
        if (this.converter.bookData.description) {
            content += `${this.converter.bookData.description}\n\n`;
        }
        
        content += '=' + '='.repeat(60) + '\n\n';
        
        const totalChapters = this.converter.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
        let processedChapters = 0;
        
        // Add content
        for (const volume of this.converter.bookData.content) {
            content += `${volume.volume_name.toUpperCase()}\n`;
            content += '-'.repeat(volume.volume_name.length) + '\n\n';
            
            for (const chapter of volume.chapters) {
                this.converter.updateProgress(10 + (processedChapters / totalChapters) * 80, 
                    `Processing chapter ${processedChapters + 1} of ${totalChapters}...`);
                
                content += `Chapter ${chapter.chapter_index}: ${chapter.chapter_title}\n\n`;
                content += `${chapter.chapter_content}\n\n`;
                content += '\n' + '-'.repeat(40) + '\n\n';
                
                processedChapters++;
            }
        }
        
        this.converter.updateProgress(95, 'Creating download...');
        
        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.converter.completeConversion();
    }
}

// Export for use in main script
window.TXTConverter = TXTConverter; 