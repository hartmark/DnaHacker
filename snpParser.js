/**
 * SNP Parser Module
 * 
 * This module handles loading and interpreting SNP (Single Nucleotide Polymorphism) data.
 * It provides functionality to analyze genetic data against known SNP definitions.
 */

// Module constants
const APOE_RS429358 = "rs429358";
const APOE_RS7412 = "rs7412";
const APOE_URL = "https://www.snpedia.com/index.php/APOE";

// Module state
let targetSnps = {};
let apoeLookup = {};

/**
 * Loads SNP data from a JSON file
 * @returns {Promise<boolean>} Success status of the load operation
 */
async function loadSnpData() {
    try {
        const response = await fetch('snpData.json');
        
        if (!response.ok) {
            console.error(`Failed to load SNP data: ${response.status} ${response.statusText}`);
            return false;
        }
        
        const data = await response.json();
        targetSnps = data.snps || {};
        apoeLookup = data.apoe || {};
        
        console.log('SNP data loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading SNP data:', error);
        return false;
    }
}

/**
 * Flips alleles for minus orientation SNPs
 * @see https://www.snpedia.com/index.php/Orientation
 * @param {string} genotype - The genotype to flip
 * @returns {string} The flipped genotype
 */
function flipAlleles(genotype) {
    const flippedAlleles = {
        'A': 'T',
        'T': 'A',
        'C': 'G',
        'G': 'C'
    };
    
    return genotype.split('').map(allele => flippedAlleles[allele] || allele).join('');
}

/**
 * Gets alphabetically sorted genotype
 * @param {string} genotype - The genotype to sort
 * @returns {string} The sorted genotype
 */
function sortGenotype(genotype) {
    return genotype.split('').sort().join('');
}

/**
 * Gets magnitude significance CSS class
 * @param {number} magnitude - The magnitude value
 * @returns {string} The CSS class for the magnitude
 */
function getMagnitudeClass(magnitude) {
    if (magnitude >= 3) return 'high-magnitude';
    if (magnitude >= 2) return 'medium-magnitude';
    return '';
}

/**
 * Gets human-readable magnitude explanation
 * @param {number|null} magnitude - The magnitude value
 * @returns {string} Human-readable description of the magnitude
 */
function getMagnitudeDescription(magnitude) {
    if (magnitude === null || magnitude === undefined) {
        return "Not specified (treated as 1)";
    }
    
    switch(magnitude) {
        case 0: return "Common genotype, nothing interesting known";
        case 0.1: return "Common genotype, but interesting that it varies for others";
        case 1: return "Semi-plausible but not very exciting";
        case 2: 
        case 2.1: return "Interesting enough to be worth reading";
        case 3: return "Probably worth your time";
        case 4: 
        case 5: 
        case 6: 
        case 7: 
        case 8: 
        case 9: return "Something you should pay attention to";
        case 10: return "Really significant information!";
        default:
            if (magnitude > 0 && magnitude < 2) return "Low significance";
            if (magnitude > 2 && magnitude < 3) return "Moderate significance";
            if (magnitude > 3 && magnitude < 10) return "High significance";
            if (magnitude >= 10) return "Very high significance";
            return "Unknown significance";
    }
}

/**
 * Normalizes a genotype string to a standard format
 * @param {string} genotype - The raw genotype
 * @returns {string|null} The normalized genotype or null if invalid
 */
function normalizeGenotype(genotype) {
    if (!genotype) return null;
    
    // Clean and convert to uppercase
    genotype = String(genotype).replace(/['"]/g, '').trim().toUpperCase();
    
    if (genotype.length === 0) return null;
    
    // Handle single letter (homozygous)
    if (genotype.length === 1) {
        return genotype + genotype;
    }
    // Handle standard two-letter genotype
    else if (genotype.length === 2) {
        return genotype;
    }
    // Handle unusual formats, extract only letters
    else {
        const letters = genotype.match(/[A-Z]/g);
        if (!letters) return null;
        
        if (letters.length >= 2) {
            return letters.slice(0, 2).join('');
        } else if (letters.length === 1) {
            return letters[0] + letters[0]; // homozygous
        }
        
        return null;
    }
}

/**
 * Extracts interpretation info for a genotype
 * @param {Object} snpInfo - The SNP information
 * @param {string} genotype - The genotype to look up
 * @returns {Object} Object containing interpretation text, magnitude and color
 */
function getGenotypeInterpretation(snpInfo, genotype) {
    const result = {
        text: "No interpretation available for this genotype.",
        magnitude: 0,
        color: ""
    };
    
    if (!snpInfo?.interpretations?.[genotype]) {
        return result;
    }
    
    const genotypeInfo = snpInfo.interpretations[genotype];
    
    // Handle string format (old format)
    if (typeof genotypeInfo === 'string') {
        result.text = genotypeInfo;
        return result;
    }
    
    // Handle object format (new format)
    if (typeof genotypeInfo === 'object') {
        result.text = genotypeInfo.description || "No description available";
        result.magnitude = typeof genotypeInfo.magnitude !== 'undefined' ? genotypeInfo.magnitude : 1;
        result.color = genotypeInfo.color || "";
    }
    
    return result;
}

/**
 * Handles special APOE SNP combination processing
 * @param {Object} foundSnpsRaw - The found SNPs data
 * @param {Set} processedRsIds - Set of already processed SNP IDs
 * @returns {Array} Array of result objects for APOE SNPs
 */
function processApoeSnps(foundSnpsRaw, processedRsIds) {
    const results = [];
    
    // Both APOE SNPs are present
    if (foundSnpsRaw[APOE_RS429358] && foundSnpsRaw[APOE_RS7412]) {
        const genotype429358 = foundSnpsRaw[APOE_RS429358].sortedGenotype.split('').join(';');
        const genotype7412 = foundSnpsRaw[APOE_RS7412].sortedGenotype.split('').join(';');
        const apoeKey = `${genotype429358}_${genotype7412}`;

        const apoeResult = apoeLookup[apoeKey];
        if (apoeResult) {
            const magnitude = apoeResult.magnitude || 0;
            console.log(`Found APOE combination: ${apoeResult.type} with magnitude: ${magnitude}`);
            
            results.push({
                rsid: "APOE Status (rs429358 + rs7412)",
                gene: "APOE",
                genotype: `${apoeResult.type} (${genotype429358} / ${genotype7412})`,
                interpretation: `${apoeResult.risk} (SNPedia Mag: ${magnitude})`,
                magnitudeValue: magnitude,
                magnitudeClass: getMagnitudeClass(magnitude),
                magnitudeDesc: getMagnitudeDescription(magnitude),
                color: magnitude >= 3 ? "red" : "green",
                snpediaUrl: APOE_URL
            });
        } else {
            // Fallback for each SNP individually
            addIndividualApoeSnp(results, foundSnpsRaw[APOE_RS429358], "APOE SNP 1 (See rs7412)", APOE_RS429358);
            addIndividualApoeSnp(results, foundSnpsRaw[APOE_RS7412], "APOE SNP 2 (See rs429358)", APOE_RS7412);
        }
        
        processedRsIds.add(APOE_RS429358);
        processedRsIds.add(APOE_RS7412);
    } 
    // Handle if only one APOE SNP is present
    else {
        if (foundSnpsRaw[APOE_RS429358]) {
            addIndividualApoeSnp(
                results, 
                foundSnpsRaw[APOE_RS429358], 
                "APOE SNP 1 - Cannot determine full APOE status because rs7412 is missing.", 
                APOE_RS429358
            );
            processedRsIds.add(APOE_RS429358);
        }
        
        if (foundSnpsRaw[APOE_RS7412]) {
            addIndividualApoeSnp(
                results, 
                foundSnpsRaw[APOE_RS7412], 
                "APOE SNP 2 - Cannot determine full APOE status because rs429358 is missing.", 
                APOE_RS7412
            );
            processedRsIds.add(APOE_RS7412);
        }
    }
    
    return results;
}

/**
 * Helper function to add an individual APOE SNP to results
 * @param {Array} results - Array to add the result to
 * @param {Object} snpData - The SNP data
 * @param {string} interpretation - The interpretation text
 * @param {string} rsId - The SNP rsId
 */
function addIndividualApoeSnp(results, snpData, interpretation, rsId) {
    results.push({
        rsid: rsId,
        gene: "APOE",
        genotype: snpData.originalGenotype,
        interpretation: interpretation,
        magnitudeValue: 0,
        magnitudeClass: '',
        magnitudeDesc: "Not applicable",
        color: "",
        snpediaUrl: `https://www.snpedia.com/index.php/${rsId}`
    });
}

/**
 * Analyzes parsed SNP data against known SNP definitions
 * @param {Array} parsedData - The parsed DNA data
 * @returns {Promise<Array>} Array of analyzed SNP results
 */
export async function analyzeSnps(parsedData) {
    // --- 1. Load SNP definitions from JSON file ---
    // First, ensure SNP data is loaded
    if (Object.keys(targetSnps).length === 0) {
        const loaded = await loadSnpData();
        if (!loaded) {
            throw new Error('Could not load SNP interpretation data');
        }
    }
    
    const foundSnpsRaw = {};
    const targetRsIds = new Set(Object.keys(targetSnps));

    // First pass: Find and process all targeted SNPs
    for (const row of parsedData) {
        // Skip invalid rows
        if (!row || !Array.isArray(row) || row.length < 4) continue;

        // Extract data from row
        const rsId = String(row[0]).replace(/['"]/g, '').trim();
        if (!rsId || !targetRsIds.has(rsId)) continue;
        
        // Process genotype
        const normalizedGenotype = normalizeGenotype(row[3]);
        if (!normalizedGenotype) continue;
        
        // Process the genotype based on orientation
        const snpInfo = targetSnps[rsId];
        let flippedGenotype = normalizedGenotype;
        
        if (snpInfo?.orientation === "minus") {
            flippedGenotype = flipAlleles(normalizedGenotype);
            console.log(`Found target SNP: ${rsId} with genotype: ${normalizedGenotype} (flipped to ${flippedGenotype} due to minus orientation)`);
        } else {
            console.log(`Found target SNP: ${rsId} with genotype: ${normalizedGenotype}`);
        }
        
        // Sort for consistent lookups
        const sortedGenotype = sortGenotype(flippedGenotype);
        
        // Log additional information if available
        logGenotypeInfo(snpInfo, sortedGenotype);
        
        // Store all versions for later use
        foundSnpsRaw[rsId] = {
            originalGenotype: normalizedGenotype,
            flippedGenotype: flippedGenotype,
            sortedGenotype: sortedGenotype
        };
    }

    // Second pass: Interpret results and build final dataset
    const finalResults = [];
    const processedRsIds = new Set();
    
    // Find missing SNPs
    const missingSnps = Array.from(targetRsIds).filter(rsId => !foundSnpsRaw[rsId]);

    // Handle special case: APOE SNPs
    const apoeResults = processApoeSnps(foundSnpsRaw, processedRsIds);
    finalResults.push(...apoeResults);

    // Handle all other SNPs
    processRegularSnps(foundSnpsRaw, processedRsIds, finalResults);
    
    // Add information about missing SNPs if any
    if (missingSnps.length > 0) {
        finalResults.push({
            rsid: "Missing SNPs",
            gene: "N/A",
            genotype: "N/A",
            interpretation: `The following SNPs were not found in your data: ${missingSnps.join(", ")}`,
            magnitudeValue: 0,
            magnitudeClass: '',
            magnitudeDesc: "Not applicable",
            color: "",
            snpediaUrl: null
        });
    }

    return finalResults;
}

/**
 * Logs additional genotype information if available
 * @param {Object} snpInfo - The SNP information
 * @param {string} sortedGenotype - The sorted genotype
 */
function logGenotypeInfo(snpInfo, sortedGenotype) {
    if (!snpInfo?.interpretations?.[sortedGenotype]) return;
    
    const genotypeInfo = snpInfo.interpretations[sortedGenotype];
    if (typeof genotypeInfo !== 'object') return;
    
    if ('magnitude' in genotypeInfo) {
        console.log(`  Magnitude: ${genotypeInfo.magnitude} - ${getMagnitudeDescription(genotypeInfo.magnitude)}`);
    }
    
    if ('color' in genotypeInfo) {
        console.log(`  Color: ${genotypeInfo.color} (${genotypeInfo.color === 'green' ? 'Good/Safe' : 'Bad/Risk'})`);
    }
}

/**
 * Processes regular (non-APOE) SNPs
 * @param {Object} foundSnpsRaw - The found SNPs data
 * @param {Set} processedRsIds - Set of already processed SNP IDs
 * @param {Array} finalResults - Array to add results to
 */
function processRegularSnps(foundSnpsRaw, processedRsIds, finalResults) {
    for (const rsId in foundSnpsRaw) {
        if (processedRsIds.has(rsId)) continue;

        const snpData = foundSnpsRaw[rsId];
        const snpInfo = targetSnps[rsId];
        
        if (!snpInfo) continue;
        
        // Get interpretation for this genotype
        const interpretation = getGenotypeInterpretation(snpInfo, snpData.sortedGenotype);
        
        // Prepare display genotype and any additional info
        const displayInfo = prepareDisplayGenotype(snpInfo, snpData);
        
        finalResults.push({
            rsid: rsId,
            gene: snpInfo.gene || "",
            genotype: displayInfo.genotype,
            interpretation: interpretation.text + displayInfo.flippedInfo,
            magnitudeValue: interpretation.magnitude,
            magnitudeClass: getMagnitudeClass(interpretation.magnitude),
            magnitudeDesc: getMagnitudeDescription(interpretation.magnitude),
            color: interpretation.color,
            name: snpInfo.name || rsId,
            orientation: snpInfo.orientation || "plus",
            snpediaUrl: `https://www.snpedia.com/index.php/${rsId}`
        });
    }
}

/**
 * Prepares the display genotype based on orientation
 * @param {Object} snpInfo - The SNP information
 * @param {Object} snpData - The SNP data
 * @returns {Object} Object with display genotype and flipped info
 */
function prepareDisplayGenotype(snpInfo, snpData) {
    let displayGenotype;
    let flippedInfo = '';
    
    if (snpInfo.orientation === "minus") {
        displayGenotype = snpData.sortedGenotype;
        flippedInfo = ` (flipped from ${snpData.originalGenotype} found in raw data)`;
    } else {
        displayGenotype = snpData.originalGenotype;
    }
    
    return { genotype: displayGenotype, flippedInfo: flippedInfo };
}