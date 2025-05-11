/**
 * pdfExporter.js
 * Exports DNAHacker results tables to PDF using jsPDF + AutoTable plugin.
 * Requires:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
 */

// Default status updater
function defaultUpdateStatus(msg, isError = false) {
    console[isError ? 'error' : 'log'](`[PDF Export] ${msg}`);
}

/**
 * exportResultsToPdf
 * @param {function(string, boolean=):void} updateStatus - callback for status messages
 */
export function exportResultsToPdf(updateStatus = defaultUpdateStatus) {
    updateStatus('Generating PDF...', false);
    
    // Get the file-results section
    const resultsSection = document.querySelector('.file-results');
    if (!resultsSection) {
        updateStatus('No results found', true);
        return;
    }
    
    // Get the table from the results section
    const table = resultsSection.querySelector('table');
    if (!table) {
        updateStatus('No table found', true);
        return;
    }
    
    // Get the filename from the header in the results section
    let filename = "DNA Analysis Results";
    const header = resultsSection.querySelector('h3');
    if (header) {
        filename = header.textContent.trim();
    }
    
    // Create the PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Add title/header
    doc.setFontSize(16);
    doc.text('DNAHacker Analysis Report', 14, 10);
    
    // Add file name as subtitle
    doc.setFontSize(12);
    doc.text(`File: ${filename}`, 14, 18);
    
    // Add generation date
    const now = new Date();
    // Use ISO date format (YYYY-MM-DD) with 24-hour time
    const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
    doc.setFontSize(10);
    doc.text(`Generated: ${dateStr}`, 14, 24);
    
    // Use AutoTable to convert HTML table
    // noinspection JSUnresolvedReference,JSUnusedGlobalSymbols
    doc.autoTable({
        html: table,
        startY: 30, // Start below our header
        theme: 'grid',
        styles: { cellPadding: 3, fontSize: 10 },
        rowPageBreak: 'avoid', // Prevents rows from breaking across pages
        didDrawCell: function(data) {
            // For columns containing an <a>, make the link clickable
            // noinspection JSUnresolvedReference
            if (data.cell.section === 'body') {
                const cellNode = data.cell.raw;
                const link = cellNode.querySelector('a');
                if (link) {
                    const { x, y, width, height } = data.cell;
                    
                    // Add clickable link
                    doc.link(x, y, width, height, { url: link.href });
                    
                    // Get the text content and position
                    const linkText = link.textContent;
                    
                    // Only proceed if we have text
                    if (linkText && linkText.trim()) {
                        // Save the current state
                        doc.saveGraphicsState();
                        
                        // Set the color to blue for links
                        doc.setTextColor(0, 0, 1.0);

                        const padding = 3;  // Same as in styles

                        const textX = x + padding;
                        const textY = y + padding * 2;
                        
                        // Get the text width
                        const textWidth = doc.getStringUnitWidth(linkText) * 10 / doc.internal.scaleFactor;
                        
                        // Draw a line below the text (blue underline)
                        doc.setDrawColor(0, 0, 255);
                        doc.setLineWidth(0.2);
                        doc.line(textX, textY + 1, textX + textWidth, textY + 1);
                    }
                }
            }
        },
        // Add footer with page numbers
        didDrawPage: function(data) {
            // Footer with page numbers
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            const fontSize = doc.getFontSize();

            // Add the disclaimer at the bottom of the first page
            if (data.pageNumber === 1) {
                doc.setFontSize(8);
                doc.text('Important: For informational and educational purposes only. Not medical advice. See full disclaimer at https://hartmark.github.io/DnaHacker', 14, pageHeight - 10);
            }

            doc.setFontSize(8);
            doc.text('Page ' + data.pageNumber, pageSize.width - 20, pageHeight - 10);

            // Restore font size
            doc.setFontSize(fontSize);
        }
    });
    
    // Generate filename for the PDF based on the input file
    let pdfFilename = filename.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
    pdfFilename = pdfFilename + "_Analysis.pdf";
    
    doc.save(pdfFilename);
    updateStatus('PDF exported successfully', false);
}