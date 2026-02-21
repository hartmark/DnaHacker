import { unzip } from 'https://unpkg.com/unzipit@1.4.0/dist/unzipit.module.js';
import { parseDnaData } from './csvParser.js';
import UIManager from './uiManager.js';

/**
 * Detects the DNA file format based on content analysis
 * @param {string} content - The file content
 * @returns {string} The detected format ('myheritage', 'ancestry', '23andme' or 'unknown')
 */
function detectFileFormat(content) {
    const lines = content.split('\n');

    // Look for Ancestry.com specific markers
    if (content.includes('AncestryDNA raw data download') ||
        content.includes('AncestryDNA array version') ||
        content.includes('AncestryDNA converter version')) {
        return 'ancestry';
    }

    // Look for MyHeritage format (comma-separated, 4 columns, with rsid in first column)
    const firstDataLine = lines.find(line =>
        line.trim() &&
        !line.startsWith('#') &&
        !line.startsWith('RSID') && // Skip header row
        line.includes(',') &&
        line.split(',').length === 4
    );

    if (firstDataLine) {
        const columns = firstDataLine.split(',').map(col => col.trim().replace(/^"|"$/g, '')); // Remove quotes
        // Check if it looks like MyHeritage format (rsid, chromosome, position, genotype)
        if (columns[0].startsWith('rs') &&
            !isNaN(columns[1]) &&
            !isNaN(columns[2]) &&
            columns[3].length <= 2) {
            return 'myheritage';
        } else {
            console.log('MyHeritage format check failed:', {
                startsWithRs: columns[0].startsWith('rs'),
                col1IsNumber: !isNaN(columns[1]),
                col2IsNumber: !isNaN(columns[2]),
                col3Length: columns[3].length
            });
        }
    }

    // Look for 23andMe specific marker and file format
    if (
        content.includes('23andMe') &&
        lines.some(line =>
            line.startsWith('# rsid\tchromosome\tposition\tgenotype')
        )
    ) {
        return '23andme';
    }

    return 'unknown';
}

export async function processZipFile(fileObject) {
    UIManager.updateStatus(`Unpacking ${fileObject.name}...`);
    try {
        const { entries } = await unzip(fileObject);

        let fileContent = null;
        let foundFilename = null;
        let detectedFormat = null;

        // Find CSV or TXT file inside ZIP
        const potentialFiles = Object.keys(entries).filter(filename =>
            filename.toLowerCase().endsWith('.csv') || filename.toLowerCase().endsWith('.txt')
        );

        if (potentialFiles.length === 0) {
            const errorMsg = "No CSV or TXT file found in the ZIP archive.";
            console.error(`Error processing ${fileObject.name}: ${errorMsg}`);
            UIManager.updateStatus(`Error processing ${fileObject.name}: ${errorMsg}`, true);
            return null;
        }

        // Prioritize CSV, otherwise take first TXT
        foundFilename = potentialFiles.find(name => name.toLowerCase().endsWith('.csv')) || potentialFiles[0];

        if (!foundFilename || !entries[foundFilename]) {
            const errorMsg = "Could not access the identified CSV/TXT file.";
            console.error(`Error processing ${fileObject.name}: ${errorMsg}`);
            UIManager.updateStatus(`Error processing ${fileObject.name}: ${errorMsg}`, true);
            return null;
        }

        UIManager.updateStatus(`Extracting ${foundFilename} from ${fileObject.name}...`);
        const targetEntry = entries[foundFilename];
        fileContent = await targetEntry.text();
        UIManager.updateStatus(`Extraction of ${foundFilename} complete.`);

        if (!fileContent) {
            const errorMsg = "The content of the CSV/TXT file could not be extracted.";
            console.error(`Error processing ${fileObject.name}: ${errorMsg}`);
            UIManager.updateStatus(`Error processing ${fileObject.name}: ${errorMsg}`, true);
            return null;
        }

        // Detect the file format
        detectedFormat = detectFileFormat(fileContent);
        console.log('File content preview:', fileContent.substring(0, 500));
        console.log('Detected format:', detectedFormat);
        UIManager.updateStatus(`Detected format: ${detectedFormat} for ${fileObject.name}`);

        if (detectedFormat === 'unknown') {
            const errorMsg = "Could not determine the DNA file format. Please ensure this is a valid MyHeritage or Ancestry.com DNA file.";
            console.error(`Error processing ${fileObject.name}: ${errorMsg}`);
            UIManager.updateStatus(`Error processing ${fileObject.name}: ${errorMsg}`, true);
            return null;
        }

        return await parseDnaData(fileContent, fileObject.name, detectedFormat);

    } catch (error) {
        console.error(`Error unpacking ${fileObject.name}:`, error);
        UIManager.updateStatus(`Error unpacking ${fileObject.name}: ${error.message}`, true);
        return null;
    }
}