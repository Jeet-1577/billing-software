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
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.status === 'success' && data.item) {
                const item = data.item;
                // Populate form with item data
                document.getElementById('editItemForm').querySelector('input[name="id"]').value = item.id;
                document.getElementById('editItemForm').querySelector('input[name="name"]').value = item.name;
                document.getElementById('editItemForm').querySelector('select[name="category"]').value = item.category_id;
                document.getElementById('editItemForm').querySelector('input[name="price"]').value = item.price;
                document.getElementById('editItemForm').querySelector('input[name="cost"]').value = item.cost;
                document.getElementById('editItemForm').querySelector('input[name="short_code"]').value = item.short_code;
                document.getElementById('editItemForm').querySelector('input[name="cgst"]').value = item.cgst;
                document.getElementById('editItemForm').querySelector('input[name="sgst"]').value = item.sgst;

                // Handle customizations
                const hasCustomizationCheckbox = document.getElementById('editItemForm').querySelector('input[name="has_customization"]');
                hasCustomizationCheckbox.checked = item.has_customization;

                // Show modal
                const modal = document.getElementById('editItemModal');
                const content = modal.querySelector('.transform');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 10);
            } else {
                throw new Error(data.message || 'Failed to load item details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading item details: ' + error.message, 'error');
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
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.status === 'success' && data.item) {
                const item = data.item;
                
                // Populate basic item details
                document.getElementById('viewItemImage').src = item.image_url || '/static/images/default-item.png';
                document.getElementById('viewItemName').textContent = item.name;
                document.getElementById('viewItemCategory').textContent = item.category;
                document.getElementById('viewItemPrice').textContent = `₹${item.price}`;
                document.getElementById('viewItemShortCode').textContent = item.short_code || 'N/A';
                document.getElementById('viewItemGST').textContent = `CGST: ${item.cgst}% | SGST: ${item.sgst}%`;
                document.getElementById('viewItemDate').textContent = new Date(item.created_at).toLocaleDateString();

                // Handle customizations visibility
                const wrapper = document.getElementById('viewItemCustomizationsWrapper');
                const button = document.getElementById('viewItemCustomizationsButton');
                
                // Store customizations for later use
                currentCustomizations = item.customization_options || [];
                
                // Show/hide customizations section based on item properties
                if (item.has_customization && currentCustomizations.length > 0) {
                    wrapper.classList.remove('hidden');
                    document.getElementById('viewItemCustomizationsCount').textContent = currentCustomizations.length;
                } else {
                    wrapper.classList.add('hidden');
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
            } else {
                throw new Error(data.message || 'Failed to load item details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading item details: ' + error.message, 'error');
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
    if (!customizationId) {
        console.error('No customization ID provided');
        showToast('Error: Invalid customization ID', 'error');
        return;
    }

    // Show loading spinner or indicator if needed
    showToast('Loading...', 'info');

    fetch(`/manage-items/get-customization/${customizationId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success' && data.customization) {
                const form = document.getElementById('editCustomizationForm');
                if (!form) {
                    throw new Error('Edit form not found');
                }

                // Set form values
                form.querySelector('input[name="id"]').value = data.customization.id;
                form.querySelector('input[name="name"]').value = data.customization.name;
                form.querySelector('input[name="price"]').value = data.customization.price;
                form.querySelector('select[name="category"]').value = data.customization.category_id;

                // Show modal
                const modal = document.getElementById('editCustomizationModal');
                const content = modal.querySelector('.transform');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 10);
            } else {
                throw new Error(data.message || 'Invalid response format');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error loading customization details: ' + error.message, 'error');
        });
}

function showEditCustomizationModal() {
    const modal = document.getElementById('editCustomizationModal');
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
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
    const modal = document.getElementById('customizationsListModal');
    const content = modal.querySelector('.transform');
    const list = document.getElementById('customizationsList');

    if (!modal || !content || !list) {
        console.error('Required modal elements not found');
        return;
    }

    // Clear previous content
    list.innerHTML = currentCustomizations.map(opt => `
        <div class="py-3 first:pt-0 last:pb-0 border-b border-gray-700 last:border-0">
            <div class="flex justify-between items-center">
                <div>
                    <span class="text-white font-medium">${opt.name}</span>
                    <span class="text-gray-400 text-sm ml-2">(${opt.category})</span>
                </div>
                <span class="text-emerald-400">+₹${opt.price}</span>
            </div>
        </div>
    `).join('');

    // Show modal with animation
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeItemCustomizations() {
    const modal = document.getElementById('customizationsListModal');
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

// Category Modal Functions
function showAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

// Add this new function
function showEditCategoryModal(categoryId, categoryName) {
    const modal = document.getElementById('editCategoryModal');
    const form = document.getElementById('editCategoryForm');
    
    // Set form values
    form.querySelector('input[name="id"]').value = categoryId;
    form.querySelector('input[name="name"]').value = categoryName;
    
    // Show modal
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeEditCategoryModal() {
    const modal = document.getElementById('editCategoryModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category? All items in this category will be affected.')) {
        fetch(`/manage-items/delete/category/${categoryId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Category deleted successfully', 'success');
                window.location.reload();
            } else {
                showToast(data.message || 'Error deleting category', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error deleting category', 'error');
        });
    }
}

// Customization Modal Functions
function showAddCustomizationModal() {
    const modal = document.getElementById('addCustomizationModal');
    const content = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeAddCustomizationModal() {
    const modal = document.getElementById('addCustomizationModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function showEditCustomizationModal(customizationId) {
    fetch(`/manage-items/get-customization/${customizationId}/`)
        .then(response => response.json())
        .then(data => {
            const form = document.getElementById('editCustomizationForm');
            form.querySelector('input[name="id"]').value = data.id;
            form.querySelector('input[name="name"]').value = data.name;
            form.querySelector('input[name="price"]').value = data.price;
            form.querySelector('select[name="category"]').value = data.category_id;

            const modal = document.getElementById('editCustomizationModal');
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
            showToast('Error loading customization details', 'error');
        });
}

function closeEditCustomizationModal() {
    const modal = document.getElementById('editCustomizationModal');
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function deleteCustomization(customizationId) {
    if (confirm('Are you sure you want to delete this customization?')) {
        fetch(`/manage-items/delete/customization/${customizationId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast('Customization deleted successfully', 'success');
                window.location.reload();
            } else {
                showToast(data.message || 'Error deleting customization', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error deleting customization', 'error');
        });
    }
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
    
    // Search functionality - Updated implementation
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchQuery = this.value.toLowerCase().trim();
            
            // Only process search if we're in the items section
            if (getCurrentSection() !== 'items') return;
            
            const itemsContainer = document.querySelector('#items-section .grid');
            if (!itemsContainer) return;
            
            const items = Array.from(itemsContainer.children).filter(
                item => !item.classList.contains('col-span-full')
            );

            let hasVisibleItems = false;

            items.forEach(item => {
                // Updated selectors to match your exact HTML structure
                const itemName = item.querySelector('.line-clamp-1')?.textContent.toLowerCase() || '';
                const shortCodeElement = item.querySelector('.fa-barcode')?.closest('.flex')?.textContent.trim().toLowerCase() || '';
                const categoryName = item.querySelector('.truncate')?.textContent.toLowerCase() || '';

                // Check if any field matches the search query
                const matches = 
                    itemName.includes(searchQuery) || 
                    shortCodeElement.includes(searchQuery) || 
                    categoryName.includes(searchQuery);

                item.classList.toggle('hidden', !matches);
                if (matches) hasVisibleItems = true;
            });

            // Handle empty state
            const emptyState = itemsContainer.querySelector('.col-span-full') || 
                             createEmptyStateElement(itemsContainer);

            if (!hasVisibleItems && searchQuery !== '') {
                emptyState.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                        <i class="fas fa-search text-4xl mb-4"></i>
                        <p class="text-lg">No items found matching "${searchQuery}"</p>
                    </div>
                `;
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.toggle('hidden', hasVisibleItems);
            }
        }, 300));

        // Add focus shortcut
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
            }
        });
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

    // Category form submission handler
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/manage-items/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();
                
                if (data.status === 'success') {
                    showToast('Category added successfully', 'success');
                    closeAddCategoryModal();
                    window.location.reload();
                } else {
                    showToast(data.message || 'Error adding category', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error adding category', 'error');
            }
        });
    }

    // Edit category form submission handler
    const editCategoryForm = document.getElementById('editCategoryForm');
    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('form_type', 'category');
            
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
                    showToast('Category updated successfully', 'success');
                    closeEditCategoryModal();
                    window.location.reload();
                } else {
                    showToast(data.message || 'Error updating category', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error updating category', 'error');
            }
        });
    }

    // Add customization form submission handler
    const addCustomizationForm = document.getElementById('addCustomizationForm');
    if (addCustomizationForm) {
        addCustomizationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/manage-items/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();
                
                if (data.status === 'success') {
                    showToast('Customization added successfully', 'success');
                    closeAddCustomizationModal();
                    window.location.reload();
                } else {
                    showToast(data.message || 'Error adding customization', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error adding customization', 'error');
            }
        });
    }

    // Edit customization form submission handler
    const editCustomizationForm = document.getElementById('editCustomizationForm');
    if (editCustomizationForm) {
        editCustomizationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('form_type', 'customization');
            
            try {
                const response = await fetch('/manage-items/update/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();
                
                if (data.status === 'success') {
                    showToast('Customization updated successfully', 'success');
                    closeEditCustomizationModal();
                    window.location.reload();
                } else {
                    showToast(data.message || 'Error updating customization', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Error updating customization', 'error');
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
        formData.append('form_type', 'main_items');  // Make sure this line is present
        
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

// Helper function to create empty state element
function createEmptyStateElement(container) {
    const emptyState = document.createElement('div');
    emptyState.className = 'col-span-full';
    container.appendChild(emptyState);
    return emptyState;
}
