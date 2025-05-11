# DnaHacker

A JavaScript module for analyzing genetic data against known SNP (Single Nucleotide Polymorphism) definitions.

## Overview

This tool helps analyze DNA data by identifying important genetic variations (SNPs) and providing interpretations based on scientific research. It's particularly useful for understanding genetic predispositions and characteristics encoded in raw genetic data files.

## Privacy Note
Even when running locally, DNAHacker processes all data entirely within your browser. Your genetic data never leaves your computer, regardless of whether you're using the GitHub Pages version or running locally.

## Features

- **SNP Data Loading**: Loads target SNP definitions from a JSON file
- **Genotype Analysis**: Identifies and interprets genotypes from raw genetic data
- **APOE Analysis**: Special processing for APOE gene SNPs (rs429358 and rs7412) which are linked to Alzheimer's risk
- **Orientation Handling**: Automatically flips alleles for minus-orientation SNPs
- **Magnitude Assessment**: Evaluates the significance of findings using SNPedia's magnitude scale
- **Comprehensive Results**: Returns detailed information about each identified SNP

## How It Works

1. The module loads a database of target SNPs from a JSON file
2. Raw genetic data is parsed to identify matching SNPs
3. Genotypes are normalized, flipped as needed based on orientation
4. Special combinations (like APOE variants) are processed
5. Results are organized with interpretations and significance levels

## Magnitude Scale
The module uses SNPedia's magnitude scale for interpreting significance:
- 0: Common genotype, nothing interesting known
- 0.1-1: Low significance
- 2-3: Moderately interesting findings
- 4-9: High significance, attention warranted
- 10: Very high significance, critical information

## ⚠️ Format Compatibility

### Currently Supported Formats

**This tool currently only supports DNA kits downloaded from MyHeritage in ZIP format.**

When you download your raw DNA data from MyHeritage, you receive a ZIP file containing a CSV file with your genetic data. This tool is specifically designed to process this format.

### Contributing Support for Other Formats

We welcome Pull Requests that add support for additional DNA testing services! Popular DNA testing platforms that could be added include:

- **23andMe** (.txt format)
- **AncestryDNA** (.txt or .zip format)
- **FamilyTreeDNA** (.csv format)
- **Living DNA** (.txt format)
- **GEDmatch** (various formats)

Each service provides raw data in slightly different formats. The key differences typically include:
- Column order and naming
- Header information
- Allele representation
- File packaging (ZIP vs individual files)

### How to Add Support for a New Format

If you'd like to contribute support for another DNA testing service:

1. Examine the format of the raw data from that service
2. Modify the `fileProcessor.js` to detect and handle the new format
3. Update the `csvParser.js` to correctly parse the column structure
4. Add appropriate validation to ensure data is interpreted correctly
5. Update the UI to indicate support for the new format
6. Submit a Pull Request with your changes

Even small contributions like documentation improvements or bug reports are valuable!

_Note: If you're a user of another DNA testing service and would like to see it supported, feel free to open an issue with sample format information (no actual genetic data!) to help developers add support._

## Running DNAHacker Locally

DNAHacker is a client-side application that processes DNA data directly in your browser. No server is required for normal operation. However, due to browser security restrictions, you'll need a local web server to run the application on your machine.

### Option 1: Using npx http-server (Recommended)

This method requires [Node.js](https://nodejs.org/) to be installed on your computer.

1. **Open a terminal or command prompt**

2. **Navigate to the DNAHacker directory**
   ```bash
   cd path/to/dnahacker
   ```

3. **Start the server with npx**
   ```bash
   npx http-server
   ```

4. **Access the application**
    - Open your browser and navigate to: [http://localhost:8080](http://localhost:8080)
    - You should see the DNAHacker interface

The server will continue running until you stop it (typically with Ctrl+C). Any changes you make to the files will be immediately available when you refresh the browser.

### Option 2: Using Python's built-in HTTP server

If you have Python installed but not Node.js:

**For Python:**
   ```bash
   python -m SimpleHTTPServer 8080
   ```


## About Commercial DNA Analysis Services

### The Problem with Commercial Genomic Interpretation

Many commercial DNA analysis websites operate on a business model that capitalizes on health anxiety and the fear of missing out (FOMO) on critical health information. Here's what consumers should be aware of:

- **Paywall Strategies**: Many sites offer basic analysis for free, then gate the most concerning or interesting findings behind expensive paywalls
- **Exaggerated Risk Framing**: Results often emphasize "increased risk" without proper context about the absolute risk being small
- **Medical Anxiety Exploitation**: Services may use alarming language to prompt impulse purchases of premium reports
- **Limited Scientific Context**: Complex genetic interactions are often oversimplified, leading to misleading conclusions
- **Lack of Medical Integration**: Results typically aren't integrated with your personal medical history, family history, or lifestyle factors

### The Open Source Alternative

This tool aims to provide a transparent alternative to commercial services by:

1. **Complete Local Processing**: All analysis happens in your browser - your genetic data never leaves your computer
2. **No Paywalls**: All available interpretations are accessible without hidden fees
3. **Transparent Sources**: All interpretations cite their sources and note their limitations
4. **Educational Focus**: Emphasis on understanding genetics rather than selling services
5. **Context-Aware Results**: Providing magnitude scores and contextual information rather than binary "good/bad" classifications

Remember that genetic predispositions are just one factor among many that influence health outcomes. Lifestyle, environment, and many other genes not covered in consumer DNA tests often play more significant roles in determining health.

### For Medical Concerns

If you have specific medical concerns, consult a healthcare provider or certified genetic counselor who can interpret genetic information in the proper clinical context. Online tools, including this one, are educational resources, not substitutes for professional medical advice.

## License

This project contains two distinct components with different licenses:

1. **Software Code**: The SNP Parser software itself is licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.en.html).

2. **SNP Interpretation Data**: The SNP interpretations are primarily derived from [SNPedia](https://www.snpedia.com/) and are used in accordance with the [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License (CC BY-NC-SA 3.0)](https://creativecommons.org/licenses/by-nc-sa/3.0/).

### Attribution Statement

The genetic interpretations in this project are based substantially on information from [SNPedia](https://www.snpedia.com/), used under the CC BY-NC-SA 3.0 license. While the core interpretations are derived from SNPedia:

- Some interpretations may have been modified or simplified for clarity
- Additional interpretations not found on SNPedia may have been incorporated from other scientific sources
- The presentation format and categorization system may differ from SNPedia's original format

Any modifications or additions to the SNPedia content are also released under the CC BY-NC-SA 3.0 license, in accordance with the ShareAlike requirement.

### Usage Restrictions

In compliance with SNPedia's license terms:

- This tool is for **non-commercial use only**
- Any distribution or modification must maintain this attribution
- Derivative works must be shared under the same license terms

If you wish to use this project for commercial purposes, you would need to:
1. Obtain explicit permission from SNPedia for the interpretation data
2. Comply with the GPL-3.0 requirements for the software code