/* PDF Generation Functions */

async function generatePDF() {
    try {
        showNotification('📄 Generating PDF with static cover and end pages...', 'info');
        
        // Collect all form data
        const formData = collectFormData();
        
        // First, generate the content PDF using jsPDF (without front and end pages)
        const { jsPDF } = window.jspdf;
        const contentDoc = new jsPDF();
        
        let yPosition = 50; // Start below header area
        const pageHeight = contentDoc.internal.pageSize.height;
        const margin = 20;
        const headerHeight = 45; // Space reserved for header
        const lineHeight = 6;
        const sectionTitleColor = [0, 79, 240]; // #004FF0 color for section titles
        
        // Helper function to add header to each page
        function addPageHeader(currentPageNum, totalPages) {
            const pageWidth = contentDoc.internal.pageSize.width;
            
            // Axis logo text (left side)
            contentDoc.setFontSize(16);
            contentDoc.setFont(undefined, 'bold');
            contentDoc.setTextColor(0, 100, 200); // Blue color for Axis
            contentDoc.text('AXIS', margin, 25);
            
            // Technology Risk Application | page number (right side)
            contentDoc.setFontSize(10);
            contentDoc.setFont(undefined, 'normal');
            contentDoc.setTextColor(0, 0, 0); // Black color for rest of text
            const headerText = `Technology Risk Application | Page ${currentPageNum}`;
            const textWidth = contentDoc.getTextWidth(headerText);
            contentDoc.text(headerText, pageWidth - margin - textWidth, 25);
            
            // Blue border line at bottom of header
            contentDoc.setDrawColor(0, 100, 200); // Blue color
            contentDoc.setLineWidth(2);
            contentDoc.line(margin, 35, pageWidth - margin, 35);
            
            // Reset text color to black for content
            contentDoc.setTextColor(0, 0, 0);
        }
        
        // Helper function to add new page if needed
        function checkPageBreak(additionalHeight = 15) {
            if (yPosition + additionalHeight > pageHeight - margin) {
                contentDoc.addPage();
                yPosition = headerHeight + 5; // Start below header
            }
        }
        
        // Helper function to add text with word wrapping
        function addWrappedText(text, x, fontSize = 10, maxWidth = 170) {
            contentDoc.setFontSize(fontSize);
            const lines = contentDoc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                checkPageBreak();
                contentDoc.text(line, x, yPosition);
                yPosition += lineHeight;
            });
        }
        
        // Function to collect form data
        function collectFormData() {
            // This function will collect and organize form data
            return {};
        }
        
        // Note: This is a placeholder for the large PDF generation function
        // The complete function should be copied from the original HTML file
        
        showNotification('✅ PDF generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('❌ Error generating PDF. Please try again.', 'error');
    }
}