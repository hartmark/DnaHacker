import { unzip } from 'https://unpkg.com/unzipit@1.4.0/dist/unzipit.module.js';
import { parseDnaData } from './csvParser.js';
import { updateStatus } from './uiManager.js';

export async function processZipFile(fileObject) {
    updateStatus(`Unpacking ${fileObject.name}...`);
    try {
        const { entries } = await unzip(fileObject);

        let csvContent = null;
        let foundFilename = null;

        // Find CSV or TXT file inside ZIP
        const potentialFiles = Object.keys(entries).filter(filename =>
            filename.toLowerCase().endsWith('.csv') || filename.toLowerCase().endsWith('.txt')
        );

        if (potentialFiles.length === 0) {
            throw new Error("No CSV or TXT file found in the ZIP archive.");
        }

        // Prioritize CSV, otherwise take first TXT
        foundFilename = potentialFiles.find(name => name.toLowerCase().endsWith('.csv')) || potentialFiles[0];

        if (foundFilename && entries[foundFilename]) {
            updateStatus(`Extracting ${foundFilename} from ${fileObject.name}...`);
            const targetEntry = entries[foundFilename];
            csvContent = await targetEntry.text();
            updateStatus(`Extraction of ${foundFilename} complete.`);
        } else {
            throw new Error("Could not access the identified CSV/TXT file.");
        }

        if (csvContent) {
            return await parseDnaData(csvContent, fileObject.name);
        } else {
            throw new Error("The content of the CSV/TXT file could not be extracted.");
        }

    } catch (error) {
        console.error(`Error unpacking ${fileObject.name}:`, error);
        updateStatus(`Error unpacking ${fileObject.name}: ${error.message}`, true);
        return null;
    }
}