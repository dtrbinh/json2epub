class PDFConverter {
    constructor(converter) {
        this.converter = converter;
    }

    async convert() {
        const { jsPDF } = window.jspdf;
        
        this.converter.setConvertingState('Converting to PDF...');
        this.converter.updateProgress(10, 'Initializing PDF generator...');
        
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        
        this.converter.updateProgress(20, 'Adding title page...');
        
        // Title page
        pdf.setFontSize(24);
        pdf.text(this.converter.bookData.title, pageWidth / 2, 50, { align: 'center' });
        
        pdf.setFontSize(16);
        pdf.text(`by ${this.converter.bookData.author}`, pageWidth / 2, 70, { align: 'center' });
        
        if (this.converter.bookData.description) {
            pdf.setFontSize(12);
            const descLines = pdf.splitTextToSize(this.converter.bookData.description, maxWidth);
            pdf.text(descLines, pageWidth / 2, 100, { align: 'center' });
        }
        
        let currentY = 150;
        const totalChapters = this.converter.bookData.content.reduce((total, volume) => total + volume.chapters.length, 0);
        let processedChapters = 0;
        
        // Add content
        for (const volume of this.converter.bookData.content) {
            // Volume title
            pdf.addPage();
            pdf.setFontSize(20);
            pdf.text(volume.volume_name, pageWidth / 2, 50, { align: 'center' });
            currentY = 80;
            
            for (const chapter of volume.chapters) {
                this.converter.updateProgress(20 + (processedChapters / totalChapters) * 70, 
                    `Processing chapter ${processedChapters + 1} of ${totalChapters}...`);
                
                // Chapter title
                if (currentY > pageHeight - 60) {
                    pdf.addPage();
                    currentY = margin;
                }
                
                pdf.setFontSize(16);
                pdf.text(chapter.chapter_title, margin, currentY);
                currentY += 20;
                
                // Chapter content
                pdf.setFontSize(11);
                const contentLines = pdf.splitTextToSize(chapter.chapter_content, maxWidth);
                
                for (const line of contentLines) {
                    if (currentY > pageHeight - margin) {
                        pdf.addPage();
                        currentY = margin;
                    }
                    pdf.text(line, margin, currentY);
                    currentY += 5;
                }
                
                currentY += 10; // Space between chapters
                processedChapters++;
            }
        }
        
        this.converter.updateProgress(95, 'Finalizing PDF...');
        
        // Save PDF
        const fileName = `${this.converter.bookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        pdf.save(fileName);
        
        this.converter.completeConversion();
    }
}

// Export for use in main script
window.PDFConverter = PDFConverter; 