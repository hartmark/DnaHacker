import { analyzeSnps } from './snpParser.js';
import UIManager from './uiManager.js';

/**
 * Normalizes data from different DNA file formats to a common format
 * @param {Array} parsedData - The parsed data from PapaParse
 * @param {string} format - The detected format ('myheritage', 'ancestry' or '23andme')
 * @returns {Array} Normalized data in the format expected by analyzeSnps
 */
function normalizeData(parsedData, format) {
    const normalizedData = [];

    for (const row of parsedData) {
        if (!row) continue;

        let rsid, chromosome, position, genotype;

        if (format === 'myheritage') {
            // MyHeritage format: rsid, chromosome, position, genotype
            if (!Array.isArray(row) || row.length < 4) continue;
            rsid = String(row[0]).replace(/['"]/g, '').trim();
            chromosome = String(row[1]).replace(/['"]/g, '').trim();
            position = String(row[2]).replace(/['"]/g, '').trim();
            genotype = String(row[3]).replace(/['"]/g, '').trim();
        } else if (format === 'ancestry') {
            // Ancestry format: rsid, chromosome, position, allele1, allele2
            // When header is true, PapaParse returns objects with property names
            if (typeof row === 'object' && !Array.isArray(row)) {
                // Handle object format (with headers)
                rsid = String(row.rsid || '').replace(/['"]/g, '').trim();
                chromosome = String(row.chromosome || '').replace(/['"]/g, '').trim();
                position = String(row.position || '').replace(/['"]/g, '').trim();
                const allele1 = String(row.allele1 || '').replace(/['"]/g, '').trim();
                const allele2 = String(row.allele2 || '').replace(/['"]/g, '').trim();
                genotype = allele1 + allele2;
            } else if (Array.isArray(row) && row.length >= 5) {
                // Handle array format (fallback)
                rsid = String(row[0]).replace(/['"]/g, '').trim();
                chromosome = String(row[1]).replace(/['"]/g, '').trim();
                position = String(row[2]).replace(/['"]/g, '').trim();
                const allele1 = String(row[3]).replace(/['"]/g, '').trim();
                const allele2 = String(row[4]).replace(/['"]/g, '').trim();
                genotype = allele1 + allele2;
            } else {
                continue; // Skip invalid rows
            }
        } else if (format === '23andme') {
            // 23andMe format: rsid, chromosome, position, genotype
            if (!Array.isArray(row) || row.length < 4) continue;

            rsid = String(row[0]).trim();
            chromosome = String(row[1]).trim();
            position = String(row[2]).trim();
            genotype = String(row[3]).trim();        
        } else {
            continue; // Skip unknown formats
        }

        // Validate the data
        if (!rsid || !chromosome || !position || !genotype) continue;
        if (!rsid.startsWith('rs')) continue;
        if (isNaN(chromosome) || isNaN(position)) continue;

        normalizedData.push([rsid, chromosome, position, genotype]);
    }

    return normalizedData;
}

export function parseDnaData(fileString, fileIdentifier, format = 'myheritage') {
    return new Promise((resolve, reject) => {
        UIManager.updateStatus(`Parsing DNA data for ${fileIdentifier} (${format} format)...`);

        // Check if Papa is available through the window object
        if (typeof window.Papa === 'undefined') {
            return reject(new Error("PapaParse library is not available. Check script inclusion."));
        }

        // Configure PapaParse based on format
        const parseConfig = {
            comments: "#",
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: async (results) => {
                UIManager.updateStatus(`Parsing complete for ${fileIdentifier}. Normalizing data...`);
                if (results.errors.length > 0) {
                    console.warn(`Parsing errors for ${fileIdentifier}:`, results.errors);
                    UIManager.updateStatus(`Warning: Found ${results.errors.length} parsing errors in ${fileIdentifier}. Attempting to analyze anyway.`, true);
                }

                if (results.data && results.data.length > 0) {
                    try {
                        // Normalize the data to common format
                        const normalizedData = normalizeData(results.data, format);

                        console.log(`Normalized ${normalizedData.length} valid SNPs from ${results.data.length} total rows`);

                        if (normalizedData.length === 0) {
                            const errorMsg = `No valid SNP data found in ${fileIdentifier} after normalization.`;
                            console.error(errorMsg);
                            console.error('Sample of raw data:', results.data.slice(0, 5));
                            UIManager.updateStatus(errorMsg, true);
                            reject(new Error(errorMsg));
                            return;
                        }

                        UIManager.updateStatus(`Found ${normalizedData.length} valid SNPs in ${fileIdentifier}. Analyzing...`);
                        const analysisResults = await analyzeSnps(normalizedData);
                        UIManager.updateStatus(`Analysis complete for ${fileIdentifier}.`);
                        resolve(analysisResults);
                    } catch (analysisError) {
                        console.error(`Analysis error for ${fileIdentifier}:`, analysisError);
                        UIManager.updateStatus(`Error during analysis of ${fileIdentifier}: ${analysisError.message}`, true);
                        reject(analysisError);
                    }
                } else {
                    const errorMsg = `No data found after parsing ${fileIdentifier}.`;
                    console.error(errorMsg);
                    UIManager.updateStatus(errorMsg, true);
                    reject(new Error(errorMsg));
                }
            },
            error: (error) => {
                console.error(`Critical parsing error for ${fileIdentifier}:`, error);
                UIManager.updateStatus(`Critical error parsing ${fileIdentifier}: ${error.message}`, true);
                reject(error);
            }
        };

        // Configure parsing based on format
        if (format === 'ancestry') {
            // Ancestry uses tab separation and has headers
            parseConfig.delimiter = '\t';
            parseConfig.header = true;
        } else if (format === '23andme') {
            // 23andme uses tab separation and has headers but we will not use them
            parseConfig.delimiter = '\t';
            parseConfig.header = false;
        } else {
            // MyHeritage uses comma separation and no headers
            parseConfig.delimiter = ',';
            parseConfig.header = false;
        }

        window.Papa.parse(fileString, parseConfig);
    });
}