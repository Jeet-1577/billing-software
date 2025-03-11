document.addEventListener('DOMContentLoaded', function() {
    initializeWizard();
    initializeFormValidation();
    initializeSidebar();
    initializeFileUpload();
    initializeFormSubmissions();
});

function initializeWizard() {
    const steps = document.querySelectorAll('.step-content');
    const indicators = document.querySelectorAll('.step-indicator');
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    let currentStep = 1;

    function updateSteps(newStep) {
        // Hide all steps
        steps.forEach(step => step.classList.add('hidden'));
        
        // Show current step
        const currentContent = document.querySelector(`.step-content[data-step="${newStep}"]`);
        currentContent.classList.remove('hidden');
        currentContent.classList.add('active');

        // Update indicators
        indicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            if (stepNum === newStep) {
                indicator.classList.add('active');
            } else if (stepNum < newStep) {
                indicator.classList.add('completed');
            }
        });

        // Update buttons
        prevBtn.disabled = newStep === 1;
        if (newStep === steps.length) {
            nextBtn.textContent = 'Save All';
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    // Navigation event listeners
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateSteps(currentStep);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length) {
            if (validateStep(currentStep)) {
                currentStep++;
                updateSteps(currentStep);
            }
        } else {
            saveAllSettings();
        }
    });

    // Initialize first step
    updateSteps(1);
}

function validateStep(step) {
    const currentForm = document.querySelector(`.step-content[data-step="${step}"] form`);
    if (!currentForm) return true;

    // Add your validation logic here
    return true;
}

function saveAllSettings() {
    const forms = document.querySelectorAll('form');
    const allData = new FormData();
    
    forms.forEach(form => {
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            allData.append(key, value);
        }
    });

    // Send all settings to server
    fetch('/api/settings/save-all/', {
        method: 'POST',
        body: allData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('success', 'All settings saved successfully');
        } else {
            showNotification('error', data.message || 'Error saving settings');
        }
    })
    .catch(error => {
        showNotification('error', 'An error occurred while saving settings');
    });
}

function initializeSidebar() {
    const links = document.querySelectorAll('.setting-link');
    const panels = document.querySelectorAll('.settings-panel');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active states
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            notification.remove();
        }, 300);
    }, 3000);
}
