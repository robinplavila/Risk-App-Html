/* Sector Management and Conditional Step Logic */

function updateConditionalSteps() {
    const aiSelected = $('#sector_ai').is(':checked');
    const defiSelected = $('#sector_defi').is(':checked');
    const roboticsSelected = $('#sector_robotics').is(':checked');
    
    // Reset all conditional steps
    $('#ai-step-indicator, #defi-step-indicator, #robotics-step-indicator').hide();
    $('#ai-step-separator, #defi-step-separator, #robotics-step-separator').hide();
    $('#ai-section, #defi-section, #robotics-section').removeClass('active').css('display', 'none');
    
    // Clear data-section attributes for all conditional sections to prevent conflicts
    $('#ai-section').removeAttr('data-section');
    $('#defi-section').removeAttr('data-section');
    $('#robotics-section').removeAttr('data-section');
    
    // Clear form data when sections are hidden
    if (!aiSelected) {
        $('#ai-section').find('input, textarea').val('').prop('checked', false);
        $('#ai-section').find('.conditional-field').hide();
        $('#ai-section').find('.ai-agent-conditional').hide();
    }
    if (!defiSelected) {
        $('#defi-section').find('input, textarea').val('').prop('checked', false);
        $('#defi-section').find('.conditional-field').hide();
    }
    if (!roboticsSelected) {
        $('#robotics-section').find('input, textarea').val('').prop('checked', false);
        $('#robotics-section').find('.conditional-field').hide();
    }
    
    // Dynamically assign step numbers starting from 14
    let nextStep = 14;
    const sectorSteps = [];
    
    if (aiSelected) {
        sectorSteps.push({
            sector: 'ai',
            step: nextStep,
            indicator: '#ai-step-indicator',
            separator: '#ai-step-separator',
            section: '#ai-section',
            title: 'Artificial Intelligence'
        });
        nextStep++;
    }
    
    if (defiSelected) {
        sectorSteps.push({
            sector: 'defi',
            step: nextStep,
            indicator: '#defi-step-indicator',
            separator: '#defi-step-separator',
            section: '#defi-section',
            title: 'Decentralized Finance'
        });
        nextStep++;
    }
    
    if (roboticsSelected) {
        sectorSteps.push({
            sector: 'robotics',
            step: nextStep,
            indicator: '#robotics-step-indicator',
            separator: '#robotics-step-separator',
            section: '#robotics-section',
            title: 'Autonomous Robotics'
        });
        nextStep++;
    }
    
    // Update the display and data attributes for each enabled sector
    sectorSteps.forEach((config, index) => {
        // Show and configure the step indicator
        $(config.indicator).show();
        $(config.indicator).attr('data-step', config.step);
        $(config.indicator).find('.step-number').text(config.step);
        $(config.indicator).find('.step-text').text(config.title);
        
        // Show separator (except for the last one)
        if (index < sectorSteps.length - 1 || sectorSteps.length < 3) {
            $(config.separator).show();
        }
        
        // Configure the section
        $(config.section).attr('data-section', config.step);
        
        // Update global flags
        if (config.sector === 'ai') aiStepEnabled = true;
        if (config.sector === 'defi') defiStepEnabled = true;
        if (config.sector === 'robotics') roboticsStepEnabled = true;
    });
    
    // Reset global flags for unselected sectors
    if (!aiSelected) aiStepEnabled = false;
    if (!defiSelected) defiStepEnabled = false;
    if (!roboticsSelected) roboticsStepEnabled = false;
    
    // Update total steps
    totalSteps = 13 + sectorSteps.length;
    
    // If we're currently on or past step 13, validate navigation
    if (currentStep >= 13) {
        // If current step is beyond what's now available, move to the last available step
        if (currentStep > totalSteps) {
            currentStep = totalSteps;
            showStep(currentStep);
        }
        updateNavigation();
        updateStepIndicator();
    }
    
    console.log(`Conditional steps updated. AI: ${aiStepEnabled}, DeFi: ${defiStepEnabled}, Robotics: ${roboticsStepEnabled}. Total steps: ${totalSteps}`);
}

// Initialize sector selection handlers
function setupSectorHandlers() {
    // Sector selection handler
    $('input[name="sectors[]"]').on('change', function() {
        updateConditionalSteps();
        
        // Update sector counts for requirements
        const selectedSectors = $('input[name="sectors[]"]:checked').length;
        if (selectedSectors > 0) {
            $('input[name="sectors[]"]').removeClass('is-invalid').addClass('is-valid');
        } else {
            $('input[name="sectors[]"]').removeClass('is-valid').addClass('is-invalid');
        }
    });
}