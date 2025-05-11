import { analyzeSnps } from './snpParser.js';
import { updateStatus } from './uiManager.js';

export function parseDnaData(csvString, fileIdentifier) {
    return new Promise((resolve, reject) => {
        updateStatus(`Parsing DNA data for ${fileIdentifier}...`);
        
        // Check if Papa is available
        if (typeof Papa === 'undefined') {
            return reject(new Error("PapaParse library is not available. Check script inclusion."));
        }
        
        Papa.parse(csvString, {
            comments: "#",
            header: false,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: async (results) => {
                updateStatus(`Parsing complete for ${fileIdentifier}. Analyzing SNPs...`);
                if (results.errors.length > 0) {
                    console.warn(`Parsing errors for ${fileIdentifier}:`, results.errors);
                    updateStatus(`Warning: Found ${results.errors.length} parsing errors in ${fileIdentifier}. Attempting to analyze anyway.`, true);
                }
                
                if (results.data && results.data.length > 0) {
                    try {
                        const analysisResults = await analyzeSnps(results.data);
                        updateStatus(`Analysis complete for ${fileIdentifier}.`);
                        resolve(analysisResults);
                    } catch (analysisError) {
                        console.error(`Analysis error for ${fileIdentifier}:`, analysisError);
                        updateStatus(`Error during analysis of ${fileIdentifier}: ${analysisError.message}`, true);
                        reject(analysisError);
                    }
                } else {
                    const errorMsg = `No data found after parsing ${fileIdentifier}.`;
                    console.error(errorMsg);
                    updateStatus(errorMsg, true);
                    reject(new Error(errorMsg));
                }
            },
            error: (error) => {
                console.error(`Critical parsing error for ${fileIdentifier}:`, error);
                updateStatus(`Critical error parsing ${fileIdentifier}: ${error.message}`, true);
                reject(error);
            }
        });
    });
}