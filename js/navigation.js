/* Navigation and Step Management Functions */

function nextStep() {
    if (!validateCurrentStep()) {
        showNotification('Please fill in all fields correctly before proceeding.', 'error');
        return;
    }

    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        updateStepIndicator();
        updateNavigation();
        saveProgress();
        
        // Scroll to top
        $('html, body').animate({ scrollTop: 0 }, 300);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateStepIndicator();
        updateNavigation();
        
        // Scroll to top
        $('html, body').animate({ scrollTop: 0 }, 300);
    }
}

function showStep(step) {
    $('.form-section').removeClass('active');
    const $targetSection = $(`.form-section[data-section="${step}"]`);
    $targetSection.addClass('active');
    
    // For conditional sections, remove inline display:none to allow CSS to take effect
    if (step >= 14) {
        $targetSection.css('display', '');
    }
}

function updateStepIndicator() {
    $('.step-item').each(function() {
        const stepNum = parseInt($(this).data('step'));
        
        if (stepNum < currentStep) {
            $(this).addClass('completed').removeClass('active');
        } else if (stepNum === currentStep) {
            $(this).addClass('active').removeClass('completed');
        } else {
            $(this).removeClass('active completed');
        }
    });

    $('#currentStep').text(currentStep);
    $('#totalSteps').text(totalSteps);
}

function updateNavigation() {
    // Previous button
    if (currentStep === 1) {
        $('#prevBtn').hide();
    } else {
        $('#prevBtn').show();
    }

    // Next/Submit button
    if (currentStep === totalSteps) {
        $('#nextBtn').hide();
        $('#submitBtn').show();
    } else {
        $('#nextBtn').show();
        $('#submitBtn').hide();
    }
}

function setupKeyboardNavigation() {
    $(document).on('keydown', function(e) {
        if (e.ctrlKey) {
            if (e.key === 'ArrowRight' && currentStep < totalSteps) {
                e.preventDefault();
                nextStep();
            } else if (e.key === 'ArrowLeft' && currentStep > 1) {
                e.preventDefault();
                prevStep();
            }
        }
    });
}

function setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(saveProgress, 30000);

    // Save on form field changes
    $('input, textarea, select').on('change', function() {
        setTimeout(saveProgress, 1000);
    });
}

function saveProgress() {
    try {
        const data = {
            currentStep: currentStep,
            formData: $('#insuranceForm').serializeArray(),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('axisInsuranceForm', JSON.stringify(data));
        
        // Show brief save indicator
        const $saveBtn = $('#saveBtn');
        const originalText = $saveBtn.text();
        $saveBtn.text('✓ Saved').addClass('btn-success').removeClass('btn-outline-primary');
        
        setTimeout(() => {
            $saveBtn.text(originalText).removeClass('btn-success').addClass('btn-outline-primary');
        }, 2000);
        
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

function loadSavedData() {
    try {
        const saved = localStorage.getItem('axisInsuranceForm');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Restore form data
            data.formData.forEach(field => {
                const $element = $(`[name="${field.name}"]`);
                if ($element.attr('type') === 'checkbox' || $element.attr('type') === 'radio') {
                    if (field.value) {
                        $element.filter(`[value="${field.value}"]`).prop('checked', true);
                    }
                } else {
                    $element.val(field.value);
                }
            });

            // Restore current step
            currentStep = data.currentStep || 1;
            showStep(currentStep);
            updateStepIndicator();
            updateNavigation();

            // Trigger conditional logic
            setTimeout(() => {
                $('input[name="employees_outside_canada"]:checked').trigger('change');
                $('input[name="business_structure_change"]:checked').trigger('change');
                $('input[name="mergers_acquisitions"]:checked').trigger('change');
                $('input[name="sell_tangible_products"]:checked').trigger('change');
                $('.high-risk-select').trigger('change');
                $('.high-risk-radio:checked').trigger('change');
                $('.revenue-input').trigger('input');
                
                // Trigger conditional section logic
                $('input[name="sectors[]"]').trigger('change');
            }, 100);

            showNotification('Previous progress restored.', 'success');
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function submitForm() {
    if (!validateCurrentStep()) {
        showNotification('Please complete all required fields before submitting.', 'error');
        return;
    }

    showNotification('Form submitted successfully! Thank you for your submission.', 'success');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    $('.notification').remove();
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type];

    const $notification = $(`
        <div class="notification alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);

    $('body').append($notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        $notification.alert('close');
    }, 5000);
}