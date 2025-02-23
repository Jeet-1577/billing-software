// Section visibility management
function showSection(sectionName) {
    const sections = ['dashboard', 'items', 'categories', 'customizations', 'settings', 'customization-categories'];
    sections.forEach(section => {
        const element = document.getElementById(`${section}-section`);
        if (element) {
            element.classList.toggle('hidden', section !== sectionName);
        }
    });
}

// Modal management functions
function showAddItemModal() {
    const modal = document.getElementById('addItemModal');
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeAddItemModal() {
    const modal = document.getElementById('addItemModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

// Image preview handling
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Item management functions
function editItem(itemId) {
    // Fetch item details and show edit modal
    fetch(`/manage-items/get/${itemId}/`)
        .then(response => response.json())
        .then(data => {
            // Populate edit form with item data
            // Show edit modal
        })
        .catch(error => console.error('Error:', error));
}

function viewItem(itemId) {
    // Fetch and show item details in a modal
    fetch(`/manage-items/view/${itemId}/`)
        .then(response => response.json())
        .then(data => {
            // Show item details modal
        })
        .catch(error => console.error('Error:', error));
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        fetch(`/manage-items/delete/main_items/${itemId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

// Category management functions
function editCategory(categoryId) {
    // Implementation for editing category
}

function deleteCategory(categoryId) {
    // Implementation for deleting category
}

// Customization management functions
function editCustomization(customizationId) {
    // Implementation for editing customization
}

function deleteCustomization(customizationId) {
    // Implementation for deleting customization
}

// Customization handling
function toggleCustomizationSection() {
    const checkbox = document.getElementById('hasCustomization');
    const section = document.getElementById('customizationSection');
    const selectedSection = document.getElementById('selectedCustomizations');
    
    if (checkbox.checked) {
        section.classList.remove('hidden');
        // Show selected section if there are any selected options
        const selectedOptions = document.querySelectorAll('.customization-checkbox:checked');
        if (selectedOptions.length > 0) {
            selectedSection.classList.remove('hidden');
        }
    } else {
        section.classList.add('hidden');
        selectedSection.classList.add('hidden');
        // Uncheck all options
        document.querySelectorAll('.customization-checkbox:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedCustomizations();
    }
}

function updateSelectedCustomizations() {
    const selectedSection = document.getElementById('selectedCustomizations');
    const listContainer = document.getElementById('selectedCustomizationsList');
    const totalPriceElement = document.getElementById('totalCustomizationPrice');
    
    // Get all checked customizations
    const selectedOptions = document.querySelectorAll('.customization-checkbox:checked');
    
    if (selectedOptions.length > 0) {
        selectedSection.classList.remove('hidden');
        let totalPrice = 0;
        let html = '';
        
        selectedOptions.forEach(option => {
            const price = parseFloat(option.dataset.price);
            totalPrice += price;
            
            html += `
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-300">${option.dataset.name}</span>
                    <span class="text-emerald-400">+₹${price.toFixed(2)}</span>
                </div>
            `;
        });
        
        listContainer.innerHTML = html;
        totalPriceElement.textContent = `₹${totalPrice.toFixed(2)}`;
    } else {
        selectedSection.classList.add('hidden');
        listContainer.innerHTML = '';
        totalPriceElement.textContent = '₹0.00';
    }
}

function toggleCustomizationButton() {
    const checkbox = document.getElementById('hasCustomization');
    const button = document.getElementById('customizationButton');
    
    if (checkbox.checked) {
        button.classList.remove('hidden');
    } else {
        button.classList.add('hidden');
        // Clear all selected customizations
        document.querySelectorAll('.customization-checkbox').forEach(cb => {
            cb.checked = false;
        });
        updateCustomizationCount();
    }
}

function showCustomizationModal() {
    const modal = document.getElementById('customizationModal');
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeCustomizationModal() {
    const modal = document.getElementById('customizationModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function updateCustomizationCount() {
    const selectedOptions = document.querySelectorAll('.customization-checkbox:checked');
    const count = selectedOptions.length;
    
    // Update count in main form button
    const countBadge = document.getElementById('selectedOptionsCount');
    countBadge.textContent = count > 0 ? count : '';
    
    // Update count in modal
    const modalCount = document.getElementById('modalSelectedCount');
    modalCount.textContent = count;
}

function confirmCustomizations() {
    updateCustomizationCount();
    closeCustomizationModal();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Show dashboard by default
    showSection('dashboard');

    // Add Item form submission
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        // Remove the old event listener first
        const newAddItemForm = addItemForm.cloneNode(true);
        addItemForm.parentNode.replaceChild(newAddItemForm, addItemForm);
        
        // Add single event listener to the new form
        newAddItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get the submit button
            const submitButton = this.querySelector('button[type="submit"]');
            
            // Check if the form is already being submitted
            if (submitButton.disabled) {
                console.log('Form submission in progress...');
                return;
            }
            
            // Disable the submit button
            submitButton.disabled = true;
            
            try {
                const formData = new FormData(this);
                
                const response = await fetch('/manage-items/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new TypeError("Received non-JSON response from server");
                }

                const data = await response.json();
                console.log('Server response:', data);

                if (data.status === 'success') {
                    showToast('Item added successfully', 'success');
                    closeAddItemModal();
                    // Use timeout to ensure modal is closed before reload
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
                    showToast(data.message || 'Error adding item', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error adding item: ' + error.message, 'error');
            } finally {
                // Re-enable the submit button after 1 second
                setTimeout(() => {
                    submitButton.disabled = false;
                }, 1000);
            }
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchQuery = this.value.toLowerCase();
            // Implement search functionality
        }, 300));
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            // Implement category filtering
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            // Implement sorting
        });
    }
});

// Separate the form submission handler function
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get the submit button and disable it immediately
    const submitButton = this.querySelector('button[type="submit"]');
    if (submitButton.disabled) {
        return; // Prevent double submission
    }
    submitButton.disabled = true;
    
    try {
        const formData = new FormData(this);
        
        // Get selected customization options
        if (formData.get('has_customization') === 'on') {
            const selectedOptions = Array.from(document.querySelectorAll('.customization-checkbox:checked'))
                .map(checkbox => checkbox.value);
            formData.append('customization_options', JSON.stringify(selectedOptions));
        }

        const response = await fetch('/manage-items/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (data.status === 'success') {
            showToast('Item added successfully', 'success');
            closeAddItemModal();
            // Use a small timeout before reloading to ensure the modal is closed
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } else {
            showToast(data.message || 'Error adding item', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error adding item. Please try again.', 'error');
    } finally {
        // Re-enable the submit button after a short delay
        setTimeout(() => {
            submitButton.disabled = false;
        }, 1000);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } transition-opacity duration-300`;
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
