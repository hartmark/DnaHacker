import { processZipFile } from './fileProcessor.js';
import { analyzeSnps } from './snpParser.js';
import UIManager from './uiManager.js';

document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('dnaFileInput');
    const dataLoadingStatus = document.getElementById('dataLoadingStatus');
    
    if (!fileInput) {
        console.error("Could not find fileInput element!");
        return;
    }
    
    // Try to pre-load SNP data to verify it works
    try {
        // This will cache the SNP data for later use
        await analyzeSnps([]);
        dataLoadingStatus.innerHTML = '<p class="success">Interpretation data loaded and ready.</p>';
    } catch (error) {
        console.error("Failed to load SNP data:", error);
        dataLoadingStatus.innerHTML = `
            <p class="error">Could not load interpretation data: ${error.message}</p>
            <p>Check that the snpData.json file is available and correctly formatted.</p>
        `;
        // Disable the file input if we can't load the SNP data
        fileInput.disabled = true;
        return;
    }
    
    const processedFilesData = new Map();

    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (!files.length) {
            UIManager.updateStatus("No files selected.");
            return;
        }

        UIManager.updateStatus(`Found ${files.length} file(s). Processing...`);
        processedFilesData.clear();
        document.getElementById('resultsArea').innerHTML = '<h2>Results</h2>';
        document.getElementById('comparisonArea').style.display = 'none';

        const filePromises = [];
        
        for (const file of files) {
            if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
                UIManager.updateStatus(`Starting to process: ${file.name}`);
                filePromises.push(
                    processZipFile(file)
                        .then(results => {
                            if (results) {
                                processedFilesData.set(file.name, results);
                                UIManager.displayResults(results, file.name);
                            }
                        })
                        .catch(error => {
                            console.error("Error processing file:", file.name, error);
                            UIManager.updateStatus(`Error processing ${file.name}: ${error.message}`, true);
                        })
                );
            } else {
                UIManager.updateStatus(`Invalid file type for ${file.name}. Only ZIP files are accepted.`, true);
            }
        }

        Promise.allSettled(filePromises).then(() => {
            UIManager.updateStatus("Processing complete for all selected files.");
            if (processedFilesData.size > 1) {
                UIManager.setupComparisonUI(processedFilesData);
            }
        });
    });

    UIManager.updateStatus("Waiting for file...");
    UIManager.setupPdfExport();
});