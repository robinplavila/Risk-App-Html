/* Axis Technology Insurance Application - Main Application Logic */

// Global conditional step flags
let aiStepEnabled = false;
let defiStepEnabled = false;
let roboticsStepEnabled = false;
let currentStep = 1;
let totalSteps = 13; // Base steps, conditional steps (14-16) added when sectors selected

$(document).ready(function() {
    const formData = {};

    // Initialize form
    initializeForm();
    loadSavedData();
    updateStepIndicator();
    updateNavigation();

    function initializeForm() {
        // Set up event handlers
        $('#nextBtn').on('click', nextStep);
        $('#prevBtn').on('click', prevStep);
        $('#saveBtn').on('click', saveProgress);
        $('#downloadPdfBtn').on('click', generatePDF);
        $('#submitBtn').on('click', submitForm);

        // Set up conditional logic handlers
        setupConditionalLogic();

        // Set up sector handlers
        setupSectorHandlers();

        // Set up revenue calculation
        setupRevenueCalculation();

        // Set up form validation
        setupFormValidation();

        // Set up keyboard navigation
        setupKeyboardNavigation();

        // Set up auto-save
        setupAutoSave();
    }

    // Initialize step indicator click handlers
    $('.step-item').on('click', function() {
        const targetStep = parseInt($(this).data('step'));
        
        // Don't allow navigation to conditional steps if they are not enabled
        if (targetStep >= 14) {
            const aiStep = $('#ai-section').attr('data-section');
            const defiStep = $('#defi-section').attr('data-section');
            const roboticsStep = $('#robotics-section').attr('data-section');
            
            const isValidConditionalStep = 
                (aiStepEnabled && targetStep == aiStep) ||
                (defiStepEnabled && targetStep == defiStep) ||
                (roboticsStepEnabled && targetStep == roboticsStep);
            
            if (!isValidConditionalStep) {
                return;
            }
        }
        
        // Only allow navigation to completed steps or next step
        if (targetStep < currentStep || (targetStep === currentStep + 1 && validateCurrentStep())) {
            currentStep = targetStep;
            showStep(currentStep);
            updateStepIndicator();
            updateNavigation();
        }
    });

    // Show welcome message
    showNotification('Welcome! Your progress will be automatically saved. Use Ctrl+Arrow keys for quick navigation.', 'info');
});