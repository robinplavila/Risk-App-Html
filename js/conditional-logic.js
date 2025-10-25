/* Conditional Logic for Form Fields */

function setupConditionalLogic() {
    // Employees outside Canada conditional logic
    $('input[name="employees_outside_canada"]').on('change', function() {
        const $details = $('#employees_outside_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('textarea').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('textarea').attr('required', false).val('');
        }
    });

    // Mergers/acquisitions conditional logic
    $('input[name="mergers_acquisitions"]').on('change', function() {
        const $details = $('#mergers_details');
        if ($(this).val() === 'yes') {
            $details.slideDown(400);
        } else {
            $details.slideUp(400);
            $('#mergers_description').val('');
        }
    });

    // Business structure change conditional logic
    $('input[name="business_structure_change"]').on('change', function() {
        const $details = $('#structure_change_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('textarea').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('textarea').attr('required', false).val('');
        }
    });

    // Tangible products conditional logic
    $('input[name="sell_tangible_products"]').on('change', function() {
        const $details = $('#tangible_products_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('textarea').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('textarea, input').attr('required', false).val('');
        }
    });

    // Hardware installation conditional logic
    $('input[name="install_hardware"]').on('change', function() {
        const $details = $('#hardware_installation_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('input').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('input').attr('required', false).val('');
        }
    });

    // Hosting services conditional logic
    $('input[name="hosting_services"]').on('change', function() {
        const $details = $('#hosting_services_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('input[name="hosting_infrastructure"]').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('input, textarea').attr('required', false).val('');
            $('#third_party_hosting_details').removeClass('show').hide();
        }
    });

    // Third party hosting conditional logic
    $('input[name="hosting_infrastructure"]').on('change', function() {
        const $details = $('#third_party_hosting_details');
        if ($(this).val() === 'third_party') {
            $details.addClass('show').slideDown(400);
            $details.find('input').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('input').attr('required', false).val('');
        }
    });

    // AI/ML tools conditional logic
    $('input[name="ai_ml_usage"]').on('change', function() {
        const $details = $('#ai_ml_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('textarea').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('textarea').attr('required', false).val('');
        }
    });

    // Managed IT services conditional logic
    $('input[name="managed_it_services"]').on('change', function() {
        const $details = $('#managed_it_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('input').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('input').attr('required', false).val('');
        }
    });

    // High-risk areas conditional logic (dropdowns - legacy)
    $('.high-risk-select').on('change', function() {
        const detailsName = $(this).data('details');
        const $detailsInput = $(`input[name="${detailsName}"]`);
        
        if ($(this).val() === 'yes') {
            $detailsInput.prop('disabled', false).attr('required', true);
            $detailsInput.closest('td').removeClass('text-muted');
        } else {
            $detailsInput.prop('disabled', true).attr('required', false).val('');
            $detailsInput.closest('td').addClass('text-muted');
        }
    });

    // High-risk areas conditional logic (radio buttons)
    $('.high-risk-radio').on('change', function() {
        const detailsName = $(this).data('details');
        const $detailsInput = $(`input[name="${detailsName}"]`);
        
        if ($(this).val() === 'yes' && $(this).is(':checked')) {
            $detailsInput.prop('disabled', false).attr('required', true);
            $detailsInput.closest('td').removeClass('text-muted');
        } else if ($(this).val() === 'no' && $(this).is(':checked')) {
            $detailsInput.prop('disabled', true).attr('required', false).val('');
            $detailsInput.closest('td').addClass('text-muted');
        }
    });

    // Single client 5% revenue conditional logic
    $('input[name="single_client_5_percent"]').on('change', function() {
        const $details = $('#client_5_percent_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
            $details.find('textarea').attr('required', true);
        } else {
            $details.removeClass('show').slideUp(400);
            $details.find('textarea').attr('required', false).val('');
        }
    });

    // Section 5: Contractual Controls conditional logic
    
    // Terms of service liability conditional logic
    $('input[name="liability_tos_only"]').on('change', function() {
        const $details = $('#liability_tos_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            $('input[name="tos_customer_agreement"]').prop('checked', false);
        }
    });

    // Written contract 100% conditional logic
    $('input[name="written_contract_100"]').on('change', function() {
        const $details = $('#written_contract_percentage');
        if ($(this).val() === 'no') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            $('#contract_percentage').val('');
        }
    });

    // Subcontract services conditional logic
    $('input[name="subcontract_services"]').on('change', function() {
        const $details = $('#subcontract_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            $('#subcontract_revenue_percentage').val('');
        }
    });
    
    // Section 6: Cybersecurity conditional logic
    
    // Vulnerability scans conditional logic
    $('input[name="vulnerability_scans"]').on('change', function() {
        const $details = $('#vulnerability_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            $('#vulnerability_frequency_methods').val('');
        }
    });

    // Financial approval conditional logic
    $('input[name="financial_approval"]').on('change', function() {
        const $details = $('#financial_approval_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            $('#financial_approval_process').val('');
        }
    });

    // Section 7: Data Backup & Business Continuity conditional logic
    
    // Third party reliance conditional logic
    $('input[name="third_party_reliance"]').on('change', function() {
        const $details = $('#third_party_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            $('#key_suppliers').val('');
            $('input[name="slas_in_place"]').prop('checked', false);
        }
    });

    // B2B + B2C percentage validation
    $('#sales_b2b_percentage, #sales_b2c_percentage').on('input', function() {
        const b2b = parseFloat($('#sales_b2b_percentage').val()) || 0;
        const b2c = parseFloat($('#sales_b2c_percentage').val()) || 0;
        const total = b2b + b2c;
        
        if (total === 100) {
            $('#sales_b2b_percentage, #sales_b2c_percentage').removeClass('is-invalid').addClass('is-valid');
        } else {
            $('#sales_b2b_percentage, #sales_b2c_percentage').removeClass('is-valid').addClass('is-invalid');
        }
    });

    // Section 9: Privacy, Data Security & API Controls conditional logic
    
    // Customer data collection conditional logic
    $('input[name="collect_customer_data"]').on('change', function() {
        const $details = $('#customer_data_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            // Clear all data type checkboxes and record counts
            $('input[name="data_types[]"]').prop('checked', false);
            $('input[name$="_records"]').val('');
            // Hide all sub-details
            $('.col-md-6 div[id$="_details"]').slideUp(200);
        }
    });

    // Data type checkboxes conditional logic
    $('input[name="data_types[]"]').on('change', function() {
        const dataType = $(this).val();
        const $details = $(`#${dataType}_details`);
        if ($(this).is(':checked')) {
            $details.slideDown(300);
        } else {
            $details.slideUp(300);
            $(`#${dataType}_records`).val('');
        }
    });

    // Section 10: Intellectual Property & Content Governance Controls conditional logic
    
    // Original media publishing conditional logic
    $('input[name="publish_original_media"]').on('change', function() {
        const $details = $('#original_media_details');
        if ($(this).val() === 'yes') {
            $details.addClass('show').slideDown(400);
        } else {
            $details.removeClass('show').slideUp(400);
            // Clear all sub-fields
            $('#media_description').val('');
            $('input[name="content_risk_review"]').prop('checked', false);
            $('input[name="attorney_supervised_review"]').prop('checked', false);
        }
    });

    // IP protection steps conditional logic
    $('input[name="ip_protection_steps[]"]').on('change', function() {
        if ($(this).val() === 'other_ip_protections') {
            const $details = $('#other_ip_protections_details');
            if ($(this).is(':checked')) {
                $details.slideDown(300);
            } else {
                $details.slideUp(300);
                $('#other_ip_protections_text').val('');
            }
        }
    });
}