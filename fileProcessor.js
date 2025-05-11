import { unzip } from 'https://unpkg.com/unzipit@1.4.0/dist/unzipit.module.js';
import { parseDnaData } from './csvParser.js';
import UIManager from './uiManager.js';

export async function processZipFile(fileObject) {
    UIManager.updateStatus(`Unpacking ${fileObject.name}...`);
    try {
        const { entries } = await unzip(fileObject);

        let csvContent = null;
        let foundFilename = null;

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
        csvContent = await targetEntry.text();
        UIManager.updateStatus(`Extraction of ${foundFilename} complete.`);

        if (!csvContent) {
            const errorMsg = "The content of the CSV/TXT file could not be extracted.";
            console.error(`Error processing ${fileObject.name}: ${errorMsg}`);
            UIManager.updateStatus(`Error processing ${fileObject.name}: ${errorMsg}`, true);
            return null;
        }

        return await parseDnaData(csvContent, fileObject.name);

    } catch (error) {
        console.error(`Error unpacking ${fileObject.name}:`, error);
        UIManager.updateStatus(`Error unpacking ${fileObject.name}: ${error.message}`, true);
        return null;
    }
}