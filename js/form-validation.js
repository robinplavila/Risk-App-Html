/* Form Validation and Revenue Calculation Functions */

function setupRevenueCalculation() {
    $('.revenue-input').on('input', function() {
        let total = 0;
        $('.revenue-input').each(function() {
            const value = parseFloat($(this).val()) || 0;
            total += value;
        });
        
        $('#revenue_total').text(total);
        
        // Validate total
        if (total === 100) {
            $('.revenue-input').removeClass('is-invalid').addClass('is-valid');
            $('#revenue-error').hide();
        } else {
            $('.revenue-input').removeClass('is-valid').addClass('is-invalid');
            $('#revenue-error').show();
        }
    });
}

function setupFormValidation() {
    $('input, textarea, select').on('blur', function() {
        validateField($(this));
    });

    $('input[type="checkbox"][name="sectors[]"]').on('change', function() {
        validateSectors();
    });
}

function validateField($field) {
    const field = $field[0];
    
    if (field.checkValidity()) {
        $field.removeClass('is-invalid').addClass('is-valid');
        return true;
    } else {
        $field.removeClass('is-valid').addClass('is-invalid');
        return false;
    }
}

function validateSectors() {
    const checked = $('input[name="sectors[]"]:checked').length > 0;
    const $inputs = $('input[name="sectors[]"]');
    
    if (checked) {
        $inputs.removeClass('is-invalid').addClass('is-valid');
        return true;
    } else {
        $inputs.removeClass('is-valid').addClass('is-invalid');
        return false;
    }
}

function validateCurrentStep() {
    let isValid = true;
    const $currentSection = $(`.form-section[data-section="${currentStep}"]`);
    
    // Validate fields in current step (only required fields)
    $currentSection.find('input[required], textarea[required], select[required]').each(function() {
        if (!validateField($(this))) {
            isValid = false;
        }
    });

    // Special validation for sectors
    if (currentStep === 1) {
        if (!validateSectors()) {
            isValid = false;
        }
    }

    // Special validation for revenue percentages
    if (currentStep === 3) {
        const revenueTotal = parseFloat($('#revenue_total').text()) || 0;
        if (revenueTotal !== 100) {
            isValid = false;
        }

        // Validate B2B + B2C percentages
        const b2b = parseFloat($('#sales_b2b_percentage').val()) || 0;
        const b2c = parseFloat($('#sales_b2c_percentage').val()) || 0;
        if (b2b + b2c !== 100) {
            isValid = false;
        }
    }

    return isValid;
}