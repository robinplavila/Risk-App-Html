/**
 * PDF Generation Module
 * 
 * This module contains all PDF generation logic for the Axis Technology Insurance Application
 * including font management, custom typography, table of contents, and dynamic front cover generation.
 * 
 * Dependencies:
 * - jsPDF (window.jspdf)
 * - pdf-lib (window.PDFLib)
 * - Custom fonts (base64 encoded)
 * - Typography utilities (registerFontsUMD, useFontUMD)
 */

async function generatePDF() {
    // Helper to render selected radio option with Wingdings2BoxedCheck
    function renderSelectedRadioOption(contentDoc, selectedValue, options, margin) {
        const selectedOption = options.find(option => selectedValue === option.value);
        if (selectedOption) {
            window.useFontUMD(contentDoc, 'Wingdings2BoxedCheck');
            const status = '\u2611'; // Boxed checkmark
            window.useFontUMD(contentDoc, 'AptosSerifReg12'); // Reset font
            addWrappedText(`${status} ${selectedOption.label}`, margin);
        } else {                        
            window.useFontUMD(contentDoc, 'AptosSerifReg12'); // Reset font
            addWrappedText(`No selection`, margin);
        }
    }
        
    try {
        showNotification('📄 Generating PDF with static cover and end pages...', 'info');
        
        // Collect all form data
        const formData = collectFormData();
        
        // First, generate the content PDF using jsPDF (without front and end pages)
        const { jsPDF } = window.jspdf;
        const contentDoc = new jsPDF();
        
        // Register custom fonts
        window.registerFontsUMD(contentDoc);
        
        let yPosition = 50; // Start below header area
        const pageHeight = contentDoc.internal.pageSize.height;
        const margin = 20;
        const headerHeight = 45; // Space reserved for header
        const lineHeight = 6;
        const brandBlue = [0, 80, 240]; // #0050F0 - Primary brand color
        const skyBlue = [0, 188, 255]; // #00bcff - Sky blue for highlights
        const darkNavy = [0, 0, 54]; // #000036 - Dark navy
        const sectionTitleColor = brandBlue; // Use brand blue for section titles
        
        // Helper function to add header to each page
        function addPageHeader(currentPageNum, totalPages) {
            const pageWidth = contentDoc.internal.pageSize.width;
            
            // Axis logo image (left side)
            try {
                // Load and add logo image
                const logoImg = new Image();
                logoImg.onload = function() {
                    contentDoc.addImage(logoImg, 'PNG', margin, 15, 30, 15); // x, y, width, height
                };
                logoImg.src = './pdf/logo.png';
                // For synchronous operation, we'll use a different approach
                contentDoc.addImage('./pdf/logo.png', 'PNG', margin, 15, 30, 15);
            } catch (error) {
                // Fallback to text if image fails to load
                contentDoc.setFontSize(12);
                contentDoc.setFont('AptosSerif', 'bold');
                contentDoc.setTextColor(0, 79, 240); // #004FF0 color for Axis
                contentDoc.text('AXIS', margin, 25);
            }
            
            // Technology Insurance Application | page number (single line, right side)
            window.useFontUMD(contentDoc, 'PoppinsBlack12');
            contentDoc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]); // Blue color
            //const headerText = `Technology Insurance Application | ${currentPageNum}`;
            const headerText = `Technology Insurance Application`;
            const textWidth = contentDoc.getTextWidth(headerText);
            contentDoc.text(headerText, pageWidth - margin - textWidth, 25);
            
            // Blue border line at bottom of header
            contentDoc.setDrawColor(brandBlue[0], brandBlue[1], brandBlue[2]); // #0050F0 color
            contentDoc.setLineWidth(0.5);
            contentDoc.line(margin, 35, pageWidth - margin, 35);
            
            // Reset text color to black for content
            contentDoc.setTextColor(0, 0, 0);
        }
        
        // Helper function to add new page if needed
        function checkPageBreak(additionalHeight = 15) {
            if (yPosition + additionalHeight > pageHeight - margin) {
                contentDoc.addPage();
                yPosition = headerHeight + 5; // Start below header
            }
        }
        
        // Helper function to add text with word wrapping
        function addWrappedText(text, x, fontSize = 10, maxWidth = 170) {
            contentDoc.setFontSize(fontSize);
            const splitText = contentDoc.splitTextToSize(text, maxWidth);
            splitText.forEach(line => {
                checkPageBreak();
                contentDoc.text(line, x, yPosition);
                yPosition += lineHeight;
            });
        }
        
        // Helper function to add section title with blue color
        function addSectionTitle(text, x) {
            window.useFontUMD(contentDoc, 'PoppinsExtraBold16');
            contentDoc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]); // Blue color
            addWrappedText(text, x, 16); // Pass font size to wrapped text (16 points)
            contentDoc.setTextColor(0, 0, 0); // Reset to black
            yPosition += 5;
        }
        
        // Generate front cover page with dynamic content
        async function generateFrontCover() {
            // Hybrid Approach: Create text overlay with jsPDF, then merge with template using pdf-lib
            
            // Step 1: Create text overlay PDF using jsPDF with base64 fonts
            const overlayDoc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });
            
            // Register fonts
            window.registerFontsUMD(overlayDoc);
            
            // Get company name and submission date
            const companyName = formData.generalInfo?.legal_name || 'ABC Sample Corporation';
            const submissionDate = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            
            // Position text at bottom left (convert from bottom-up to top-down coordinates)
            const leftMargin = 110;
            const pageHeight = 842; // A4 size height in points
            const bottomMargin = 240; // Distance from bottom
            const yPosition = pageHeight - bottomMargin; // Convert to jsPDF coordinates
            
            // Add company name in Sky Blue using Poppins Black 14pt
            window.useFontUMD(overlayDoc, 'PoppinsBlack14');
            overlayDoc.setTextColor(0, 188, 255); // Sky Blue
            overlayDoc.text(companyName, leftMargin, yPosition - 20);
            
            // Add submission date/time in Black using Aptos Serif Regular 14pt
            window.useFontUMD(overlayDoc, 'AptosSerifReg14');
            overlayDoc.setTextColor(0, 0, 0); // Black
            overlayDoc.text(`Submitted: ${submissionDate}`, leftMargin, yPosition);
            
            // Get overlay PDF as ArrayBuffer
            const overlayPdfBytes = overlayDoc.output('arraybuffer');
            
            // Step 2: Load the existing front cover template
            const templatePdfBytes = await fetch('./pdf/front cover page.pdf').then(res => res.arrayBuffer());
            
            // Step 3: Merge using pdf-lib
            const templateDoc = await PDFLib.PDFDocument.load(templatePdfBytes);
            const overlayPdfDoc = await PDFLib.PDFDocument.load(overlayPdfBytes);
            
            // Get the first page from both documents
            const [templatePage] = templateDoc.getPages();
            const [overlayPage] = await templateDoc.copyPages(overlayPdfDoc, [0]);
            
            // Embed the overlay page content onto the template page
            // Get the overlay content as embedded page
            const embeddedOverlay = await templateDoc.embedPage(overlayPage);
            
            // Draw the overlay on top of the template
            templatePage.drawPage(embeddedOverlay, {
                x: 0,
                y: 0,
                width: templatePage.getWidth(),
                height: templatePage.getHeight(),
                opacity: 1
            });
            
            // Save and return the merged PDF
            return await templateDoc.save();
        }
        
        // Generate the dynamic front cover
        const frontCoverPdfBytes = await generateFrontCover();
        
        // Start directly with content (no front cover page in contentDoc)
        yPosition = headerHeight + 5; // Reset position for content pages
        
        // Initialize page tracking for ToC
        const sectionPageNumbers = {};
        
        // Section 1: Sectors - Enhanced with questions and options
        checkPageBreak(20);
        sectionPageNumbers['1. Sectors'] = contentDoc.internal.getNumberOfPages() + 2; // +2 for front cover and ToC
        addSectionTitle('1. Sectors', margin);

        window.useFontUMD(contentDoc, 'AptosSerifBold12');
        addWrappedText('Question: Does your business provide products or services within any of the following sectors?', margin, 12);
        yPosition += 3;
        
        window.useFontUMD(contentDoc, 'AptosSerifReg12');
        
        // Define all sector options
        const sectorOptions = [
            { value: 'ai', label: 'Artificial Intelligence' },
            { value: 'defi', label: 'Decentralized Finance & Digital Assets' },
            { value: 'robotics', label: 'Autonomous Robotics' }
        ];
        
        sectorOptions.forEach(option => {
            const isSelected = formData.sectors.includes(option.value);
            const status = isSelected ? '\u2611' : '\u2610'; // Boxed checkmark or empty box
            addWrappedText(`${status} ${option.label}`, margin);
        });
        
        yPosition += 10;
        
        // Enhanced function for Section 2 with questions and selected options
        function addSection2WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('2. General Information', margin);
            
            // Define all Section 2 questions with their field names  
            const section2Questions = [
                {
                    question: '1. Legal Name of Organization',
                    field: 'legal_name',
                    type: 'text'
                },
                {
                    question: 'Location of Incorporation',
                    field: 'incorporation_location',
                    type: 'text'
                },
                {
                    question: '2. Mailing Address',
                    field: 'mailing_address',
                    type: 'textarea'
                },
                {
                    question: '3. List all subsidiaries & Location of Incorporation',
                    field: 'subsidiaries',
                    type: 'textarea'
                },
                {
                    question: '4. List all Physical Locations',
                    field: 'physical_locations',
                    type: 'textarea'
                },
                {
                    question: '5. List all URLs',
                    field: 'urls',
                    type: 'textarea'
                },
                {
                    question: '6. Year Company Established',
                    field: 'year_established',
                    type: 'number'
                },
                {
                    question: '7. Number of Employees',
                    field: 'num_employees',
                    type: 'number'
                },
                {
                    question: '8. Are any Employees based outside of Canada?',
                    field: 'employees_outside_canada',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        question: 'If yes, list the country and the number of employees in each:',
                        field: 'employees_outside_list'
                    }
                },
                {
                    question: '9. Breach Response Contact',
                    fields: [
                        { field: 'breach_contact_name', label: 'Name' },
                        { field: 'breach_contact_title', label: 'Title' },
                        { field: 'breach_contact_email', label: 'Email' },
                        { field: 'breach_contact_phone', label: 'Phone' }
                    ],
                    type: 'composite'
                },
                {
                    question: '10. Any recent or planned mergers, acquisitions, or divestitures?',
                    field: 'mergers_acquisitions',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        question: 'Please provide details:',
                        field: 'mergers_description'
                    }
                },
                {
                    question: '11. Is your organization regulated by any governing body or required to comply with specific legislation, standards, or licensing requirements?',
                    field: 'organization_regulated',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        question: 'If yes, please specify the authority and relevant legislation:',
                        field: 'regulated_description'
                    }
                },
                {
                    question: '12. Does your organization hold any recognized certifications (e.g., ISO 27001, SOC 2, PCI DSS, or equivalent)?',
                    field: 'organization_certifications',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        question: 'If yes, please specify:',
                        field: 'certifications_description'
                    }
                },
                {
                    question: '13. Does your organization undergo any independent audits, assessments, or third-party evaluations of its internal controls or risk management practices?',
                    field: 'organization_audits',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        question: 'If yes, please specify the scope, frequency, and auditing party:',
                        field: 'audits_description'
                    }
                }
            ];
            
            section2Questions.forEach(q => {
                checkPageBreak(15);                            
                window.useFontUMD(contentDoc, 'AptosSerifBold12');
                addWrappedText(q.question, margin);
                yPosition += 2;
                
                window.useFontUMD(contentDoc, 'AptosSerifReg12');
                
                if (q.type === 'text' || q.type === 'textarea' || q.type === 'number') {
                    const value = sectionData[q.field];
                    if (value) {
                        addWrappedText(`Answer: ${value}`, margin);
                    } else {
                        addWrappedText('Answer: Not provided', margin);
                    }
                } else if (q.type === 'radio') {
                    const selectedValue = sectionData[q.field];
                    renderSelectedRadioOption(contentDoc, selectedValue, q.options, margin);
                    
                    // Handle follow-up questions
                    if (q.followUp && selectedValue === q.followUp.condition) {
                        yPosition += 2;
                        contentDoc.setFont(undefined, 'italic');
                        addWrappedText(q.followUp.question, margin);
                        contentDoc.setFont(undefined, 'normal');
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Answer: ${followUpValue}`, margin);
                        } else {
                            addWrappedText('Answer: Not provided', margin);
                        }
                    }
                } else if (q.type === 'composite') {
                    q.fields.forEach(field => {
                        const value = sectionData[field.field];
                        addWrappedText(`${field.label}: ${value || 'Not provided'}`, margin);
                    });
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 3 with questions and selected options
        function addSection3WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('3. Operations', margin);
            
            // Define all Section 3 questions with their field names  
            const section3Questions = [
                {
                    question: '1. Briefly describe the services and/or technology products your company provides',
                    field: 'services_description',
                    type: 'textarea'
                },
                {
                    question: '2. Percentage of revenue derived from each activity',
                    type: 'table',
                    fields: [
                        { field: 'revenue_software', label: 'Custom Software Development' },
                        { field: 'revenue_saas', label: 'Software as a Service' },
                        { field: 'revenue_consulting', label: 'Consulting Services' },
                        { field: 'revenue_hardware', label: 'Hardware' },
                        { field: 'revenue_other', label: 'Other' }
                    ]
                },
                {
                    question: '3. Do you operate in any of the following areas?',
                    type: 'risk_areas',
                    fields: [
                        { field: 'risk_critical_infrastructure', label: 'Critical Infrastructure', details: 'critical_infrastructure_details' },
                        { field: 'risk_financial_services', label: 'Financial Services', details: 'financial_services_details' },
                        { field: 'risk_healthcare', label: 'Healthcare', details: 'healthcare_details' },
                        { field: 'risk_government', label: 'Government/Defense', details: 'government_details' },
                        { field: 'risk_aerospace', label: 'Aerospace', details: 'aerospace_details' },
                        { field: 'risk_rail', label: 'Rail', details: 'rail_details' },
                        { field: 'risk_mining_oil_gas', label: 'Mining/Oil & Gas', details: 'mining_oil_gas_details' },
                        { field: 'risk_energy', label: 'Energy', details: 'energy_details' },
                        { field: 'risk_adult_entertainment', label: 'Adult Entertainment/Gambling', details: 'adult_entertainment_details' },
                        { field: 'risk_semiconductors', label: 'Semi-Conductors', details: 'semiconductors_details' },
                        { field: 'risk_architecture_engineering', label: 'Architecture/Engineering', details: 'architecture_engineering_details' }
                    ]
                },
                {
                    question: '4. Do you sell tangible products?',
                    field: 'sell_tangible_products',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        fields: [
                            { field: 'tangible_products_description', label: 'Product description' },
                            { field: 'tangible_products_revenue', label: '% Revenue' }
                        ]
                    }
                },
                {
                    question: '5. Do you (or your subcontractors) install hardware at client sites?',
                    field: 'install_hardware',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'hardware_installation_revenue',
                        label: '% revenue'
                    }
                },
                {
                    question: '6. Do you provide hosting services to third parties?',
                    field: 'hosting_services',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        subQuestion: 'If yes, do you use:',
                        field: 'hosting_infrastructure',
                        options: [
                            { value: 'own', label: 'Own Infrastructure' },
                            { value: 'third_party', label: 'Third Party' }
                        ],
                        thirdPartyFields: [
                            { field: 'third_party_name', label: 'Provider name' },
                            { field: 'third_party_tier', label: 'Tier rating' }
                        ]
                    }
                },
                {
                    question: '7. Do you use artificial intelligence (AI) or machine learning (ML) tools in your business operations?',
                    field: 'ai_ml_usage',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'ai_ml_description',
                        label: 'Details'
                    }
                },
                {
                    question: '8. Do you provide any managed IT services?',
                    field: 'managed_it_services',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'managed_it_revenue',
                        label: '% revenue'
                    }
                },
                {
                    question: '9. Approximately how many customers do you have?',
                    field: 'customer_count',
                    type: 'number'
                },
                {
                    question: '10. List the top 3 clients over the past 3 years',
                    type: 'client_table',
                    fields: [
                        { name: 'client_1_name', service: 'client_1_service', duration: 'client_1_duration', value: 'client_1_value' },
                        { name: 'client_2_name', service: 'client_2_service', duration: 'client_2_duration', value: 'client_2_value' },
                        { name: 'client_3_name', service: 'client_3_service', duration: 'client_3_duration', value: 'client_3_value' }
                    ]
                }
            ];
            
            section3Questions.forEach(q => {
                checkPageBreak(15);
                contentDoc.setFontSize(12);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 2;
                
                contentDoc.setFontSize(10);
                contentDoc.setFont(undefined, 'normal');
                
                if (q.type === 'text' || q.type === 'textarea' || q.type === 'number') {
                    const value = sectionData[q.field];
                    addWrappedText(`Answer: ${value || 'Not provided'}`, margin);
                } else if (q.type === 'table') {
                    // Create AutoTable for revenue percentages
                    checkPageBreak(30);
                    
                    const tableData = q.fields.map(field => {
                        const value = sectionData[field.field] || '0';
                        return [field.label, value + '%'];
                    });
                    
                    contentDoc.autoTable({
                        head: [['Activity', 'Percentage']],
                        body: tableData,
                        startY: yPosition + 5,
                        margin: { left: margin, top: headerHeight + 5 }, // Account for header space
                        styles: {
                            fontSize: 10,
                            cellPadding: 3
                        },
                        headStyles: {
                            fillColor: brandBlue, // #0050F0 color
                            textColor: 255,
                            //fontStyle: 'bold',
                            didParseCell: function (data) {
                                if (data.section === 'head') {
                                    window.useFontUMD(contentDoc, 'PoppinsExtraBold16');
                                }
                            }
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        didDrawPage: function (data) {
                            // Add header to each page where table appears
                            if (data.pageNumber > 1) {
                                addPageHeader(data.pageNumber, contentDoc.internal.getNumberOfPages());
                            }
                        },
                        didAddPage: function (data) {
                            // Ensure new page starts below header
                            data.settings.margin.top = headerHeight + 5;
                        }
                    });
                    
                    yPosition = contentDoc.lastAutoTable.finalY + 10;
                } else if (q.type === 'risk_areas') {
                    // Create AutoTable for risk areas
                    checkPageBreak(35);
                    
                    const tableData = q.fields.map(area => {
                        const selectedValue = sectionData[area.field];
                        const details = selectedValue === 'yes' ? (sectionData[area.details] || 'No details') : 'N/A';
                        const yesNoStatus = selectedValue === 'yes' ? 'Yes' : (selectedValue === 'no' ? 'No' : '-');
                        
                        return [
                            area.label,
                            yesNoStatus,
                            //details.length > 25 ? details.substring(0, 22) + '...' : details
                            details
                        ];
                    });
                    
                    contentDoc.autoTable({
                        head: [['Area', 'Yes/No', 'Details']],
                        body: tableData,
                        startY: yPosition + 5,
                        margin: { left: margin, top: headerHeight + 5 }, // Account for header space
                        styles: {
                            fontSize: 10,
                            cellPadding: 3
                        },
                        headStyles: {
                            fillColor: brandBlue, // #0050F0 color
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        columnStyles: {
                            0: { cellWidth: "30%" },
                            1: { cellWidth: "25%", halign: 'center' },
                            2: { cellWidth: "80%" }
                        },
                        didDrawPage: function (data) {
                            // Add header to each page where table appears
                            if (data.pageNumber > 1) {
                                addPageHeader(data.pageNumber, contentDoc.internal.getNumberOfPages());
                            }
                        },
                        didAddPage: function (data) {
                            // Ensure new page starts below header
                            data.settings.margin.top = headerHeight + 5;
                        }
                    });
                    
                    yPosition = contentDoc.lastAutoTable.finalY + 10;
                } else if (q.type === 'radio') {
                    const selectedValue = sectionData[q.field];
                    renderSelectedRadioOption(contentDoc, selectedValue, q.options, margin);
                    
                    // Handle follow-up questions
                    if (q.followUp && selectedValue === q.followUp.condition) {
                        yPosition += 2;
                        if (q.followUp.fields) {
                            q.followUp.fields.forEach(field => {
                                const value = sectionData[field.field];
                                addWrappedText(`${field.label}: ${value || 'Not provided'}`, margin);
                            });
                        } else if (q.followUp.field && q.followUp.label) {
                            const followUpValue = sectionData[q.followUp.field];
                            addWrappedText(`${q.followUp.label}: ${followUpValue || 'Not provided'}`, margin);
                        }
                        if (q.followUp.subQuestion) {
                            addWrappedText(q.followUp.subQuestion, margin);
                            const subValue = sectionData[q.followUp.field];
                            renderSelectedRadioOption(contentDoc, subValue, q.followUp.options, margin);
                            if (subValue === 'third_party' && q.followUp.thirdPartyFields) {
                                q.followUp.thirdPartyFields.forEach(field => {
                                    const value = sectionData[field.field];
                                    addWrappedText(`${field.label}: ${value || 'Not provided'}`, margin);
                                });
                            }
                        }
                    }
                } else if (q.type === 'client_table') {
                    // Create AutoTable for top 3 clients
                    checkPageBreak(25);
                    
                    const tableData = [];
                    for (let i = 1; i <= 3; i++) {
                        const client = q.fields[i-1];
                        const name = sectionData[client.name] || 'Not provided';
                        const service = sectionData[client.service] || 'Not provided';
                        const duration = sectionData[client.duration] || 'Not provided';
                        const value = sectionData[client.value] || '0';
                        
                        tableData.push([
                            i.toString(),
                            name.length > 25 ? name.substring(0, 22) + '...' : name,
                            service.length > 25 ? service.substring(0, 22) + '...' : service,
                            duration,
                            '$' + value
                        ]);
                    }
                    
                    contentDoc.autoTable({
                        head: [['#', 'Client Name', 'Service Provided', 'Duration', 'Value ($)']],
                        body: tableData,
                        startY: yPosition + 5,
                        margin: { left: margin, top: headerHeight + 5 }, // Account for header space
                        styles: {
                            fontSize: 9,
                            cellPadding: 3
                        },
                        headStyles: {
                            fillColor: brandBlue, // #0050F0 color
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        columnStyles: {
                            0: { cellWidth: 15, halign: 'center' },
                            1: { cellWidth: 40 },
                            2: { cellWidth: 40 },
                            3: { cellWidth: 25 },
                            4: { cellWidth: 25, halign: 'right' }
                        },
                        didDrawPage: function (data) {
                            // Add header to each page where table appears
                            if (data.pageNumber > 1) {
                                addPageHeader(data.pageNumber, contentDoc.internal.getNumberOfPages());
                            }
                        },
                        didAddPage: function (data) {
                            // Ensure new page starts below header
                            data.settings.margin.top = headerHeight + 5;
                        }
                    });
                    
                    yPosition = contentDoc.lastAutoTable.finalY + 10;
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 4 with questions and selected options
        function addSection4WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('4. Financials', margin);
            
            // Define all Section 4 questions with their field names  
            const section4Questions = [
                {
                    question: '1. Date of financial year end',
                    field: 'financial_year_end',
                    type: 'date'
                },
                {
                    question: '2. Provide gross revenues for:',
                    type: 'revenue_table',
                    periods: [
                        {
                            label: 'Last completed fiscal year end',
                            domestic: 'revenue_last_domestic',
                            usa: 'revenue_last_usa',
                            foreign: 'revenue_last_foreign'
                        },
                        {
                            label: 'Estimate for current fiscal year end',
                            domestic: 'revenue_current_domestic',
                            usa: 'revenue_current_usa',
                            foreign: 'revenue_current_foreign'
                        },
                        {
                            label: 'Estimate for next completed fiscal year end',
                            domestic: 'revenue_next_domestic',
                            usa: 'revenue_next_usa',
                            foreign: 'revenue_next_foreign'
                        }
                    ]
                },
                {
                    question: '3. Percentage of sales business to business',
                    field: 'sales_b2b_percentage',
                    type: 'percentage'
                },
                {
                    question: '4. Percentage of sales business to consumer',
                    field: 'sales_b2c_percentage',
                    type: 'percentage'
                },
                {
                    question: '5. Average contract value',
                    field: 'average_contract_value',
                    type: 'currency'
                },
                {
                    question: '6. Do any single clients represent more than 5% of your total annual revenue?',
                    field: 'single_client_5_percent',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'client_5_percent_description',
                        label: 'Details'
                    }
                },
                {
                    question: '7. List your largest 3 Projects or Contracts in the past 2 years',
                    type: 'project_table',
                    fields: [
                        { name: 'project_1_name', client: 'project_1_client', value: 'project_1_value', duration: 'project_1_duration' },
                        { name: 'project_2_name', client: 'project_2_client', value: 'project_2_value', duration: 'project_2_duration' },
                        { name: 'project_3_name', client: 'project_3_client', value: 'project_3_value', duration: 'project_3_duration' }
                    ]
                },
                {
                    question: '8. Total payroll',
                    field: 'total_payroll',
                    type: 'currency'
                }
            ];
            
            section4Questions.forEach(q => {
                checkPageBreak(15);
                contentDoc.setFontSize(12);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 2;
                
                contentDoc.setFontSize(10);
                contentDoc.setFont(undefined, 'normal');
                
                if (q.type === 'text' || q.type === 'textarea' || q.type === 'number' || q.type === 'date') {
                    const value = sectionData[q.field];
                    addWrappedText(`Answer: ${value || 'Not provided'}`, margin);
                } else if (q.type === 'percentage') {
                    const value = sectionData[q.field];
                    addWrappedText(`Answer: ${value || '0'}%`, margin);
                } else if (q.type === 'currency') {
                    const value = sectionData[q.field];
                    addWrappedText(`Answer: $${value || '0'}`, margin);
                } else if (q.type === 'revenue_table') {
                    // Create AutoTable for gross revenues
                    checkPageBreak(30);
                    
                    const tableData = q.periods.map(period => {
                        const domestic = sectionData[period.domestic] || '0';
                        const usa = sectionData[period.usa] || '0';
                        const foreign = sectionData[period.foreign] || '0';
                        
                        return [
                            period.label,
                            '$' + domestic,
                            '$' + usa,
                            '$' + foreign
                        ];
                    });
                    
                    contentDoc.autoTable({
                        head: [['Period', 'Canada ($)', 'USA ($)', 'Foreign ($)']],
                        body: tableData,
                        startY: yPosition + 5,
                        margin: { left: margin, top: headerHeight + 5 }, // Account for header space
                        styles: {
                            fontSize: 9,
                            cellPadding: 3
                        },
                        headStyles: {
                            fillColor: brandBlue, // #0050F0 color
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        columnStyles: {
                            0: { cellWidth: 60 },
                            1: { cellWidth: 30, halign: 'right' },
                            2: { cellWidth: 30, halign: 'right' },
                            3: { cellWidth: 30, halign: 'right' }
                        },
                        didDrawPage: function (data) {
                            // Add header to each page where table appears
                            if (data.pageNumber > 1) {
                                addPageHeader(data.pageNumber, contentDoc.internal.getNumberOfPages());
                            }
                        },
                        didAddPage: function (data) {
                            // Ensure new page starts below header
                            data.settings.margin.top = headerHeight + 5;
                        }
                    });
                    
                    yPosition = contentDoc.lastAutoTable.finalY + 10;
                } else if (q.type === 'radio') {
                    const selectedValue = sectionData[q.field];                                
                    renderSelectedRadioOption(contentDoc, selectedValue, q.options, margin);
                    
                    // Handle follow-up questions
                    if (q.followUp && selectedValue === q.followUp.condition) {
                        yPosition += 2;
                        const followUpValue = sectionData[q.followUp.field];
                        addWrappedText(`${q.followUp.label}: ${followUpValue || 'Not provided'}`, margin);
                    }
                } else if (q.type === 'project_table') {
                    // Create AutoTable for largest projects
                    checkPageBreak(25);
                    
                    const tableData = [];
                    for (let i = 1; i <= 3; i++) {
                        const project = q.fields[i-1];
                        const name = sectionData[project.name] || 'Not provided';
                        const client = sectionData[project.client] || 'Not provided';
                        const value = sectionData[project.value] || '0';
                        const duration = sectionData[project.duration] || 'Not provided';
                        
                        tableData.push([
                            i.toString(),
                            name.length > 30 ? name.substring(0, 27) + '...' : name,
                            client.length > 25 ? client.substring(0, 22) + '...' : client,
                            '$' + value,
                            duration
                        ]);
                    }
                    
                    contentDoc.autoTable({
                        head: [['#', 'Project/Contract Name', 'Client', 'Value ($)', 'Duration']],
                        body: tableData,
                        startY: yPosition + 5,
                        margin: { left: margin, top: headerHeight + 5 }, // Account for header space
                        styles: {
                            fontSize: 9,
                            cellPadding: 3
                        },
                        headStyles: {
                            fillColor: brandBlue, // #0050F0 color
                            textColor: 255,
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        columnStyles: {
                            0: { cellWidth: 15, halign: 'center' },
                            1: { cellWidth: 45 },
                            2: { cellWidth: 35 },
                            3: { cellWidth: 25, halign: 'right' },
                            4: { cellWidth: 25 }
                        },
                        didDrawPage: function (data) {
                            // Add header to each page where table appears
                            if (data.pageNumber > 1) {
                                addPageHeader(data.pageNumber, contentDoc.internal.getNumberOfPages());
                            }
                        },
                        didAddPage: function (data) {
                            // Ensure new page starts below header
                            data.settings.margin.top = headerHeight + 5;
                        }
                    });
                    
                    yPosition = contentDoc.lastAutoTable.finalY + 10;
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 5 with questions and selected options
        function addSection5WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('5. Contractual Controls', margin);
            
            // Define all Section 5 questions with their field names  
            const section5Questions = [
                {
                    question: '1. Do you require all employees to sign a confidentiality agreement?',
                    field: 'employee_confidentiality',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '2. Are employees required to agree not to solicit customers when they leave your organization?',
                    field: 'employee_non_solicitation',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '3. Do you require third parties with whom you exchange confidential information to sign a confidentiality agreement?',
                    field: 'third_party_confidentiality',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '4. Do you require third parties that process personal information on your behalf to sign a data processing agreement?',
                    field: 'data_processing_agreement',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '5. Do you review third party contracts to ensure they include appropriate security standards for your relationship?',
                    field: 'contract_security_review',
                    type: 'textarea'
                },
                {
                    question: '6. Do you require cyber insurance or security standards in contracts with key partners or suppliers?',
                    field: 'partner_security_requirements',
                    type: 'textarea'
                }
            ];
            
            section5Questions.forEach(q => {
                checkPageBreak(15);
                contentDoc.setFontSize(12);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 2;
                
                contentDoc.setFontSize(10);
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData[q.field];
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 6 with questions and selected options
        function addSection6WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('6. Cybersecurity, Technical & Crime Controls', margin);
            
            // Define all Section 6 questions with their field names  
            const section6Questions = [
                {
                    question: '1. Who is responsible for overseeing cybersecurity on a day-to-day basis?',
                    field: 'cybersecurity_responsibility',
                    type: 'radio',
                    options: [
                        { value: 'No one is formally responsible for cybersecurity.', label: 'No one is formally responsible for cybersecurity.' },
                        { value: 'Cybersecurity responsibilities are informally assigned, usually handled part-time by IT, operations, or a designated staff member.', label: 'Cybersecurity responsibilities are informally assigned, usually handled part-time by IT, operations, or a designated staff member.' },
                        { value: 'A full-time staff member or external provider is responsible, with defined oversight.', label: 'A full-time staff member or external provider is responsible, with defined oversight.' },
                        { value: 'A qualified internal or external CISO manages cybersecurity with clear authority, reporting, and board-level oversight.', label: 'A qualified internal or external CISO manages cybersecurity with clear authority, reporting, and board-level oversight.' }
                    ]
                },
                {
                    question: '2. Is there a formal cybersecurity policy in place for employees to follow?',
                    field: 'cybersecurity_policy',
                    type: 'radio',
                    options: [
                        { value: 'No cybersecurity policy exists.', label: 'No cybersecurity policy exists.' },
                        { value: 'A policy exists and is shared with employees during onboarding but it may be outdated or not consistently distributed to all staff beyond initial hiring.', label: 'A policy exists and is shared with employees during onboarding but it may be outdated or not consistently distributed to all staff beyond initial hiring.' },
                        { value: 'The policy is current, distributed to all employees, and acknowledged in writing.', label: 'The policy is current, distributed to all employees, and acknowledged in writing.' },
                        { value: 'A comprehensive, regularly updated policy is enforced and supported with training and accountability mechanisms.', label: 'A comprehensive, regularly updated policy is enforced and supported with training and accountability mechanisms.' }
                    ]
                },
                {
                    question: '3. Do all team members receive regular training to help them recognize cyber threats and scams?',
                    field: 'cyber_training',
                    type: 'radio',
                    options: [
                        { value: 'No cybersecurity training is provided.', label: 'No cybersecurity training is provided.' },
                        { value: 'Most employees receive annual training, but it may be informal, one-time, or not consistently tracked.', label: 'Most employees receive annual training, but it may be informal, one-time, or not consistently tracked.' },
                        { value: 'All employees receive mandatory cybersecurity training annually.', label: 'All employees receive mandatory cybersecurity training annually.' },
                        { value: 'Training is ongoing, tailored by role, and includes phishing simulations and tracking of completion and performance.', label: 'Training is ongoing, tailored by role, and includes phishing simulations and tracking of completion and performance.' }
                    ]
                },
                {
                    question: '4. Is multi-factor authentication (MFA) required for accessing company systems, email, and cloud tools remotely?',
                    field: 'mfa_requirement',
                    type: 'radio',
                    options: [
                        { value: 'MFA is not used.', label: 'MFA is not used.' },
                        { value: 'MFA is required for remote access to critical systems and used for some other users or systems, but overall implementation is inconsistent.', label: 'MFA is required for remote access to critical systems and used for some other users or systems, but overall implementation is inconsistent.' },
                        { value: 'MFA is enforced for all users across remote and cloud environments.', label: 'MFA is enforced for all users across remote and cloud environments.' },
                        { value: 'MFA is universally enforced, regularly tested, and monitored for compliance and anomalies.', label: 'MFA is universally enforced, regularly tested, and monitored for compliance and anomalies.' }
                    ]
                },
                {
                    question: '5. Is remote access to your internal or cloud systems restricted to secure methods like VPN or SSO and protected with MFA?',
                    field: 'remote_access_security',
                    type: 'radio',
                    options: [
                        { value: 'Remote access is open or unmanaged.', label: 'Remote access is open or unmanaged.' },
                        { value: 'Remote access typically relies on passwords and may use VPN or SSO, but secure controls like MFA are not consistently applied.', label: 'Remote access typically relies on passwords and may use VPN or SSO, but secure controls like MFA are not consistently applied.' },
                        { value: 'Secure access (VPN or SSO) with MFA is required for all remote users.', label: 'Secure access (VPN or SSO) with MFA is required for all remote users.' },
                        { value: 'Remote access is tightly controlled with policy enforcement, MFA, and centralized access logging.', label: 'Remote access is tightly controlled with policy enforcement, MFA, and centralized access logging.' }
                    ]
                },
                {
                    question: '6. What tools or protections secure employee devices and email from cyber threats?',
                    field: 'device_protection',
                    type: 'radio',
                    options: [
                        { value: 'Devices and email are not protected by security tools.', label: 'Devices and email are not protected by security tools.' },
                        { value: 'Basic antivirus, standard endpoint protection, and email filtering are in place.', label: 'Basic antivirus, standard endpoint protection, and email filtering are in place.' },
                        { value: 'Devices are protected by centrally managed EDR, and email systems have advanced filtering and threat detection.', label: 'Devices are protected by centrally managed EDR, and email systems have advanced filtering and threat detection.' },
                        { value: 'A layered security stack is deployed across all devices and email accounts, including EDR, DLP, and sandboxing.', label: 'A layered security stack is deployed across all devices and email accounts, including EDR, DLP, and sandboxing.' }
                    ]
                },
                {
                    question: '7. How is user access managed, including setting, adjusting, and promptly removing access?',
                    field: 'user_access_management',
                    type: 'radio',
                    options: [
                        { value: 'Access is granted manually and rarely updated.', label: 'Access is granted manually and rarely updated.' },
                        { value: 'Access rights are adjusted as needed and reviewed occasionally, with revocation upon termination, though delays may occur.', label: 'Access rights are adjusted as needed and reviewed occasionally, with revocation upon termination, though delays may occur.' },
                        { value: 'Role-based access controls are in place with regular access reviews.', label: 'Role-based access controls are in place with regular access reviews.' },
                        { value: 'Access is centrally managed, provisioned by role, reviewed quarterly, and automatically revoked upon role change or termination.', label: 'Access is centrally managed, provisioned by role, reviewed quarterly, and automatically revoked upon role change or termination.' }
                    ]
                },
                {
                    question: '8. Do you collect and review activity logs across your IT environment?',
                    field: 'activity_logs',
                    type: 'radio',
                    options: [
                        { value: 'No activity logs are collected or retained.', label: 'No activity logs are collected or retained.' },
                        { value: 'Logs are collected from key systems but are not actively monitored, and reviews are performed reactively.', label: 'Logs are collected from key systems but are not actively monitored, and reviews are performed reactively.' },
                        { value: 'Centralized log management is in place with routine review and alerting.', label: 'Centralized log management is in place with routine review and alerting.' },
                        { value: 'Logs are collected, analyzed with SIEM tools, and reviewed proactively with incident response integration.', label: 'Logs are collected, analyzed with SIEM tools, and reviewed proactively with incident response integration.' }
                    ]
                },
                {
                    question: '9. Do you use tools or services to identify cyber threats or unusual system activity in real time?',
                    field: 'threat_detection',
                    type: 'radio',
                    options: [
                        { value: 'No tools are used to monitor system activity or threats.', label: 'No tools are used to monitor system activity or threats.' },
                        { value: 'Basic alerts come from standard antivirus or firewall tools, with some real-time monitoring in place, though it is not centrally managed.', label: 'Basic alerts come from standard antivirus or firewall tools, with some real-time monitoring in place, though it is not centrally managed.' },
                        { value: 'Real-time threat detection tools are used and monitored by internal or external IT/security teams.', label: 'Real-time threat detection tools are used and monitored by internal or external IT/security teams.' },
                        { value: 'A fully integrated threat detection and response system (e.g., MDR, SIEM) monitors activity 24/7 with alerting and escalation.', label: 'A fully integrated threat detection and response system (e.g., MDR, SIEM) monitors activity 24/7 with alerting and escalation.' }
                    ]
                },
                {
                    question: '10. How does your organization manage aging technology and ensure software and systems stay updated and supported?',
                    field: 'technology_management',
                    type: 'radio',
                    options: [
                        { value: 'Software updates and patching are done irregularly or not at all.', label: 'Software updates and patching are done irregularly or not at all.' },
                        { value: 'Most systems are updated periodically, though some legacy systems remain unsupported, and updates often occur reactively without a set schedule.', label: 'Most systems are updated periodically, though some legacy systems remain unsupported, and updates often occur reactively without a set schedule.' },
                        { value: 'Key systems are tracked, security patches are regularly applied, and major upgrades are planned every few years, though some older systems remain in use if still functional.', label: 'Key systems are tracked, security patches are regularly applied, and major upgrades are planned every few years, though some older systems remain in use if still functional.' },
                        { value: 'Systems are proactively monitored for EOL/EOS, with automated patching and lifecycle management to maintain secure, supported software.', label: 'Systems are proactively monitored for EOL/EOS, with automated patching and lifecycle management to maintain secure, supported software.' }
                    ]
                },
                {
                    question: '11. Are firewalls in place to protect the network perimeter and to segment internal networks?',
                    field: 'firewall_protection',
                    type: 'textarea'
                },
                {
                    question: '12. Are internal/external vulnerability scans or penetration tests of your network performed?',
                    field: 'vulnerability_scans',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'vulnerability_frequency_methods',
                        label: 'If yes, frequency and methods:'
                    }
                },
                {
                    question: '13. Do you restrict user access/permissions to a need-to-know basis?',
                    field: 'user_access_restrictions',
                    type: 'textarea'
                },
                {
                    question: '14. Are unused/unneeded network services and ports disabled or closed promptly?',
                    field: 'unused_services',
                    type: 'textarea'
                },
                {
                    question: '15. Name your service provider for each function:',
                    field: 'service_providers',
                    type: 'composite',
                    subfields: [
                        { field: 'datacenter_provider', label: 'Data center/cloud hosting' },
                        { field: 'managed_security_provider', label: 'Managed security service' },
                        { field: 'security_monitoring_provider', label: 'Security event/alert monitoring' },
                        { field: 'managed_it_provider', label: 'Managed IT service provider' }
                    ]
                },
                {
                    question: '16. Do you have a formal procedure for departing employees that includes revoking access to systems and recovery of all company devices/credentials?',
                    field: 'departing_employee_procedure',
                    type: 'textarea'
                },
                {
                    question: '17. Do you require more than one person to approve high-risk financial transactions like wire transfers?',
                    field: 'dual_approval_financial',
                    type: 'radio',
                    options: [
                        { value: 'No approval process is required; a single individual can execute high-risk transactions.', label: 'No approval process is required; a single individual can execute high-risk transactions.' },
                        { value: 'Dual approval is expected for some transactions and occasionally required, but it is not consistently applied, enforced, or documented.', label: 'Dual approval is expected for some transactions and occasionally required, but it is not consistently applied, enforced, or documented.' },
                        { value: 'A dual-approval policy is enforced for all high-risk transactions (e.g., wire transfers, bank account changes), with audit trail documentation.', label: 'A dual-approval policy is enforced for all high-risk transactions (e.g., wire transfers, bank account changes), with audit trail documentation.' },
                        { value: 'Dual authorization is mandatory for all high-risk transactions, embedded in financial systems, with tiered thresholds, role-based permissions, fraud alerts, and periodic audits to verify compliance.', label: 'Dual authorization is mandatory for all high-risk transactions, embedded in financial systems, with tiered thresholds, role-based permissions, fraud alerts, and periodic audits to verify compliance.' }
                    ]
                },
                {
                    question: '18. What controls are in place to prevent and detect financial fraud, including scams targeting incoming and outgoing wire transfers or internal theft?',
                    field: 'financial_fraud_controls',
                    type: 'radio',
                    options: [
                        { value: ' No formal controls or monitoring systems are in place; the company relies on trust or informal checks.', label: 'No formal controls or monitoring systems are in place; the company relies on trust or informal checks.' },
                        { value: 'Basic safeguards exist, such as accounting software permissions and finance team reviews, with some vendor verification and fraud awareness efforts, but proactive measures against risks like phishing, business email compromise, or internal theft are limited, and monitoring is minimal.', label: 'Basic safeguards exist, such as accounting software permissions and finance team reviews, with some vendor verification and fraud awareness efforts, but proactive measures against risks like phishing, business email compromise, or internal theft are limited, and monitoring is minimal.' },
                        { value: 'Documented fraud prevention policies exist, with training, vendor validation, audit logs, and periodic financial audits or reconciliations.', label: 'Documented fraud prevention policies exist, with training, vendor validation, audit logs, and periodic financial audits or reconciliations.' },
                        { value: 'A formal fraud prevention framework is in place, including dual controls, transaction monitoring, fraud detection tools, employee training, whistleblower protections, and regular testing or audits of financial systems.', label: 'A formal fraud prevention framework is in place, including dual controls, transaction monitoring, fraud detection tools, employee training, whistleblower protections, and regular testing or audits of financial systems.' }
                    ]
                }
            ];
            
            section6Questions.forEach(q => {
                checkPageBreak(15);
                contentDoc.setFontSize(12);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 2;
                
                contentDoc.setFontSize(10);
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData[q.field];
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    
                    // Handle follow-up questions
                    if (q.followUp && fieldValue === q.followUp.condition) {
                        yPosition += 3;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        contentDoc.setFont(undefined, 'normal');
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Answer: ${followUpValue}`, margin);
                        }
                    }
                } else if (q.type === 'composite' && q.subfields) {
                    q.subfields.forEach(subfield => {
                        const subfieldValue = sectionData[subfield.field];
                        if (subfieldValue) {
                            addWrappedText(`${subfield.label}: ${subfieldValue}`, margin);
                        }
                    });
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 8 with questions and selected options
        function addSection8WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('8. Third Party, Vendor & Supply Chain Controls', margin);
            
            // Define all Section 8 questions with their field names  
            const section8Questions = [
                {
                    question: '1. What steps are taken when bringing on a new customer to assess potential risks to your business?',
                    field: 'customer_risk_assessment',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal risk assessment is conducted before onboarding new customers.' },
                        { value: '2', label: 'Vetting is mostly informal, relying on relationship history or perceived reputation, with some credit or legal checks performed, but these are not standardized.' },
                        { value: '3', label: 'The company uses a risk-based onboarding process including financial, operational, and legal reviews for high-risk customers.' },
                        { value: '4', label: 'A formal customer risk assessment framework is in place, including KYC, creditworthiness, contract risk, regulatory exposure, and service capacity evaluation.' }
                    ]
                },
                {
                    question: '2. Do you have a formal due diligence process to evaluate potential risks when onboarding new vendors or suppliers?',
                    field: 'vendor_due_diligence',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Vendors are onboarded informally with no checks or documentation.' },
                        { value: '2', label: 'Basic vetting is performed, such as checking references and requiring insurance certificates from vendors, but reviews of insurance and risk factors are inconsistent and formal risk assessments are rare.' },
                        { value: '3', label: 'Onboarding includes documented review of insurance, security, and financial risk, with sign-off by relevant departments.' },
                        { value: '4', label: 'A structured onboarding workflow is in place, including insurance verification, legal review, risk scoring, and approval gates for higher-risk vendors.' }
                    ]
                },
                {
                    question: '3. How does your organization assess and monitor the cybersecurity posture of third-party vendors, and what steps are taken if a vendor is found to pose elevated risk?',
                    field: 'vendor_cybersecurity_assessment',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'We don\'t currently assess vendor cybersecurity posture and rely on vendors to manage their own risks.' },
                        { value: '2', label: 'We conduct basic due diligence when onboarding vendors, such as reviewing security questionnaires, but we don\'t monitor risk on an ongoing basis.' },
                        { value: '3', label: 'We assess vendor cyber risk at onboarding and periodically review key vendors\' security posture. If a vendor is found to pose elevated risk, we may request remediation or consider contract changes.' },
                        { value: '4', label: 'We use continuous monitoring tools (e.g., third-party risk scoring or threat intelligence platforms) to track vendor cybersecurity posture in real time. High-risk vendors trigger formal escalation protocols, including audits, contractual enforcement, or offboarding if necessary.' }
                    ]
                },
                {
                    question: '4. Do you have redundant systems or alternate suppliers in place to minimize disruption if a critical third party fails or is unavailable?',
                    field: 'redundant_systems',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'We rely on single providers for critical services and would face major disruption if one failed.' },
                        { value: '2', label: 'We are aware of possible alternates but have no formal agreements or automated systems. Switching would be manual and could be delayed.' },
                        { value: '3', label: 'We have identified and maintain relationships with alternate suppliers, or have partial redundant systems for critical functions. However, these are not fully integrated or routinely tested, so some disruption could still occur.' },
                        { value: '4', label: 'We have fully redundant systems and formal agreements with alternative suppliers, along with tested failover processes, to ensure minimal disruption in the event of a critical third-party failure. These contingencies are regularly reviewed and tested as part of our business continuity program.' }
                    ]
                },
                {
                    question: '5. Do your vendors agree to take responsibility if they mishandle personal or confidential information?',
                    field: 'vendor_liability',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'There are no contract terms addressing vendor responsibility for data mishandling.' },
                        { value: '2', label: 'Many vendor contracts include general confidentiality or data protection clauses, but the enforceability, scope, and presence of liability terms vary.' },
                        { value: '3', label: 'Vendor agreements include specific data handling obligations, breach notification requirements, and indemnity clauses.' },
                        { value: '4', label: 'All vendor agreements involving sensitive data include legally vetted, standardized language on liability, data safeguards, breach response, and indemnification for damages.' }
                    ]
                },
                {
                    question: '6. Do your critical vendors provide proof of strong security practices (like SOC 2 or ISO 27001), and how often is that reviewed?',
                    field: 'vendor_security_certifications',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Vendors do not provide security certifications or attestations.' },
                        { value: '2', label: 'Some vendors provide security documentation, but its presence and quality are inconsistent, and reviews are infrequent.' },
                        { value: '3', label: 'Critical vendors are required to provide security certifications (e.g., SOC 2, ISO 27001), and these are reviewed annually.' },
                        { value: '4', label: 'All critical vendors must maintain current security certifications, which are reviewed regularly and integrated into vendor risk management processes.' }
                    ]
                },
                {
                    question: '7. Do you require vendors to notify you if they experience a security breach or incident?',
                    field: 'vendor_breach_notification',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Vendors are not required to notify us of security incidents.' },
                        { value: '2', label: 'Some contracts include breach notification language, but timelines and requirements are inconsistent.' },
                        { value: '3', label: 'Vendor contracts require prompt notification of security incidents, with defined timelines and information requirements.' },
                        { value: '4', label: 'Comprehensive breach notification requirements are in place, including specific timelines, escalation procedures, and impact assessment protocols.' }
                    ]
                },
                {
                    question: '8. How do you track and manage the risks associated with your supply chain?',
                    field: 'supply_chain_risk_management',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Supply chain risks are not formally tracked or managed.' },
                        { value: '2', label: 'Basic supplier information is maintained, but risk assessment is limited to financial or operational concerns.' },
                        { value: '3', label: 'A supply chain risk register is maintained, with periodic review of key suppliers and risk mitigation strategies.' },
                        { value: '4', label: 'Comprehensive supply chain risk management includes continuous monitoring, risk scoring, scenario planning, and integration with enterprise risk management.' }
                    ]
                },
                {
                    question: '9. Do you conduct regular audits or assessments of your most critical third-party relationships?',
                    field: 'third_party_audits',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No regular audits or assessments are conducted.' },
                        { value: '2', label: 'Informal reviews of vendor performance occur occasionally, but there are no structured audits.' },
                        { value: '3', label: 'Periodic assessments are conducted for critical vendors, including performance and compliance reviews.' },
                        { value: '4', label: 'Systematic audits and assessments are performed on a regular schedule, with standardized criteria and documented findings.' }
                    ]
                }
            ];
            
            // Process each question
            section8Questions.forEach(q => {
                checkPageBreak(30);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 9 with questions and selected options
        function addSection9WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('9. Privacy, Data Security & API Controls', margin);
            
            // Define all Section 9 questions with their field names  
            const section9Questions = [
                {
                    question: '1. Do you collect, store, or process customer data?',
                    field: 'collect_customer_data',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        fields: [
                            { field: 'contact_info_records', label: 'Contact information records' },
                            { field: 'personal_health_data_records', label: 'Personal health data records' },
                            { field: 'payment_card_data_records', label: 'Payment card data records' },
                            { field: 'financial_records_records', label: 'Financial records' },
                            { field: 'government_id_numbers_records', label: 'Government ID numbers records' },
                            { field: 'biometric_data_records', label: 'Biometric data records' }
                        ]
                    }
                },
                {
                    question: '2. Do you have formal policies governing the collection, use, storage, and disposal of personal or sensitive data?',
                    field: 'data_governance_policies',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal policies exist for data governance.' },
                        { value: '2', label: 'Basic policies are in place but may be incomplete or not regularly updated.' },
                        { value: '3', label: 'Comprehensive data governance policies exist and are regularly reviewed and updated.' },
                        { value: '4', label: 'Mature data governance framework with detailed policies, procedures, and regular compliance monitoring.' }
                    ]
                },
                {
                    question: '3. Do you provide privacy notices to individuals whose data you collect, and do you obtain appropriate consent?',
                    field: 'privacy_notices_consent',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No privacy notices are provided, and consent is not obtained.' },
                        { value: '2', label: 'Basic privacy notices are provided in some cases, but consent processes are inconsistent.' },
                        { value: '3', label: 'Clear privacy notices are provided, and appropriate consent is obtained for data collection and use.' },
                        { value: '4', label: 'Comprehensive privacy program with detailed notices, granular consent mechanisms, and regular compliance reviews.' }
                    ]
                },
                {
                    question: '4. Do you have processes in place to respond to individual requests regarding their personal data (access, correction, deletion)?',
                    field: 'data_subject_requests',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal process exists for handling individual data requests.' },
                        { value: '2', label: 'Basic processes exist but may not cover all types of requests or have clear timelines.' },
                        { value: '3', label: 'Formal processes are in place to handle data subject requests within required timeframes.' },
                        { value: '4', label: 'Comprehensive data subject rights program with automated workflows and tracking systems.' }
                    ]
                },
                {
                    question: '5. How is sensitive data encrypted, both at rest and in transit?',
                    field: 'data_encryption',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Sensitive data is not systematically encrypted.' },
                        { value: '2', label: 'Some encryption is used, but coverage is inconsistent or uses outdated methods.' },
                        { value: '3', label: 'Strong encryption is used for sensitive data both at rest and in transit.' },
                        { value: '4', label: 'Enterprise-grade encryption with key management, regular rotation, and compliance monitoring.' }
                    ]
                },
                {
                    question: '6. Do you conduct regular privacy impact assessments when implementing new systems or processes?',
                    field: 'privacy_impact_assessments',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Privacy impact assessments are not conducted.' },
                        { value: '2', label: 'PIAs are conducted occasionally for major projects but not systematically.' },
                        { value: '3', label: 'PIAs are required for new systems and processes that handle personal data.' },
                        { value: '4', label: 'Comprehensive privacy-by-design approach with mandatory PIAs and ongoing privacy monitoring.' }
                    ]
                },
                {
                    question: '7. How do you ensure third-party service providers protect personal data according to your standards?',
                    field: 'third_party_data_protection',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No specific requirements for third-party data protection.' },
                        { value: '2', label: 'Basic contractual requirements, but monitoring and enforcement are limited.' },
                        { value: '3', label: 'Comprehensive data protection agreements with regular monitoring and compliance checks.' },
                        { value: '4', label: 'Rigorous third-party data protection program with due diligence, ongoing monitoring, and audit rights.' }
                    ]
                },
                {
                    question: '8. Do you have an incident response plan specifically for privacy breaches?',
                    field: 'privacy_breach_response',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No specific privacy breach response plan exists.' },
                        { value: '2', label: 'Basic incident response procedures that may cover privacy breaches.' },
                        { value: '3', label: 'Dedicated privacy breach response plan with notification procedures.' },
                        { value: '4', label: 'Comprehensive privacy incident response with automated workflows, stakeholder communication, and regulatory compliance.' }
                    ]
                },
                {
                    question: '9. How do you manage data retention and ensure secure disposal of personal data?',
                    field: 'data_retention_disposal',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal data retention or disposal policies exist.' },
                        { value: '2', label: 'Basic retention guidelines but disposal processes are inconsistent.' },
                        { value: '3', label: 'Formal data retention schedule with secure disposal procedures.' },
                        { value: '4', label: 'Comprehensive data lifecycle management with automated retention and certified secure disposal.' }
                    ]
                },
                {
                    question: '10. Do you provide regular privacy and data protection training to employees?',
                    field: 'privacy_training',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal privacy training is provided to employees.' },
                        { value: '2', label: 'Basic privacy awareness included in general security training.' },
                        { value: '3', label: 'Regular privacy training provided to all employees handling personal data.' },
                        { value: '4', label: 'Comprehensive privacy training program with role-specific modules and regular updates.' }
                    ]
                },
                {
                    question: '11. How do you monitor and audit compliance with privacy regulations and internal data protection policies?',
                    field: 'privacy_compliance_monitoring',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal monitoring or auditing of privacy compliance.' },
                        { value: '2', label: 'Occasional reviews of privacy practices and compliance.' },
                        { value: '3', label: 'Regular internal audits and compliance monitoring for privacy requirements.' },
                        { value: '4', label: 'Continuous compliance monitoring with automated tools, regular audits, and corrective action tracking.' }
                    ]
                }
            ];
            
            // Process each question
            section9Questions.forEach(q => {
                checkPageBreak(30);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    
                    // Handle follow-up fields for data collection question
                    if (q.followUp && fieldValue === q.followUp.condition && sectionData) {
                        yPosition += 5;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText('Data Types and Record Counts:', margin);
                        yPosition += 3;
                        contentDoc.setFont(undefined, 'normal');
                        
                        q.followUp.fields.forEach(field => {
                            const recordCount = sectionData[field.field];
                            if (recordCount) {
                                addWrappedText(`${field.label}: ${recordCount} records`, margin);
                            }
                        });
                    }
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 10 with questions and selected options
        function addSection10WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('10. Intellectual Property & Content Governance Controls', margin);
            
            // Define all Section 10 questions with their field names  
            const section10Questions = [
                {
                    question: '1. Do your contracts with customers, partners, or distributors include indemnification provisions that make you responsible for IP infringement claims?',
                    field: 'ip_indemnification_provisions',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'We haven\'t reviewed our contracts for IP indemnity exposure and are unsure whether such provisions exist.' },
                        { value: '2', label: 'Some contracts include IP indemnities, but we accept them as-is without negotiation or risk transfer strategies.' },
                        { value: '3', label: 'We review IP indemnity provisions case-by-case and seek to limit or share liability where possible, often with legal input.' },
                        { value: '4', label: 'We have a formal process for reviewing and negotiating IP indemnities, consistently limit our exposure through contract language, and align coverage with our insurance program to ensure claims are insurable.' }
                    ]
                },
                {
                    question: '2. What is your plan if your company is accused of infringing someone else\'s IP?',
                    field: 'ip_infringement_plan',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No plan or insurance is in place to address IP disputes.' },
                        { value: '2', label: 'Leadership relies on legal counsel and a general dispute response approach, but there is no documented or detailed plan specific to IP disputes.' },
                        { value: '3', label: 'A formal incident response process is in place, including legal review and insurance support.' },
                        { value: '4', label: 'The company has a documented IP risk response plan, legal counsel on standby, indemnification strategies, and intellectual property insurance.' }
                    ]
                },
                {
                    question: '3. How do you monitor and manage the use of third-party software licenses?',
                    field: 'third_party_license_monitoring',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Software is used without tracking licenses or usage rights.' },
                        { value: '2', label: 'Teams manage licensing informally with a partial inventory and some tools to track third-party software, but tracking is incomplete and decentralized.' },
                        { value: '3', label: 'License use is tracked and reviewed regularly, with controls to prevent unauthorized or expired use.' },
                        { value: '4', label: 'Comprehensive license management includes automated tracking, compliance monitoring, and regular audits by legal or procurement teams.' }
                    ]
                },
                {
                    question: '4. Do you have processes in place to ensure that your products or services don\'t infringe on existing patents, trademarks, or copyrights?',
                    field: 'ip_infringement_prevention',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal processes are in place to check for potential IP infringement.' },
                        { value: '2', label: 'Basic IP searches are conducted informally during product development, but there are no standard procedures or documentation.' },
                        { value: '3', label: 'Regular IP clearance procedures are followed, including patent and trademark searches before product launches.' },
                        { value: '4', label: 'Comprehensive IP due diligence is conducted throughout the product development lifecycle, with legal review and documented clearance processes.' }
                    ]
                },
                {
                    question: '5. How do you protect your own intellectual property (patents, trademarks, trade secrets)?',
                    field: 'own_ip_protection',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal IP protection strategy is in place.' },
                        { value: '2', label: 'Some IP assets are protected (e.g., trademarks registered), but protection is inconsistent and reactive.' },
                        { value: '3', label: 'Active IP protection program including trademark and patent filings, trade secret policies, and employee agreements.' },
                        { value: '4', label: 'Comprehensive IP strategy with portfolio management, regular IP audits, enforcement procedures, and strategic filing programs.' }
                    ]
                },
                {
                    question: '6. Do you have content moderation or review processes for user-generated content on your platforms?',
                    field: 'content_moderation',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No content moderation processes are in place.' },
                        { value: '2', label: 'Basic content moderation through automated filtering or reactive reporting, but coverage is limited.' },
                        { value: '3', label: 'Regular content moderation combining automated tools and human review for policy violations.' },
                        { value: '4', label: 'Comprehensive content governance with proactive monitoring, clear policies, appeals processes, and regular policy updates.' }
                    ]
                },
                {
                    question: '7. How do you handle DMCA takedown requests or other IP-related complaints?',
                    field: 'dmca_takedown_process',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal process exists for handling IP complaints or takedown requests.' },
                        { value: '2', label: 'Basic procedures for responding to takedown requests, but processes may be inconsistent.' },
                        { value: '3', label: 'Established DMCA and IP complaint procedures with designated personnel and response timelines.' },
                        { value: '4', label: 'Comprehensive IP complaint management system with automated workflows, legal review, and compliance tracking.' }
                    ]
                },
                {
                    question: '8. Do you have policies governing employee creation and ownership of IP during their employment?',
                    field: 'employee_ip_policies',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal policies exist regarding employee IP creation or ownership.' },
                        { value: '2', label: 'Basic employment agreements include some IP assignment clauses, but policies are not comprehensive.' },
                        { value: '3', label: 'Clear IP policies and assignment agreements are in place for all employees involved in creative or technical work.' },
                        { value: '4', label: 'Comprehensive IP employment policies with invention disclosure processes, compensation frameworks, and regular training.' }
                    ]
                }
            ];
            
            // Process each question
            section10Questions.forEach(q => {
                checkPageBreak(30);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 7 with questions and selected options
        function addSection7WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('7. Data Backup & Business Continuity & Supply Chain Controls', margin);
            
            // Define all Section 7 questions with their field names  
            const section7Questions = [
                {
                    question: '1. What processes are in place to quickly detect and respond to data breaches or unauthorized access?',
                    field: 'breach_detection_response',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal detection or response process exists.' },
                        { value: '2', label: 'Incidents are handled reactively when staff notice something suspicious, supported by basic detection tools like antivirus and system logs, but incident response is largely ad hoc.' },
                        { value: '3', label: 'A defined incident response plan exists, with detection tools, trained responders, and escalation protocols.' },
                        { value: '4', label: 'A comprehensive incident response program includes 24/7 monitoring, real-time alerting, runbooks, tabletop testing, and post-incident review.' }
                    ]
                },
                {
                    question: '2. Do you have a communications plan to protect your company\'s reputation in the event of a major issue or breach?',
                    field: 'communications_plan',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No communications plan exists for handling incidents.' },
                        { value: '2', label: 'Incident responses are generally handled by PR or leadership, supported by a basic communications plan with draft statements and designated spokespersons, but there is no formal protocol.' },
                        { value: '3', label: 'A formal reputational risk communications plan is documented, with media, legal, and customer messaging protocols.' },
                        { value: '4', label: 'The company maintains a comprehensive communications playbook for crisis events, including breach notification, regulatory guidance, and stakeholder outreach, tested regularly through simulations.' }
                    ]
                },
                {
                    question: '3. Do you have backup systems to recover data after a cyber incident or outage?',
                    field: 'backup_systems',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No backup systems exist.' },
                        { value: '2', label: 'Regular backups are taken and stored offsite or in the cloud, but not all data is covered, testing is limited, and updates may not be consistent.' },
                        { value: '3', label: 'Backups are automated, encrypted, and tested periodically for critical systems.' },
                        { value: '4', label: 'An enterprise-grade backup and recovery system is in place with real-time replication, frequent testing, and integration into the overall incident response strategy.' }
                    ]
                },
                {
                    question: '4. If systems go down, how quickly can you get your critical data and operations back online?',
                    field: 'recovery_time',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'There is no defined recovery timeframe; recovery would be improvised.' },
                        { value: '2', label: 'A target recovery window is defined for key systems (e.g., 48–72 hours), but for other areas recovery could take several days, and there are no documented targets.' },
                        { value: '3', label: 'Recovery goals (RTOs) are set by system tier, with most critical services recoverable within 24 hours.' },
                        { value: '4', label: 'Rapid recovery (RTO < 4 hours for critical systems) is enabled via automated failover, and performance against RTOs is tested and validated.' }
                    ]
                },
                {
                    question: '5. Do you maintain business continuity and disaster recovery plans, and what are your key recovery goals?',
                    field: 'continuity_recovery_plans',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal plans exist.' },
                        { value: '2', label: 'Recovery plans exist with defined Recovery Time Objectives and Recovery Point Objectives and some written procedures, but they are not thoroughly tested or fully aligned to recovery goals.' },
                        { value: '3', label: 'BCP and DRP are documented, with role assignments, key systems prioritized, and regular stakeholder reviews.' },
                        { value: '4', label: 'Continuity and disaster recovery plans are fully developed, tested regularly, and aligned to business impact analyses with clearly defined and measured RTOs/RPOs.' }
                    ]
                },
                {
                    question: '6. How often are recovery plans tested, and what improvements have resulted?',
                    field: 'recovery_testing',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Recovery plans are never tested.' },
                        { value: '2', label: 'Recovery plans are reviewed occasionally and tested annually, with some lessons learned incorporated, but exercises are not frequent or comprehensive.' },
                        { value: '3', label: 'Tests are conducted at least twice per year, with results documented and improvements tracked.' },
                        { value: '4', label: 'Plans are tested regularly using realistic scenarios (e.g., tabletop and live failover), with continuous improvement cycles and executive oversight.' }
                    ]
                },
                {
                    question: '7. Do you rely on third parties for critical business operations (Cloud providers, managed IT, payment processors, API data)?',
                    field: 'third_party_reliance',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'key_suppliers',
                        label: 'Please list key suppliers and functions they support:'
                    }
                },
                {
                    question: '8. Does your business continuity or disaster recovery plan specifically address prolonged outages of critical third-party services?',
                    field: 'third_party_outage_plan',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Our business continuity and disaster recovery plans do not specifically address prolonged outages of critical third-party services.' },
                        { value: '2', label: 'Our plans generally mention third-party risks, but do not include detailed strategies for extended outages of critical providers.' },
                        { value: '3', label: 'Our plans include scenarios for disruptions to critical third-party services, but they are not deeply detailed or regularly tested.' },
                        { value: '4', label: 'Our business continuity and disaster recovery plans explicitly cover prolonged outages of critical third-party services, with documented procedures, alternate arrangements, and regular testing.' }
                    ]
                },
                {
                    question: '9. Have you assessed how a primary cloud provider outage would impact your operations, and does your continuity plan address this?',
                    field: 'cloud_provider_assessment',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No assessment has been done, and no contingency exists for cloud service failure.' },
                        { value: '2', label: 'Cloud risks are informally acknowledged, with documented impacts of downtime and some alternate communication or manual processes identified, but they are not fully integrated into formal planning.' },
                        { value: '3', label: 'Cloud dependency is mapped in continuity plans, and mitigations (e.g., data export, failover zones) are in place.' },
                        { value: '4', label: 'Cloud risk is deeply integrated into BCP, with multi-region failover, vendor SLAs, and automated recovery tested regularly.' }
                    ]
                },
                {
                    question: '10. How do you investigate and address the root cause of major security incidents, service problems, or customer complaints?',
                    field: 'incident_investigation',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Root cause is not formally investigated; focus is only on fixing the immediate issue.' },
                        { value: '2', label: 'Issues are discussed internally, with root cause reviews and some documentation or follow-up for significant incidents, but lessons learned and corrective actions are applied inconsistently.' },
                        { value: '3', label: 'A structured post-incident review (PIR) process is used for all major events, with documented corrective actions.' },
                        { value: '4', label: 'Formal root cause analysis is conducted with executive oversight, cross-functional input, tracked improvements, and trend analysis.' }
                    ]
                }
            ];
            
            section7Questions.forEach(q => {
                checkPageBreak(15);
                contentDoc.setFontSize(12);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 2;
                
                contentDoc.setFontSize(10);
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData[q.field];
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    // Handle follow-up questions
                    if (q.followUp && fieldValue === q.followUp.condition) {
                        yPosition += 3;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        contentDoc.setFont(undefined, 'normal');
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Answer: ${followUpValue}`, margin);
                        }
                    }
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 11 with questions and selected options
        function addSection11WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('11. People, Employment Practices & Insider Controls', margin);
            
            // Define all Section 11 questions with their field names  
            const section11Questions = [
                {
                    question: '1. What background checks or screening do you use to evaluate new hires, especially for roles with access to sensitive data or systems?',
                    field: 'background_checks',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No background checks or screening are conducted before hiring.' },
                        { value: '2', label: 'Basic reference checks and, for sensitive roles, occasional criminal background or employment verification are performed, but there is no formal screening policy and practices are inconsistent.' },
                        { value: '3', label: 'Standardized screening process includes criminal, employment, and education verification for all roles with data/system access.' },
                        { value: '4', label: 'A comprehensive, risk-based screening process is applied based on role sensitivity, including background, credit (where appropriate), and regulatory compliance checks.' }
                    ]
                },
                {
                    question: '2. What is your process for ensuring new hires understand and follow your company\'s key policies, like security and acceptable use?',
                    field: 'new_hire_policy_training',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'New hires receive little or no orientation on company policies.' },
                        { value: '2', label: 'New hires receive policies to review as part of basic onboarding, with signed acknowledgment required for key policies like confidentiality or acceptable use, but broader training or acknowledgment is not consistently required.' },
                        { value: '3', label: 'New hires complete structured onboarding, including required training on security, privacy, and acceptable use policies.' },
                        { value: '4', label: 'Onboarding includes interactive, role-specific policy training with testing, tracked completion, and annual re-certification for key policies.' }
                    ]
                },
                {
                    question: '3. How are employees trained to avoid accidentally sharing confidential information through email, messages, or presentations?',
                    field: 'confidentiality_training',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No training is provided on handling confidential information.' },
                        { value: '2', label: 'Employees receive informal reminders and confidentiality training during onboarding, but there is no structured or ongoing training program.' },
                        { value: '3', label: 'Regular training is provided, including email and presentation dos/don\'ts and examples of accidental disclosure.' },
                        { value: '4', label: 'Employees receive role-based, scenario-driven training with testing, reinforced by policy, monitoring, and reporting mechanisms.' }
                    ]
                },
                {
                    question: '4. What steps are in place to detect unusual employee behavior that could indicate a security or policy issue?',
                    field: 'unusual_behavior_detection',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No monitoring or detection tools or processes are in place.' },
                        { value: '2', label: 'Potential issues are identified informally through manager observation or peer reporting, with HR or IT conducting manual log reviews when concerns arise, but there is no ongoing monitoring.' },
                        { value: '3', label: 'Systems log user activity and can flag anomalies; HR and IT have a defined process to investigate concerns.' },
                        { value: '4', label: 'Behavioral analytics and monitoring tools are in place for high-risk roles, with integrated alerting, response protocols, and legal/HR oversight.' }
                    ]
                },
                {
                    question: '5. Do employment agreements clearly define confidentiality obligations, IP ownership, and terms that continue after someone leaves?',
                    field: 'employment_agreement_terms',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'Employment agreements do not include confidentiality or IP ownership provisions, and have no post-employment obligations.' },
                        { value: '2', label: 'Some agreements include confidentiality clauses, but IP ownership or post-employment obligations are missing or inconsistent.' },
                        { value: '3', label: 'Most agreements include confidentiality, IP ownership, and some terms that extend after employment ends, though not always reviewed or tailored.' },
                        { value: '4', label: 'All employment agreements clearly define confidentiality, IP ownership, and post-employment obligations, are reviewed by legal counsel, and updated regularly.' }
                    ]
                },
                {
                    question: '6. What steps ensure NDAs are signed, enforced, and followed, particularly after employment ends?',
                    field: 'nda_enforcement',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'NDAs are rarely used or tracked, with no process to enforce them during or after employment.' },
                        { value: '2', label: 'NDAs are signed for some roles or situations, but tracking is informal and follow-up after employment is minimal.' },
                        { value: '3', label: 'NDAs are standard for employees and key contractors, tracked centrally, with reminders of obligations given during exit processes.' },
                        { value: '4', label: 'NDAs are mandatory for all staff and applicable vendors, systematically tracked, enforced with formal exit procedures, and obligations monitored post-employment.' }
                    ]
                }
            ];
            
            // Process each question
            section11Questions.forEach(q => {
                checkPageBreak(30);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 12 with questions and selected options
        function addSection12WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('12. Artificial Intelligence Tools & Controls', margin);
            
            // Define all Section 12 questions with their field names  
            const section12Questions = [
                {
                    question: '1. Do you have formal policies governing employee use of generative AI tools in the workplace?',
                    field: 'ai_tool_policies',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal policy exists; employees use AI tools at their discretion without oversight or guidance.' },
                        { value: '2', label: 'Informal guidelines are communicated verbally or via ad hoc communications, but no formalized or documented policy is in place.' },
                        { value: '3', label: 'A documented policy exists outlining acceptable AI use cases and prohibited applications; periodic reminders or basic training are provided.' },
                        { value: '4', label: 'A comprehensive, regularly updated AI use policy is in place, aligned with legal, regulatory, and ethical standards. Mandatory employee training, acknowledgement tracking, and compliance audits ensure adherence.' }
                    ]
                },
                {
                    question: '2. How does your organization ensure sensitive, proprietary or customer data is not inadvertently inputted into public or third-party AI tools?',
                    field: 'ai_data_protection',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No controls or employee awareness; sensitive data may be shared with AI tools without restriction or monitoring.' },
                        { value: '2', label: 'Employees are instructed not to share sensitive data with AI tools, but enforcement is manual and there are no technical safeguards.' },
                        { value: '3', label: 'Data classification and access rules are defined, with monitoring tools or DLP (Data Loss Prevention) systems in place to detect and prevent accidental sharing.' },
                        { value: '4', label: 'Strong, enforced controls combining technical safeguards (e.g., AI input filtering, DLP, endpoint restrictions) with mandatory training, AI-specific data handling protocols, and real-time monitoring to prevent sensitive data leakage.' }
                    ]
                },
                {
                    question: '3. How are AI tools provisioned and monitored internally to ensure only authorized employees can access and use them?',
                    field: 'ai_tool_provisioning',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No restrictions; any employee can access and use AI tools, including unsanctioned or public platforms, without oversight.' },
                        { value: '2', label: 'AI tool access is limited to certain teams, but controls are informal and not technically enforced (e.g., relying on manager approval or trust).' },
                        { value: '3', label: 'Approved AI tools are centrally provisioned with role-based access controls; usage logs are reviewed periodically but not continuously monitored.' },
                        { value: '4', label: 'Enterprise-approved AI tools integrated with identity and access management (IAM), multi-factor authentication, continuous monitoring, automated alerts for misuse, and centralized reporting dashboards for compliance oversight.' }
                    ]
                },
                {
                    question: '4. What steps do you take to make sure AI-generated content doesn\'t violate privacy rules or IP rights?',
                    field: 'ai_content_compliance',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No review or safeguards are in place to monitor AI-generated content.' },
                        { value: '2', label: 'There is informal awareness of potential privacy and IP risks, with some safeguards such as manual review of public content, but no specific controls or consistent validation process are in place.' },
                        { value: '3', label: 'The business has implemented content review procedures, and AI output is checked for privacy or IP issues before publication or use.' },
                        { value: '4', label: 'There is a formal review and compliance process involving legal, compliance, and product teams to ensure AI outputs align with IP, copyright, and data privacy obligations.' }
                    ]
                },
                {
                    question: '5. Have you implemented controls to monitor and validate the accuracy and reliability of outputs generated by third-party AI tools?',
                    field: 'ai_output_validation',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No controls in place; outputs from AI tools are used without review or validation, relying entirely on the tool\'s outputs.' },
                        { value: '2', label: 'Manual review of outputs occurs inconsistently, dependent on individual user discretion, with no formal validation process or documented standards.' },
                        { value: '3', label: 'A formal processes exist for reviewing and validating AI outputs, including documented criteria and periodic spot checks by subject matter experts.' },
                        { value: '4', label: 'A comprehensive validation framework in place, combining automated checks, human-in-the-loop oversight, and ongoing performance monitoring. Continuous audits and feedback loops are used to detect errors, bias, and drift, with results feeding into process improvements.' }
                    ]
                },
                {
                    question: '6. Do you have incident response procedures in place to address errors, misuse, or breaches resulting from third-party AI tool use?',
                    field: 'ai_incident_response',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No formal incident response procedures exist for AI-related errors or misuse.' },
                        { value: '2', label: 'General IT or cybersecurity incident response procedures exist but do not address AI-specific risks or third-party tool misuse.' },
                        { value: '3', label: 'A documented incident response plan includes AI-related scenarios, with designated roles and escalation paths. Periodic tabletop exercises or testing are conducted, but scope remains limited.' },
                        { value: '4', label: 'A comprehensive AI-specific incident response plan is fully integrated with enterprise risk and cybersecurity frameworks. It includes rapid detection, predefined playbooks for AI errors/misuse, coordination with third-party vendors, post-incident reviews, and continuous improvement.' }
                    ]
                },
                {
                    question: '7. Have you reviewed whether your insurance or contracts adequately address risks from using AI, such as errors, reputation damage, or legal issues?',
                    field: 'ai_insurance_review',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'No review has been done, and existing policies or contracts may not address AI-related risks.' },
                        { value: '2', label: 'AI-related risks have been considered internally, and while some insurance coverage has been extended or gaps flagged by general counsel, there has been no formal review or comprehensive adjustments to coverage.' },
                        { value: '3', label: 'AI-related risks have been reviewed with legal and insurance advisors, and contracts include basic protections (e.g., disclaimers, indemnity).' },
                        { value: '4', label: 'The company proactively manages AI risks through tailored contractual clauses, D&O/E&O/cyber coverage extensions, and periodic reviews aligned to evolving uses of AI and regulatory guidance.' }
                    ]
                },
                {
                    question: '8. Do you require contractual indemnities or evidence of insurance from third-party AI vendors used in your internal operations?',
                    field: 'ai_vendor_indemnities',
                    type: 'radio',
                    options: [
                        { value: '1', label: 'We accept the vendors Terms of Service without review or monitoring of indemnification obligations.' },
                        { value: '2', label: 'Some contracts include general indemnification language, but vendor insurance evidence is not consistently requested.' },
                        { value: '3', label: 'Contracts include defined indemnities for AI-related risks and require vendors to provide proof of insurance, but enforcement and periodic review are limited.' },
                        { value: '4', label: 'Robust vendor agreements mandate AI-specific indemnification, verified insurance coverage aligned with exposure (e.g., tech E&O, cyber), and ongoing compliance monitoring to ensure protections remain current.' }
                    ]
                }
            ];
            
            // Process each question
            section12Questions.forEach(q => {
                checkPageBreak(30);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Section 13 with questions and selected options
        function addSection13WithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('13. Prior Incidents & Claims', margin);
            
            // Define all Section 13 questions with their field names  
            const section13Questions = [
                {
                    question: '1. In the last 5 years, has the Company, or any entity falling within the definition of \'Insured\' under the proposed Policy, its partners, directors, officers, or employees ever had a written demand or civil proceedings for compensatory damages made against them?',
                    field: 'written_demands',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'written_demands_details_text',
                        label: 'If yes, provide details:'
                    }
                },
                {
                    question: '2. In the past 5 years has the Company, or any entity falling within the definition of \'Insured\' under the proposed Policy:',
                    field: 'incidents',
                    type: 'checkbox',
                    options: [
                        { field: 'incident_privacy_claims', label: 'Received any claims or complaints regarding privacy, data protection or network security, or unauthorized disclosure of information?' },
                        { field: 'incident_breach_notification', label: 'Notified any persons of a privacy violation and/or data breach incident?' },
                        { field: 'incident_extortion', label: 'Received an extortion demand relating to your data and/or computer systems?' },
                        { field: 'incident_network_outage', label: 'Experienced a network outage that resulted in a significant disruption to your operations?' },
                        { field: 'incident_government_action', label: 'Been subject to any government action, investigation, subpoena regarding any alleged violation of privacy law or regulation?' },
                        { field: 'incident_ip_complaint', label: 'Received a complaint or cease and desist demand alleging trademark, copyright, invasion of privacy, defamation with regard to content published, displayed, or distributed by or on behalf of the applicant?' },
                        { field: 'incident_policy_covered', label: 'Experienced any incident which may be covered under this policy?' }
                    ],
                    followUp: {
                        condition: 'any_yes',
                        field: 'incident_details_text',
                        label: 'If Yes to any of the above, please provide details on an addendum including relevant dates, brief summary of incident and any preventative measures that have been taken to prevent a reoccurrence:'
                    }
                },
                {
                    question: '3. Is the Applicant, or any person applying for this insurance aware of any fact, circumstance, situation, event, or act that reasonably could give rise to a claim against them for any coverages for which the Applicant is applying?',
                    field: 'potential_claims_awareness',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                }
            ];
            
            // Process each question
            section13Questions.forEach(q => {
                checkPageBreak(30);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                if (q.type === 'radio') {
                    const fieldValue = sectionData ? sectionData[q.field] : null;
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    
                    // Handle follow-up questions for radio type
                    if (q.followUp && fieldValue === q.followUp.condition && sectionData) {
                        yPosition += 5;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        yPosition += 3;
                        contentDoc.setFont(undefined, 'normal');
                        
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Answer: ${followUpValue}`, margin);
                        } else {
                            addWrappedText('Answer: (No details provided)', margin);
                        }
                    }
                } else if (q.type === 'checkbox') {
                    // Handle checkbox questions
                    let anyIncidentSelected = false;
                    
                    if (q.options) {
                        q.options.forEach(option => {
                            const fieldValue = sectionData ? sectionData[option.field] : null;
                            const isSelected = fieldValue === 'yes';
                            const symbol = isSelected ? '\u2611' : '\u2610'; // Boxed checkmark or empty box
                            addWrappedText(`${symbol} ${option.label}`, margin);
                            
                            if (isSelected) {
                                anyIncidentSelected = true;
                            }
                        });
                    }
                    
                    // Handle follow-up for checkbox questions
                    if (q.followUp && anyIncidentSelected && sectionData) {
                        yPosition += 5;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        yPosition += 3;
                        contentDoc.setFont(undefined, 'normal');
                        
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Details: ${followUpValue}`, margin);
                        } else {
                            addWrappedText('Details: (No details provided)', margin);
                        }
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for AI Additional Questions with all questions and options
        function addAISectionWithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('1.  Artificial Intelligence (Additional Questions)', margin);
            
            // Define all AI Additional Questions with their field names
            const aiQuestions = [
                {
                    question: '1. Is AI functionality integrated into any of your software products or services provided to customers or third parties?',
                    field: 'ai_functionality_integrated',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'ai_functionality_description',
                        label: 'If yes, specify which products/services and describe the functionality:'
                    }
                },
                {
                    question: '2. Do you develop your own proprietary AI or ML models?',
                    field: 'develop_proprietary_ai',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'proprietary_ai_description',
                        label: 'If yes, please describe the types of models and applications:'
                    }
                },
                {
                    question: '3. Do you use third-party or open-source AI/ML models in your offerings?',
                    field: 'use_third_party_ai',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'third_party_ai_description',
                        label: 'If yes, please describe the types of models and applications:'
                    }
                },
                {
                    question: '4. Do you have formal processes to test, validate, and monitor the performance and reliability of AI/ML models before and after deployment?',
                    field: 'ai_testing_processes',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'ai_testing_description',
                        label: 'If yes, please describe:'
                    }
                },
                {
                    question: '5. Do you have internal policies addressing the ethical or regulatory use of AI, including issues such as bias, fairness, explainability, or compliance with applicable AI legislation?',
                    field: 'ai_ethical_policies',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '6. Do you train AI/ML models on customer or third-party data?',
                    field: 'ai_train_customer_data',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'ai_data_permissions',
                        label: 'If yes, do you have processes to obtain appropriate permissions, anonymize, or secure the data?'
                    }
                },
                {
                    question: '7. Have you taken steps to ensure that the use of data in training or operating your AI systems does not infringe third-party intellectual property rights?',
                    field: 'ai_ip_protection',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '8. Do your customer contracts include disclaimers or limitations of liability specifically addressing your AI functionality (e.g., output reliability, errors, or recommendations generated by AI)?',
                    field: 'ai_contract_disclaimers',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '9. Have you been subject to any complaints, demands, or legal proceedings arising out of your use or provision of AI systems?',
                    field: 'ai_legal_proceedings',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '10. Are AI agents integrated into any of your software products or services provided to customers or third parties?',
                    field: 'ai_agents_integrated',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                }
            ];
            
            // Process each question
            aiQuestions.forEach(q => {
                checkPageBreak(15);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    // Handle follow-up questions
                    if (q.followUp && fieldValue === q.followUp.condition && sectionData) {
                        yPosition += 3;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        yPosition += 2;
                        contentDoc.setFont(undefined, 'normal');
                        
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Answer: ${followUpValue}`, margin);
                        } else {
                            addWrappedText('Answer: (No response provided)', margin);
                        }
                    }
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for DeFi Additional Questions with all questions and options
        function addDeFiSectionWithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('2. Decentralized Finance & Digital Assets (Additional Questions)', margin);
            
            // Define all DeFi Additional Questions with their field names
            const defiQuestions = [
                {
                    question: '1. Do you provide any services involving cryptocurrency custody, wallet management, or private key management on behalf of clients?',
                    field: 'defi_custody_services',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_custody_controls',
                        label: 'If yes, please describe the controls in place to secure these assets:'
                    }
                },
                {
                    question: '2. Do you operate or maintain a cryptocurrency exchange or trading platform?',
                    field: 'defi_exchange_platform',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        fields: ['defi_crypto_types', 'defi_daily_volume', 'defi_geographic_regions'],
                        label: 'If yes, please specify:'
                    }
                },
                {
                    question: '3. Do you use or develop smart contracts in connection with your services (e.g., for decentralized finance, token issuance, automated settlements)?',
                    field: 'defi_smart_contracts',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_audit_processes',
                        label: 'If yes, please describe your processes for auditing and testing these smart contracts prior to deployment:'
                    }
                },
                {
                    question: '4. Have you engaged any third-party security firms to perform penetration testing or blockchain code audits on your platforms or products?',
                    field: 'defi_security_audits',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_security_findings',
                        label: 'If yes, please attach the latest summary findings or certifications:'
                    }
                },
                {
                    question: '5. Do your standard client agreements include disclaimers, waivers, or limitations of liability specifically addressing risks related to cryptocurrency transactions, volatility, or smart contracts?',
                    field: 'defi_disclaimers',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_contract_clauses',
                        label: 'If yes, please attach sample contract clauses:'
                    }
                },
                {
                    question: '6. Do you maintain separate hot and cold wallet infrastructures for cryptocurrency held on behalf of clients?',
                    field: 'defi_wallet_infrastructure',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_wallet_split',
                        label: 'If yes, please describe the split and security controls:'
                    }
                },
                {
                    question: '7. Are any of your blockchain or crypto-related activities regulated by financial services authorities (e.g., FINTRAC, MiCA, VARA, MAS)?',
                    field: 'defi_regulated',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_regulators',
                        label: 'If yes, please list regulators and licenses held:'
                    }
                },
                {
                    question: '8. Do you have documented policies and procedures in place for Anti-Money Laundering (AML), Counter Terrorist Financing (CFT), and customer onboarding (KYC/KYB)?',
                    field: 'defi_aml_policies',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_aml_policy',
                        label: 'Please attach your AML/KYC policy:'
                    }
                },
                {
                    question: '9. What processes do you have to ensure compliance with international sanctions laws (e.g., OFAC, EU sanctions) in transactions involving digital assets?',
                    field: 'defi_sanctions_compliance',
                    type: 'textarea'
                },
                {
                    question: '10. Do you maintain logs or blockchain analytics to monitor and trace the source of funds to help mitigate fraud, money laundering, or sanctions violations?',
                    field: 'defi_blockchain_analytics',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_analytics_systems',
                        label: 'If yes, please describe the systems or vendors used:'
                    }
                },
                {
                    question: '11. Do you use any decentralized protocols (DEXs, liquidity pools, DeFi protocols) as part of your business operations or investment strategies?',
                    field: 'defi_protocols',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '12. Do you use third-party custodians, liquidity providers, or technology vendors for any part of your crypto operations?',
                    field: 'defi_third_party',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_indemnity',
                        label: 'If yes, do your contracts with these providers include indemnity and hold harmless provisions in your favor?'
                    }
                },
                {
                    question: '13. Do you hold or have custody digital assets on your own balance sheet for investment purposes?',
                    field: 'defi_investment_assets',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_investment_value',
                        label: 'Please indicate the approximate value and percentage of total assets:'
                    }
                },
                {
                    question: '14. Do you develop, issue, or advise on the issuance of tokens, coins, or other digital assets?',
                    field: 'defi_token_issuance',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_token_structure',
                        label: 'Please provide details on the token structure and investor protections:'
                    }
                },
                {
                    question: '15. What percentage of your business revenue is derived from blockchain or cryptocurrency-related services versus traditional financial or technology services?',
                    field: 'defi_revenue_percentage',
                    type: 'text'
                },
                {
                    question: '16. Do you have incident response plans specific to handling cryptocurrency or blockchain-related security events, including notifying customers and regulators?',
                    field: 'defi_incident_response',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '17. Do you have insurance coverage in place (separate from E&O) to protect against loss or theft of cryptocurrency assets (crime / cyber crime / specie)?',
                    field: 'defi_crypto_insurance',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '18. Do you carry directors & officers (D&O) insurance that specifically contemplates exposures arising from cryptocurrency or blockchain-related activities?',
                    field: 'defi_do_insurance',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '19. Have you ever been the subject of any regulatory investigation, audit, inquiry, or received a warning letter in relation to your crypto or blockchain activities?',
                    field: 'defi_regulatory_issues',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '20. Have you experienced any hacks, data breaches, theft of cryptocurrency assets, or significant transaction errors in the last five years?',
                    field: 'defi_security_incidents',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'defi_incident_details',
                        label: 'If yes, please provide details, including remedial actions taken:'
                    }
                }
            ];
            
            // Process each question
            defiQuestions.forEach(q => {
                checkPageBreak(15);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                const fieldValue = sectionData ? sectionData[q.field] : null;
                
                if (q.type === 'radio' && q.options) {
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    // Handle follow-up questions
                    if (q.followUp && fieldValue === q.followUp.condition && sectionData) {
                        yPosition += 3;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        yPosition += 2;
                        contentDoc.setFont(undefined, 'normal');
                        
                        if (q.followUp.fields) {
                            // Handle multiple follow-up fields
                            q.followUp.fields.forEach(field => {
                                const followUpValue = sectionData[field];
                                if (followUpValue) {
                                    const fieldName = field.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
                                    const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                                    addWrappedText(`${capitalizedName}: ${followUpValue}`, margin);
                                }
                            });
                        } else if (q.followUp.field) {
                            // Handle single follow-up field
                            const followUpValue = sectionData[q.followUp.field];
                            if (followUpValue) {
                                addWrappedText(`Answer: ${followUpValue}`, margin);
                            } else {
                                addWrappedText('Answer: (No response provided)', margin);
                            }
                        }
                    }
                } else if (q.type === 'textarea' || q.type === 'text') {
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }
        
        // Enhanced function for Robotics Additional Questions with all questions and options
        function addRoboticsSectionWithQuestions(sectionData) {
            checkPageBreak(20);
            addSectionTitle('3. Autonomous Robotics (Additional Questions)', margin);
            
            // Define all Robotics Additional Questions with their field names
            const roboticsQuestions = [
                {
                    question: '1. What functions do your autonomous robots perform?',
                    field: 'robotics_functions',
                    type: 'textarea'
                },
                {
                    question: '2. Are your robots used in public or semi-public environments (e.g., hospitals, airports, malls)?',
                    field: 'robotics_public_use',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '3. How many autonomous robots are currently deployed in the field?',
                    field: 'robotics_deployed_count',
                    type: 'text'
                },
                {
                    question: '4. What level of autonomy do your robots operate at?',
                    field: 'robotics_autonomy_level',
                    type: 'radio',
                    options: [
                        { value: 'remote_controlled', label: 'Remote controlled' },
                        { value: 'semi_autonomous', label: 'Semi – autonomous' },
                        { value: 'fully_autonomous', label: 'Fully autonomous (no human in the loop)' }
                    ]
                },
                {
                    question: '5. Can the robot make real-time decisions without human oversight?',
                    field: 'robotics_realtime_decisions',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '6. Are there human override or emergency shutdown capabilities built into each unit?',
                    field: 'robotics_emergency_shutdown',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '7. What navigation methods are used? (select all that apply)',
                    field: 'robotics_navigation',
                    type: 'checkbox',
                    options: [
                        { value: 'gps', label: 'GPS' },
                        { value: 'slam', label: 'SLAM' },
                        { value: 'lidar', label: 'LiDAR' },
                        { value: 'computer_vision', label: 'Computer Vision' },
                        { value: 'beacon_infrared', label: 'Beacon/Infrared' },
                        { value: 'other', label: 'Other' }
                    ],
                    followUp: {
                        condition: 'other',
                        field: 'nav_other_specify',
                        label: 'Please specify other navigation methods:'
                    }
                },
                {
                    question: '8. Are the robots equipped with real-time obstacle detection and collision avoidance systems?',
                    field: 'robotics_obstacle_detection',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '9. Have you had any reported incidents involving physical harm or property damage caused by a robot?',
                    field: 'robotics_incidents',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ],
                    followUp: {
                        condition: 'yes',
                        field: 'robotics_incident_description',
                        label: 'If yes please describe:'
                    }
                },
                {
                    question: '10. Do your robots use AI agents or machine learning models to support decision-making?',
                    field: 'robotics_ai_ml',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '11. How often is the software or firmware on the robots updated?',
                    field: 'robotics_update_frequency',
                    type: 'text'
                },
                {
                    question: '12. Do you maintain logs of robot activity and decision-making for audit or incident response purposes?',
                    field: 'robotics_activity_logs',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '13. Are communications between robots and your servers encrypted and authenticated?',
                    field: 'robotics_encrypted_comms',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '14. Have your systems undergone independent safety, cybersecurity, or compliance audits?',
                    field: 'robotics_audits',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '15. Are your robots certified or compliant with any relevant safety or robotics standards (e.g., ISO 13482, UL 3100)?',
                    field: 'robotics_standards',
                    type: 'radio',
                    options: [
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                    ]
                },
                {
                    question: '16. Do you perform regular maintenance or diagnostics on deployed robotic units?',
                    field: 'robotics_maintenance',
                    type: 'radio',
                    options: [
                        { value: 'scheduled_protocols', label: 'Yes – per scheduled maintenance protocols' },
                        { value: 'failure_only', label: 'Yes – only upon failure or customer report' },
                        { value: 'no_formal', label: 'No formal maintenance program' }
                    ]
                },
                {
                    question: '17. Are any robots deployed at customer or third-party locations where you do not have direct operational control?',
                    field: 'robotics_third_party_deployment',
                    type: 'radio',
                    options: [
                        { value: 'no', label: 'No' },
                        { value: 'yes_monitored', label: 'Yes – with active monitoring' },
                        { value: 'yes_unmonitored', label: 'Yes – without active monitoring' }
                    ]
                },
                {
                    question: '18. Do your robots interact directly with members of the public or end users (e.g., customers, patients, pedestrians)?',
                    field: 'robotics_public_interaction',
                    type: 'radio',
                    options: [
                        { value: 'yes_frequently', label: 'Yes – frequently' },
                        { value: 'occasionally', label: 'Occasionally' },
                        { value: 'no_direct', label: 'No direct interaction' }
                    ]
                },
                {
                    question: '19. Do you have contracts in place with customers or partners that include:',
                    field: 'robotics_contract_terms',
                    type: 'checkbox',
                    options: [
                        { value: 'limitations_liability', label: 'Limitations of liability?' },
                        { value: 'indemnification', label: 'Indemnification terms?' },
                        { value: 'insurance_requirements', label: 'Insurance requirements?' }
                    ]
                },
                {
                    question: '20. Do you carry insurance coverage specific to autonomous hardware/software risks (e.g., product liability, tech E&O, cyber)?',
                    field: 'robotics_insurance_coverage',
                    type: 'radio',
                    options: [
                        { value: 'yes_adequate', label: 'Yes – adequate and reviewed annually' },
                        { value: 'yes_needs_review', label: 'Yes – but may need review' },
                        { value: 'no_coverage', label: 'No specific coverage' }
                    ]
                }
            ];
            
            // Process each question
            roboticsQuestions.forEach(q => {
                checkPageBreak(15);
                
                contentDoc.setFontSize(10);
                contentDoc.setFont('AptosSerif', 'bold');
                addWrappedText(q.question, margin);
                yPosition += 3;
                
                contentDoc.setFont(undefined, 'normal');
                
                if (q.type === 'radio') {
                    const fieldValue = sectionData ? sectionData[q.field] : null;
                    renderSelectedRadioOption(contentDoc, fieldValue, q.options, margin);
                    // Handle follow-up questions
                    if (q.followUp && fieldValue === q.followUp.condition && sectionData) {
                        yPosition += 3;
                        contentDoc.setFont('AptosSerif', 'bold');
                        addWrappedText(q.followUp.label, margin);
                        yPosition += 2;
                        contentDoc.setFont(undefined, 'normal');
                        
                        const followUpValue = sectionData[q.followUp.field];
                        if (followUpValue) {
                            addWrappedText(`Answer: ${followUpValue}`, margin);
                        } else {
                            addWrappedText('Answer: (No response provided)', margin);
                        }
                    }
                } else if (q.type === 'checkbox') {
                    const fieldValue = sectionData ? sectionData[q.field] : null;
                    
                    if (q.options) {
                        q.options.forEach(option => {
                            let isSelected = false;
                            if (Array.isArray(fieldValue)) {
                                isSelected = fieldValue.includes(option.value);
                            }
                            const symbol = isSelected ? '\u2611' : '\u2610'; // Boxed checkmark or empty box
                            addWrappedText(`${symbol} ${option.label}`, margin);
                            
                            // Handle follow-up for checkbox with other option
                            if (q.followUp && option.value === q.followUp.condition && isSelected && sectionData) {
                                yPosition += 3;
                                contentDoc.setFont('AptosSerif', 'bold');
                                addWrappedText(q.followUp.label, margin);
                                yPosition += 2;
                                contentDoc.setFont(undefined, 'normal');
                                
                                const followUpValue = sectionData[q.followUp.field];
                                if (followUpValue) {
                                    addWrappedText(`Answer: ${followUpValue}`, margin);
                                } else {
                                    addWrappedText('Answer: (No response provided)', margin);
                                }
                            }
                        });
                    }
                } else if (q.type === 'textarea' || q.type === 'text') {
                    const fieldValue = sectionData ? sectionData[q.field] : null;
                    if (fieldValue) {
                        addWrappedText(`Answer: ${fieldValue}`, margin);
                    } else {
                        addWrappedText('Answer: (No response provided)', margin);
                    }
                }
                
                yPosition += 8;
            });
            
            yPosition += 5;
        }

        // Helper function to add section data
        function addSectionData(sectionTitle, sectionData) {
            checkPageBreak(20);
            addSectionTitle(sectionTitle, margin);
            
            contentDoc.setFontSize(10);
            contentDoc.setFont(undefined, 'normal');
            
            if (Object.keys(sectionData).length === 0) {
                addWrappedText('No data entered for this section', margin);
                yPosition += 5;
                return;
            }
            
            Object.entries(sectionData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    checkPageBreak();
                    // Format field name
                    const fieldName = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
                    const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                    
                    // Format value
                    let displayValue = value;
                    if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                    }
                    
                    addWrappedText(`${capitalizedName}: ${displayValue}`, margin);
                }
            });
            yPosition += 10;
        }
        
        // Section 2: General Information - Enhanced with questions and options
        sectionPageNumbers['2. General Information'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection2WithQuestions(formData.generalInfo);
        
        // Section 3: Operations - Enhanced with questions and options
        sectionPageNumbers['3. Operations'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection3WithQuestions(formData.operations);
        
        // Section 4: Financials - Enhanced with questions and options
        sectionPageNumbers['4. Financials'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection4WithQuestions(formData.financials);
        
        // Section 5: Contractual Controls - Enhanced with questions and options
        sectionPageNumbers['5. Contractual Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection5WithQuestions(formData.contractualControls);
        
        // Section 6: Cybersecurity, Technical & Crime Controls - Enhanced with questions and options
        sectionPageNumbers['6. Cybersecurity, Technical & Crime Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection6WithQuestions(formData.cybersecurity);
        
        // Section 7: Data Backup & Business Continuity & Supply Chain Controls - Enhanced with questions and options
        sectionPageNumbers['7. Data Backup & Business Continuity & Supply Chain Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection7WithQuestions(formData.dataBackup);
        
        // Section 8: Third Party, Vendor & Supply Chain Controls - Enhanced with questions and options
        sectionPageNumbers['8. Third Party, Vendor & Supply Chain Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection8WithQuestions(formData.thirdParty);
        
        // Section 9: Privacy, Data Security & API Controls - Enhanced with questions and options
        sectionPageNumbers['9. Privacy, Data Security & API Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection9WithQuestions(formData.privacy);
        
        // Section 10: Intellectual Property & Content Governance Controls - Enhanced with questions and options
        sectionPageNumbers['10. Intellectual Property & Content Governance Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection10WithQuestions(formData.intellectualProperty);
        
        // Section 11: People, Employment Practices & Insider Controls - Enhanced with questions and options
        sectionPageNumbers['11. People, Employment Practices & Insider Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection11WithQuestions(formData.employment);
        
        // Section 12: Artificial Intelligence Tools & Controls - Enhanced with questions and options
        sectionPageNumbers['12. Artificial Intelligence Tools & Controls'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection12WithQuestions(formData.aiTools);
        
        // Section 13: Prior Incidents & Claims - Enhanced with questions and options
        sectionPageNumbers['13. Prior Incidents & Claims'] = contentDoc.internal.getNumberOfPages() + 2;
        addSection13WithQuestions(formData.priorIncidents);
        
        // Add all other sections
        //addSectionData('Section 2: General Information', formData.generalInfo);
        //addSectionData('Section 3: Operations', formData.operations);
        //addSectionData('Section 4: Financials', formData.financials);
        // Note: Sections 11, 12, and 13 are already handled by the enhanced functions above
        
        // Conditional sections (only if respective sectors were selected)
        if (formData.sectors.includes('ai')) {
            sectionPageNumbers['Additional Questions: Artificial Intelligence'] = contentDoc.internal.getNumberOfPages() + 2;
            addAISectionWithQuestions(formData.ai);
        }
        
        if (formData.sectors.includes('defi')) {
            sectionPageNumbers['Additional Questions: Decentralized Finance & Digital Assets'] = contentDoc.internal.getNumberOfPages() + 2;
            addDeFiSectionWithQuestions(formData.defi);
        }
        
        if (formData.sectors.includes('robotics')) {
            sectionPageNumbers['Additional Questions: Autonomous Robotics'] = contentDoc.internal.getNumberOfPages() + 2;
            addRoboticsSectionWithQuestions(formData.robotics);
        }
        
        // Don't add "Thank You" end page - will use static PDF instead
        
        // Generate Table of Contents
        function generateTableOfContents(sectionPages) {
            // Create a separate PDF document for Table of Contents
            const tocDoc = new jsPDF();
            
            // Register custom fonts
            window.registerFontsUMD(tocDoc);
            
            let tocYPosition = 50;
            const tocPageHeight = tocDoc.internal.pageSize.height;
            const tocMargin = 20;
            const tocLineHeight = 8;
            
            // ToC header will be added after title
            
            // ToC Title
            window.useFontUMD(tocDoc, 'PoppinsExtraBold16');
            tocDoc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]); // Blue color matching section titles
            tocDoc.text('Table of Contents', tocMargin, tocYPosition);
            tocYPosition += 15;
            
            // ToC entries - Use actual page numbers from section tracking
            const tocEntries = [];
            
            // Add main sections in order
            const mainSections = [
                '1. Sectors',
                '2. General Information',
                '3. Operations',
                '4. Financials',
                '5. Contractual Controls',
                '6. Cybersecurity, Technical & Crime Controls',
                '7. Data Backup & Business Continuity & Supply Chain Controls',
                '8. Third Party, Vendor & Supply Chain Controls',
                '9. Privacy, Data Security & API Controls',
                '10. Intellectual Property & Content Governance Controls',
                '11. People, Employment Practices & Insider Controls',
                '12. Artificial Intelligence Tools & Controls',
                '13. Prior Incidents & Claims'
            ];
            
            mainSections.forEach(sectionTitle => {
                if (sectionPages[sectionTitle]) {
                    tocEntries.push({ title: sectionTitle, page: sectionPages[sectionTitle] });
                }
            });
            
            // Add conditional sections based on selected sectors
            if (formData.sectors.includes('ai') && sectionPages['Additional Questions: Artificial Intelligence']) {
                tocEntries.push({ title: 'Additional Questions: Artificial Intelligence', page: sectionPages['Additional Questions: Artificial Intelligence'] });
            }
            if (formData.sectors.includes('defi') && sectionPages['Additional Questions: Decentralized Finance & Digital Assets']) {
                tocEntries.push({ title: 'Additional Questions: Decentralized Finance & Digital Assets', page: sectionPages['Additional Questions: Decentralized Finance & Digital Assets'] });
            }
            if (formData.sectors.includes('robotics') && sectionPages['Additional Questions: Autonomous Robotics']) {
                tocEntries.push({ title: 'Additional Questions: Autonomous Robotics', page: sectionPages['Additional Questions: Autonomous Robotics'] });
            }
            
            // Add ToC entries to the document
            // tocDoc.setFontSize(12);
            // tocDoc.setFont(undefined, 'normal');
            window.useFontUMD(tocDoc, 'PoppinsBlack12');
            tocDoc.setTextColor(0, 0, 0); // Black text for entries
            
            // Helper function to add header to ToC pages
            function addToCPageHeader(pageNum) {
                const pageWidth = tocDoc.internal.pageSize.width;
                
                // Axis logo image (left side)
                try {
                    tocDoc.addImage('./pdf/logo.png', 'PNG', tocMargin, 15, 30, 15);
                } catch (error) {
                    // Fallback to text if image fails to load
                    window.useFontUMD(tocDoc, 'PoppinsExtraBold16');
                    tocDoc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]); // Blue color
                    tocDoc.text('AXIS', tocMargin, 25);
                }
                
                // Technology Insurance Application | page number (single line, right side)
                window.useFontUMD(tocDoc, 'PoppinsBlack12');
                tocDoc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]); // Blue color
                const headerText = `Technology Insurance Application`;
                const textWidth = tocDoc.getTextWidth(headerText);
                tocDoc.text(headerText, pageWidth - tocMargin - textWidth, 25);
                
                // Blue border line at bottom of header
                tocDoc.setDrawColor(brandBlue[0], brandBlue[1], brandBlue[2]); // #0050F0 color
                tocDoc.setLineWidth(.5);
                tocDoc.line(tocMargin, 35, pageWidth - tocMargin, 35);
                
                // Reset text color to black for content
                tocDoc.setTextColor(0, 0, 0);
            }
            
            // Add header to first ToC page
            addToCPageHeader(1);
            
            tocEntries.forEach(entry => {
                // Check if we need a new page
                if (tocYPosition + tocLineHeight > tocPageHeight - tocMargin) {
                    tocDoc.addPage();
                    tocYPosition = 50; // Start below header area
                    addToCPageHeader(tocDoc.internal.getNumberOfPages());
                }
                
                // Add title
                window.useFontUMD(tocDoc, 'AptosSerifReg12');
                tocDoc.text(entry.title, tocMargin + 5, tocYPosition);
                
                // Add dotted line
                const titleWidth = tocDoc.getTextWidth(entry.title);
                const pageNumWidth = tocDoc.getTextWidth(entry.page.toString());
                const availableWidth = tocDoc.internal.pageSize.width - tocMargin - 5 - titleWidth - pageNumWidth - 10;
                const dotCount = Math.floor(availableWidth / 3);
                const dots = '.'.repeat(Math.max(dotCount, 1));
                
                tocDoc.text(dots, tocMargin + 5 + titleWidth + 5, tocYPosition);
                
                // Add page number
                tocDoc.text(entry.page.toString(), tocDoc.internal.pageSize.width - tocMargin - pageNumWidth, tocYPosition);
                
                tocYPosition += tocLineHeight;
            });
            
            // Add footer
            const tocPageCount = tocDoc.internal.getNumberOfPages();
            // for (let i = 1; i <= tocPageCount; i++) {
            //     tocDoc.setPage(i);
            //     tocDoc.setFontSize(8);
            //     tocDoc.setFont(undefined, 'normal');
            //     tocDoc.setTextColor(0, 0, 0);
            //     tocDoc.text(`Page ${i + 1}`, tocDoc.internal.pageSize.width - 40, tocDoc.internal.pageSize.height - 10);
            //     tocDoc.text('Axis Technology Insurance Application', tocMargin, tocDoc.internal.pageSize.height - 10);
            // }
            
            return tocDoc.output('arraybuffer');
        }
        
        // Generate ToC with actual page numbers
        const tocPdfBytes = generateTableOfContents(sectionPageNumbers);
        
        // Add headers and footers to all content pages (no front/end pages in content PDF)
        const pageCount = contentDoc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            contentDoc.setPage(i);
            
            // Add header to each content page (will adjust page numbers later when merged)
            addPageHeader(i + 2, pageCount + 3); // +1 for front cover, +1 for ToC, +1 for end page
            
            // Add footer to each content page
            // contentDoc.setFontSize(8);
            // contentDoc.setFont(undefined, 'normal');
            window.useFontUMD(contentDoc, 'Vollkorn14');
            contentDoc.setTextColor(0, 0, 0); // Ensure footer text is black
            contentDoc.text(`Page ${i + 2} of ${pageCount + 3}`, contentDoc.internal.pageSize.width - 40, contentDoc.internal.pageSize.height - 10);
            //contentDoc.text('Technology Insurance Application', margin, contentDoc.internal.pageSize.height - 10);
        }
        
        // Convert the content PDF to arrayBuffer for PDF-lib
        const contentPdfBytes = contentDoc.output('arraybuffer');
        
        // Now merge with static PDFs using PDF-lib
        const { PDFDocument } = PDFLib;
        
        showNotification('🔄 Loading and merging static PDF files...', 'info');
        
        let endPageBytes;
        
        // Use dynamically generated front cover (already generated above)
        const frontCoverBytes = frontCoverPdfBytes;
        
        try {
            // Try to load static end page PDF using fetch (works in server environment)
            const endPageResponse = await fetch('./pdf/end last page.pdf');
            
            if (!endPageResponse.ok) {
                throw new Error(`Failed to load end page PDF: ${endPageResponse.status}`);
            }
            
            endPageBytes = await endPageResponse.arrayBuffer();
            
        } catch (fetchError) {
            // Check if this is a CORS error (common when opening HTML file directly)
            if (fetchError.message.includes('fetch') || fetchError.name === 'TypeError') {
                showNotification('⚠️ CORS Error: Please run this application on an HTTP server', 'error');
                
                // Provide user-friendly error with instructions
                const corsErrorModal = `
                    <div id="corsErrorModal" style="
                        position: fixed; 
                        top: 0; left: 0; 
                        width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.7); 
                        z-index: 10000; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                    ">
                        <div style="
                            background: white; 
                            padding: 30px; 
                            border-radius: 10px; 
                            max-width: 600px; 
                            margin: 20px;
                            text-align: center;
                        ">
                            <h3 style="color: #dc3545; margin-bottom: 20px;">🚫 CORS Error Detected</h3>
                            <p><strong>The PDF files cannot be loaded when opening the HTML file directly in the browser.</strong></p>
                            <p style="margin: 20px 0;">To use the PDF merging feature, please run this application on an HTTP server:</p>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left;">
                                <strong>Options:</strong><br>
                                1. <strong>Python:</strong> <code>python -m http.server 8080</code><br>
                                2. <strong>Node.js:</strong> <code>npx serve .</code><br>
                                3. <strong>PHP:</strong> <code>php -S localhost:8080</code><br>
                                4. <strong>Use a web server like XAMPP/WAMP</strong>
                            </div>
                            <p style="font-size: 14px; color: #666;">Then access via <code>http://localhost:8080</code></p>
                            <button onclick="document.getElementById('corsErrorModal').remove()" style="
                                background: #007bff; 
                                color: white; 
                                border: none; 
                                padding: 10px 20px; 
                                border-radius: 5px; 
                                cursor: pointer;
                                margin-top: 15px;
                            ">Close</button>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', corsErrorModal);
                throw new Error('CORS Error: PDF files cannot be loaded. Please run on HTTP server.');
            } else {
                throw fetchError;
            }
        }
        
        // Create new PDF document for merging
        const finalPdf = await PDFDocument.create();
        
        // Load all PDFs
        const frontCoverPdf = await PDFDocument.load(frontCoverBytes);
        const tocPdf = await PDFDocument.load(tocPdfBytes);
        const contentPdf = await PDFDocument.load(contentPdfBytes);
        const endPagePdf = await PDFDocument.load(endPageBytes);
        
        // Copy front cover pages
        const frontCoverPages = await finalPdf.copyPages(frontCoverPdf, frontCoverPdf.getPageIndices());
        frontCoverPages.forEach((page) => finalPdf.addPage(page));
        
        // Copy table of contents pages
        const tocPages = await finalPdf.copyPages(tocPdf, tocPdf.getPageIndices());
        tocPages.forEach((page) => finalPdf.addPage(page));
        
        // Copy content pages
        const contentPages = await finalPdf.copyPages(contentPdf, contentPdf.getPageIndices());
        contentPages.forEach((page) => finalPdf.addPage(page));
        
        // Copy end page pages
        const endPages = await finalPdf.copyPages(endPagePdf, endPagePdf.getPageIndices());
        endPages.forEach((page) => finalPdf.addPage(page));
        
        // Generate final PDF
        const finalPdfBytes = await finalPdf.save();
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
        const filename = `Axis-Technology-Insurance-Application-${timestamp}.pdf`;
        
        // Download the merged PDF
        const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Axis Technology Insurance Application PDF downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        
        if (error.message.includes('CORS Error')) {
            // CORS error already handled above with modal
            return;
        }
        
        if (error.message.includes('Failed to load') && error.message.includes('PDF')) {
            showNotification('❌ Error: Could not load static PDF files. Please check that pdf/end last page.pdf exist.', 'error');
        } else {
            showNotification('❌ Error generating PDF. Please try again.', 'error');
        }
    }
}
