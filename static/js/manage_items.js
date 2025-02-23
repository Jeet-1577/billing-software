// Section visibility management
function setCurrentSection(sectionName) {
    localStorage.setItem('currentSection', sectionName);
}

function getCurrentSection() {
    return localStorage.getItem('currentSection') || 'dashboard';
}

function showSection(sectionName) {
    const sections = ['dashboard', 'items', 'categories', 'customizations', 'settings', 'customization-categories'];
    sections.forEach(section => {
        const element = document.getElementById(`${section}-section`);
        if (element) {
            element.classList.toggle('hidden', section !== sectionName);
        }
    });
    setCurrentSection(sectionName); // Save current section
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
let currentCustomizations = [];

function editItem(itemId) {
    fetch(`/manage-items/get/${itemId}/`)
        .then(response => response.json())
        .then(data => {
            // Populate form with item data
            document.getElementById('editItemId').value = itemId;
            document.getElementById('editItemName').value = data.name;
            document.getElementById('editItemCategory').value = data.category_id;
            document.getElementById('editItemPrice').value = data.price;
            document.getElementById('editItemShortCode').value = data.short_code || '';

            // Show modal
            const modal = document.getElementById('editItemModal');
            const content = modal.querySelector('.transform');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 10);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading item details', 'error');
        });
}

function closeEditItemModal() {
    const modal = document.getElementById('editItemModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function viewItem(itemId) {
    fetch(`/manage-items/get/${itemId}/`)
        .then(response => response.json())
        .then(data => {
            // Populate modal with item data
            document.getElementById('viewItemImage').src = data.image_url || '/static/images/default-item.png';
            document.getElementById('viewItemName').textContent = data.name;
            document.getElementById('viewItemCategory').textContent = data.category;
            document.getElementById('viewItemPrice').textContent = `₹${data.price}`;
            document.getElementById('viewItemShortCode').textContent = data.short_code || 'N/A';
            document.getElementById('viewItemGST').textContent = `CGST: ${data.cgst}% | SGST: ${data.sgst}%`;
            document.getElementById('viewItemDate').textContent = new Date(data.created_at).toLocaleDateString();

            // Handle customizations button
            const customizationsButton = document.getElementById('viewItemCustomizationsButton');
            if (data.has_customization && data.customization_options?.length > 0) {
                currentCustomizations = data.customization_options;
                customizationsButton.classList.remove('hidden');
                document.getElementById('viewItemCustomizationsCount').textContent = data.customization_options.length;
            } else {
                customizationsButton.classList.add('hidden');
                currentCustomizations = [];
            }

            // Show modal
            const modal = document.getElementById('viewItemModal');
            const content = modal.querySelector('.transform');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 10);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading item details', 'error');
        });
}

function closeViewItemModal() {
    const modal = document.getElementById('viewItemModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
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

function showItemCustomizations() {
    // Populate and show customizations modal
    const customizationsList = document.getElementById('customizationsList');
    customizationsList.innerHTML = currentCustomizations.map(opt => `
        <div class="bg-gray-700 rounded-lg p-4">
            <div class="flex justify-between items-center">
                <span class="text-white font-medium">${opt.name}</span>
                <span class="text-emerald-400">+₹${opt.price}</span>
            </div>
        </div>
    `).join('');

    const modal = document.getElementById('customizationsModal');
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeCustomizationsModal() {
    const modal = document.getElementById('customizationsModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

// Add this new function
function sortItems(sortType) {
    const itemsContainer = document.querySelector('#items-section .grid');
    const items = Array.from(itemsContainer.children);

    items.sort((a, b) => {
        if (sortType === 'name') {
            const nameA = a.querySelector('h3').textContent.trim().toLowerCase();
            const nameB = b.querySelector('h3').textContent.trim().toLowerCase();
            return nameA.localeCompare(nameB);
        } else if (sortType === 'price') {
            const priceA = parseFloat(a.querySelector('.text-emerald-400').textContent.replace('₹', ''));
            const priceB = parseFloat(b.querySelector('.text-emerald-400').textContent.replace('₹', ''));
            return priceB - priceA; // Sort by price high to low
        } else if (sortType === 'recent') {
            const dateA = new Date(a.querySelector('.text-xs.text-gray-500').textContent);
            const dateB = new Date(b.querySelector('.text-xs.text-gray-500').textContent);
            return dateB - dateA; // Sort by date newest first
        }
        return 0;
    });

    // Clear and re-append sorted items
    itemsContainer.innerHTML = '';
    items.forEach(item => itemsContainer.appendChild(item));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Restore last active section or use URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    const lastSection = sectionParam || getCurrentSection();
    showSection(lastSection || 'dashboard');

    // Update the section buttons click handlers
    document.querySelectorAll('[data-section]').forEach(button => {
        button.addEventListener('click', () => {
            const sectionName = button.getAttribute('data-section');
            showSection(sectionName);
        });
    });

    // Add Item form submission
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        // Remove the old event listener first
        const newAddItemForm = addItemForm.cloneNode(true);
        addItemForm.parentNode.replaceChild(newAddItemForm, addItemForm);
        
        // Add single event listener to the new form
        newAddItemForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Search functionality
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchQuery = this.value.toLowerCase();
            // Implement search functionality
        }, 300));
    }

    // Category filter - Updated implementation
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            const itemsContainer = document.querySelector('#items-section .grid');
            const items = Array.from(itemsContainer.children);

            items.forEach(item => {
                if (!item.classList.contains('col-span-full')) {  // Skip the empty state message
                    const itemCategory = item.querySelector('.text-gray-400 .truncate')?.textContent;
                    const shouldShow = !selectedCategory || getCategoryNameById(selectedCategory) === itemCategory;
                    item.classList.toggle('hidden', !shouldShow);
                }
            });

            // Show empty state if no items are visible
            const visibleItems = items.filter(item => !item.classList.contains('hidden'));
            const emptyState = itemsContainer.querySelector('.col-span-full');
            if (emptyState) {
                emptyState.classList.toggle('hidden', visibleItems.length > 0);
            }
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            const selectedSort = this.value;
            sortItems(selectedSort);
        });
    }

    // Add edit form submission handler
    const editItemForm = document.getElementById('editItemForm');
    if (editItemForm) {
        editItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('form_type', 'main_items');

            try {
                const response = await fetch('/manage-items/update/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });

                const data = await response.json();
                if (data.status === 'success') {
                    showToast('Item updated successfully', 'success');
                    closeEditItemModal();
                    window.location.reload();
                } else {
                    showToast(data.message || 'Error updating item', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error updating item', 'error');
            }
        });
    }
});

// Add this helper function to get category name from ID
function getCategoryNameById(categoryId) {
    const categorySelect = document.getElementById('categoryFilter');
    const option = categorySelect.querySelector(`option[value="${categoryId}"]`);
    return option ? option.textContent : '';
}

// Separate the form submission handler function
async function handleFormSubmit(e) {
    e.preventDefault();
    
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
            
            // Store the current section before reload
            const currentSection = getCurrentSection();
            
            // Reload and restore section
            window.location.href = window.location.pathname + '?section=' + currentSection;
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
