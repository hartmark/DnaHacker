// --- UI Update Functions ---

// Get DOM elements
let statusArea, resultsArea, comparisonArea, fileSelectionDiv, comparisonTableContainer, compareButton;

// Initialize DOM elements once document is ready
document.addEventListener('DOMContentLoaded', () => {
    statusArea = document.getElementById('statusArea');
    resultsArea = document.getElementById('resultsArea');
    comparisonArea = document.getElementById('comparisonArea');
    fileSelectionDiv = document.getElementById('fileSelectionForComparison');
    comparisonTableContainer = document.getElementById('comparisonTableContainer');
    compareButton = document.getElementById('compareButton');
});

// Function to update status messages
export function updateStatus(message, isError = false) {
    const statusArea = document.getElementById('statusArea');
    statusArea.innerHTML = `<p${isError ? ' class="error"' : ''}><strong>Status:</strong> ${message}</p>`;
}

// Function to create a magnitude circle
function createMagnitudeCircle(magnitudeValue) {
    if (magnitudeValue === undefined || magnitudeValue === null) return '<div class="magnitude-circle-container">-</div>';
    
    let circleClass = 'none';
    if (magnitudeValue >= 3) circleClass = 'high';
    else if (magnitudeValue >= 2) circleClass = 'medium';
    else if (magnitudeValue > 0) circleClass = 'low';
    
    return `<div class="magnitude-circle-container">
              <div class="magnitude-circle ${circleClass}">${magnitudeValue}</div>
            </div>`;
}

// Function to create a color indicator badge
function createColorBadge(color) {
    if (!color || (color !== 'red' && color !== 'green')) return '-';
    
    const colorName = color === 'red' ? 'Risk' : 'Good';
    return `<span class="color-badge ${color}"></span><span class="color-text">${colorName}</span>`;
}

// Function to create a legend for the results
function createResultsLegend() {
    const legend = document.createElement('div');
    legend.className = 'results-legend';
    legend.innerHTML = `
        <p><strong>Legend:</strong></p>
        <div>
            <span class="legend-item"><span class="color-badge green"></span> Green: Beneficial or normal variant</span>
            <span class="legend-item"><span class="color-badge red"></span> Red: Potentially harmful or risk-associated variant</span>
            <span class="legend-item"><span class="circle-demo" style="background-color: #28a745;"></span> Magnitude 0-1.9: Low significance</span>
            <span class="legend-item"><span class="circle-demo" style="background-color: #ffc107;"></span> Magnitude 2-2.9: Moderate significance</span>
            <span class="legend-item"><span class="circle-demo" style="background-color: #dc3545;"></span> Magnitude 3+: High significance</span>
        </div>
        <p class="legend-note">Click on column headers to sort the table by that column.</p>
    `;
    return legend;
}

// Function to make a table sortable
function makeTableSortable(table) {
    const headers = table.querySelectorAll('th');
    
    headers.forEach((header, index) => {
        // Skip columns that don't make sense to sort (like complex interpretation text)
        if (header.textContent.trim() === 'Interpretation') return;
        
        header.classList.add('sortable');
        header.dataset.sortDirection = 'desc'; // Start with descending order
        header.addEventListener('click', () => {
            const direction = header.dataset.sortDirection === 'asc' ? 'desc' : 'asc';
            
            // Reset all headers
            headers.forEach(h => {
                h.dataset.sortDirection = '';
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Set current header
            header.dataset.sortDirection = direction;
            header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
            
            // Perform the sort
            sortTableByColumn(table, index, direction);
        });
    });
}

// Function to sort a table by a specific column
function sortTableByColumn(table, columnIndex, direction) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Find if there is a "Missing SNPs" row and remove it from sorting
    const missingSnpsRow = rows.find(row => {
        const firstCell = row.querySelector('td:first-child');
        return firstCell && firstCell.textContent === 'Missing SNPs';
    });
    
    // Filter out the "Missing SNPs" row if found
    const rowsToSort = missingSnpsRow ? 
        rows.filter(row => row !== missingSnpsRow) : 
        rows;
    
    // Sort rows based on the content of cells in the given column
    const sortedRows = rowsToSort.sort((rowA, rowB) => {
        const cellA = rowA.querySelectorAll('td')[columnIndex];
        const cellB = rowB.querySelectorAll('td')[columnIndex];
        
        if (!cellA || !cellB) return 0;
        
        let valueA, valueB;
        
        // Check if this is a magnitude column with a number
        if (cellA.querySelector('.magnitude-circle') && cellB.querySelector('.magnitude-circle')) {
            valueA = parseFloat(cellA.querySelector('.magnitude-circle').textContent) || 0;
            valueB = parseFloat(cellB.querySelector('.magnitude-circle').textContent) || 0;
        } 
        // Check if this is a color/impact column
        else if (cellA.querySelector('.color-badge') && cellB.querySelector('.color-badge')) {
            const colorA = cellA.querySelector('.color-badge').classList.contains('red') ? 1 : 0;
            const colorB = cellB.querySelector('.color-badge').classList.contains('red') ? 1 : 0;
            valueA = colorA;
            valueB = colorB;
        }
        // Default string comparison
        else {
            valueA = cellA.textContent.trim();
            valueB = cellB.textContent.trim();
        }
        
        // Compare based on type
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return direction === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
            return direction === 'asc' ? 
                valueA.localeCompare(valueB) : 
                valueB.localeCompare(valueA);
        }
    });
    
    // Remove existing rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Add sorted rows
    sortedRows.forEach(row => {
        tbody.appendChild(row);
    });
    
    // Append the "Missing SNPs" row at the end if it exists
    if (missingSnpsRow) {
        tbody.appendChild(missingSnpsRow);
    }
}

// Function to display analysis results
export function displayResults(results, fileName) {
    const resultsArea = document.getElementById('resultsArea');
    
    // Create section for this file
    const fileSection = document.createElement('div');
    fileSection.id = `results-${fileName.replace(/\s+/g, '-').replace(/[.]/g, '_')}`;
    fileSection.className = 'file-results';
    
    // Add title
    const fileTitle = document.createElement('h3');
    fileTitle.textContent = `Results for ${fileName}`;
    fileSection.appendChild(fileTitle);
    
    // Add legend
    fileSection.appendChild(createResultsLegend());
    
    // Create table
    const table = document.createElement('table');
    table.className = 'results-table';
    
    // Add table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>SNP</th>
            <th>RS ID</th>
            <th>Gene</th>
            <th>Genotype</th>
            <th>Magnitude</th>
            <th>Impact</th>
            <th>Interpretation</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Add table body
    const tbody = document.createElement('tbody');
    
    // Sort results by magnitude (high to low) and then by gene name
    results.sort((a, b) => {
        // Primary sort by magnitude (high to low)
        const magA = a.magnitudeValue || 0;
        const magB = b.magnitudeValue || 0;
        if (magB !== magA) return magB - magA;
        
        // Secondary sort by gene name
        return a.gene?.localeCompare(b.gene) || 0;
    });
    
    // Add the normal results
    for (const result of results) {
        const row = document.createElement('tr');
        
        // Add SNP name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = result.name || '';
        
        // Add rsid cell
        const rsidCell = document.createElement('td');
        
        // Add RS ID with link
        if (result.snpediaUrl) {
            rsidCell.innerHTML = `<a href="${result.snpediaUrl}" target="_blank">${result.rsid}</a>`;
        } else {
            rsidCell.textContent = result.rsid;
        }
        
        const geneCell = document.createElement('td');
        geneCell.textContent = result.gene;
        
        const genotypeCell = document.createElement('td');
        genotypeCell.textContent = result.genotype;
        
        // Create the magnitude cell
        const magnitudeCell = document.createElement('td');
        magnitudeCell.innerHTML = createMagnitudeCircle(result.magnitudeValue);
        
        // Add tooltip for magnitude explanation
        if (result.magnitudeValue && result.magnitudeDesc) {
            const circle = magnitudeCell.querySelector('.magnitude-circle');
            circle.classList.add('has-tooltip');
            circle.innerHTML += `
        <span class="tooltiptext">
            <strong>Magnitude ${result.magnitudeValue}:</strong> ${result.magnitudeDesc}
        </span>
    `;
        }

        // Create impact (color) cell
        const impactCell = document.createElement('td');
        impactCell.innerHTML = createColorBadge(result.color);
        impactCell.className = 'impact-cell';
        
        const interpretationCell = document.createElement('td');
        interpretationCell.innerHTML = result.interpretation;
        
        row.appendChild(nameCell);
        row.appendChild(rsidCell);
        row.appendChild(geneCell);
        row.appendChild(genotypeCell);
        row.appendChild(magnitudeCell);
        row.appendChild(impactCell);
        row.appendChild(interpretationCell);
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    fileSection.appendChild(table);
    
    // Make the table sortable
    makeTableSortable(table);
    
    // Append to results area
    resultsArea.appendChild(fileSection);
    
    // Log debug info
    console.log(`Displayed ${results.length} results for ${fileName}`);
    console.log('Results with color values:');
    results.filter(r => r.color).forEach(r => {
        console.log(`${r.rsid}: Color ${r.color}, Magnitude: ${r.magnitudeValue}`);
    });
}

// Function to set up comparison UI
export function setupComparisonUI(processedFilesData) {
    const comparisonArea = document.getElementById('comparisonArea');
    const fileSelectionDiv = document.getElementById('fileSelectionForComparison');
    const compareButton = document.getElementById('compareButton');
    const comparisonTableContainer = document.getElementById('comparisonTableContainer');
    
    // Show comparison section
    comparisonArea.style.display = 'block';
    
    // Clear previous selection UI
    fileSelectionDiv.innerHTML = '<p>Select files to compare:</p>';
    
    // Add checkboxes for each file
    const fileNames = Array.from(processedFilesData.keys());
    for (const fileName of fileNames) {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `compare-${fileName.replace(/\s+/g, '-').replace(/[.]/g, '_')}`;
        checkbox.value = fileName;
        checkbox.checked = true; // Check by default
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = fileName;
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        fileSelectionDiv.appendChild(checkboxContainer);
    }
    
    // Set up compare button click handler
    compareButton.onclick = () => {
        // Get selected files
        const selectedFiles = [];
        const checkboxes = fileSelectionDiv.querySelectorAll('input[type="checkbox"]');
        for (const checkbox of checkboxes) {
            if (checkbox.checked) {
                selectedFiles.push(checkbox.value);
            }
        }
        
        // Need at least 2 files to compare
        if (selectedFiles.length < 2) {
            comparisonTableContainer.innerHTML = '<p>Please select at least 2 files to compare.</p>';
            return;
        }
        
        compareFiles(selectedFiles, processedFilesData, comparisonTableContainer);
    };
}

// Function to compare files
function compareFiles(selectedFiles, processedFilesData, container) {
    // Clear previous results
    container.innerHTML = '';
    
    // Add legend
    container.appendChild(createResultsLegend());
    
    // Get the data for each selected file
    const fileData = selectedFiles.map(fileName => ({
        name: fileName,
        results: processedFilesData.get(fileName)
    }));
    
    // Create map of all SNPs across selected files
    const allSnps = new Map();
    for (const file of fileData) {
        for (const result of file.results) {
            if (result.rsid.startsWith('rs')) {  // Only process actual SNPs, not metadata like "Missing SNPs"
                if (!allSnps.has(result.rsid)) {
                    allSnps.set(result.rsid, {
                        gene: result.gene,
                        genotypes: new Map(),
                        name: result.name || result.rsid,
                        magnitudeValue: result.magnitudeValue,
                        magnitudeClass: result.magnitudeClass,
                        magnitudeDesc: result.magnitudeDesc,
                        color: result.color,
                        snpediaUrl: result.snpediaUrl
                    });
                }
                allSnps.get(result.rsid).genotypes.set(file.name, result.genotype);
            }
        }
    }
    
    // Create a table for the comparison
    const table = document.createElement('table');
    table.className = 'comparison-table';
    
    // Add header row with file names
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add column headers
    headerRow.innerHTML = `
        <th>SNP</th>
        <th>Gene</th>
        <th>Magnitude</th>
        <th>Impact</th>
    `;
    
    // Add a column for each file
    for (const fileName of selectedFiles) {
        const th = document.createElement('th');
        th.textContent = fileName;
        headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Add rows for each SNP
    const tbody = document.createElement('tbody');
    
    // Convert SNP map to array and sort by magnitude
    const snpEntries = Array.from(allSnps.entries());
    snpEntries.sort((a, b) => {
        // Sort by magnitude (high to low)
        const magA = a[1].magnitudeValue || 0;
        const magB = b[1].magnitudeValue || 0;
        if (magB !== magA) return magB - magA;
        
        // Then sort by gene name
        return a[1].gene?.localeCompare(b[1].gene) || 0;
    });
    
    for (const [rsid, data] of snpEntries) {
        const row = document.createElement('tr');
        
        // Add magnitude class if applicable
        if (data.magnitudeClass) {
            row.className = data.magnitudeClass;
        }
        
        // Determine if this row should be highlighted (different genotypes across files)
        const genotypes = new Set(data.genotypes.values());
        const isDifferent = genotypes.size > 1;
        
        if (isDifferent) {
            row.classList.add('highlight-diff');
        }
        
        // Add rsid cell
        const rsidCell = document.createElement('td');
        
        // Add SNP name or rsid
        if (data.snpediaUrl) {
            rsidCell.innerHTML = `<a href="${data.snpediaUrl}" target="_blank">${data.name || rsid}</a>`;
        } else {
            rsidCell.textContent = data.name || rsid;
        }
        
        row.appendChild(rsidCell);
        
        // Add gene cell
        const geneCell = document.createElement('td');
        geneCell.textContent = data.gene;
        row.appendChild(geneCell);
        
        // Add magnitude cell with circle
        const magnitudeCell = document.createElement('td');
        magnitudeCell.innerHTML = createMagnitudeCircle(data.magnitudeValue);
        
        // Add tooltip for magnitude explanation
        if (data.magnitudeValue && data.magnitudeDesc) {
            const circle = magnitudeCell.querySelector('.magnitude-circle');
            circle.classList.add('has-tooltip');
            circle.innerHTML += `
        <span class="tooltiptext">
            <strong>Magnitude ${data.magnitudeValue}:</strong> ${data.magnitudeDesc}
        </span>
    `;
        }
        
        row.appendChild(magnitudeCell);
        
        // Add impact (color) cell
        const impactCell = document.createElement('td');
        impactCell.innerHTML = createColorBadge(data.color);
        impactCell.className = 'impact-cell';
        row.appendChild(impactCell);
        
        // Add a cell for each file's genotype
        for (const fileName of selectedFiles) {
            const genotypeCell = document.createElement('td');
            const genotype = data.genotypes.get(fileName) || 'Not found';
            genotypeCell.textContent = genotype;
            
            // Highlight different cells
            if (isDifferent) {
                genotypeCell.className = 'diff-value';
            }
            
            row.appendChild(genotypeCell);
        }
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // Make the table sortable
    makeTableSortable(table);
    
    // Add summary
    const summary = document.createElement('div');
    summary.className = 'comparison-summary';
    summary.innerHTML = `<p><strong>Summary:</strong> Compared ${selectedFiles.length} files across ${allSnps.size} SNPs. 
                           Rows highlighted in yellow indicate differing genotypes between files.</p>`;
    container.appendChild(summary);
}