document.addEventListener('DOMContentLoaded', function() {
    const selectedTable = localStorage.getItem('selectedTable');
    if (selectedTable) {
        document.getElementById('selectedTable').innerText = `Table: ${selectedTable.replace('table-', '')}`;
    }

    const orderData = localStorage.getItem('orderData');
    if (orderData) {
        const orders = JSON.parse(orderData);
        loadOrderToSidebar(orders);
        localStorage.removeItem('orderData');
    }

    var sidebar = document.getElementById('sidebar');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var searchInput = document.getElementById('searchInput');
    var itemsContainer = document.getElementById('itemsContainer');
    var selectionSidebar = document.getElementById('selectionSidebar');
    var selectedItemsList = document.getElementById('selectedItemsList');
    var mainContent = document.getElementById('mainContent');

    searchInput.addEventListener('input', function() {
        var searchQuery = searchInput.value.toLowerCase();
        fetch(`/inventory/?search=${searchQuery}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            itemsContainer.innerHTML = '';
            data.items.forEach(function(item) {
                var itemCube = document.createElement('div');
                itemCube.classList.add('item-cube');
                itemCube.setAttribute('data-item-id', item.id);
                itemCube.setAttribute('data-item-name', item.name);
                itemCube.setAttribute('data-item-price', item.price);
                itemCube.setAttribute('data-item-code', item.short_code);
                itemCube.setAttribute('data-has-customization', item.has_customization);
                if (item.has_customization) {
                    itemCube.setAttribute('data-customization-options', JSON.stringify(item.customization_options));
                }
                itemCube.innerHTML = `
                    <h3 class="text-xl font-bold mb-2">${item.name}</h3>
                    <img src="${item.image}" alt="${item.name}">
                `;
                itemCube.addEventListener('click', function() {
                    selectItem(this);
                });
                itemsContainer.appendChild(itemCube);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching items.');
        });
    });

    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            var firstItem = itemsContainer.querySelector('.item-cube');
            if (firstItem) {
                selectItem(firstItem);
            }
        }
    });

    // Shortcut key to focus on the search bar
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            searchInput.focus();
        }
    });

    function updateSidebar() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        selectedItemsList.innerHTML = '';
        var selectedIds = [];
        var totalAmount = 0;

        if (selectedItems.length > 0) {
            selectionSidebar.classList.add('open');
        } else {
            selectionSidebar.classList.remove('open');
        }

        for (var i = 0; i < selectedItems.length; i++) {
            var item = selectedItems[i];
            var itemId = item.getAttribute('data-item-id');
            var itemName = item.getAttribute('data-item-name');
            var basePrice = parseFloat(item.getAttribute('data-item-price'));
            var customizations = [];
            var customizationPrice = 0;

            if (item.hasAttribute('data-selected-customizations')) {
                customizations = JSON.parse(item.getAttribute('data-selected-customizations'));
                customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
            }

            var totalItemPrice = basePrice + customizationPrice;
            var uniqueItemId = itemId + '-' + btoa(JSON.stringify(customizations));
            selectedIds.push(uniqueItemId);

            var listItem = document.createElement('li');
            listItem.classList.add('selected-item-box', 'bg-gray-600', 'p-2', 'rounded', 'shadow', 'flex', 'flex-col');

            const quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
            const initialQuantity = quantityElement ? parseInt(quantityElement.textContent) : 1;

            listItem.innerHTML = `
                <div class="selected-item-content">
                    <div class="selected-item-header">
                        <div class="flex items-center gap-2">
                            <button type="button" 
                                    onclick="removeItem('${uniqueItemId}')" 
                                    class="text-gray-400 hover:text-red-500 transition-all"
                                    aria-label="Remove ${itemName}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h4 class="text-sm font-semibold">${itemName}</h4>
                        </div>
                        <div class="flex items-center gap-2">
                            <p id="price-${uniqueItemId}" class="text-sm">₹${(totalItemPrice * initialQuantity).toFixed(2)}</p>
                            <div class="item-counter flex items-center space-x-1">
                                <button type="button" 
                                        onclick="decreaseQuantity('${uniqueItemId}', ${totalItemPrice})" 
                                        aria-label="Decrease quantity">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
                                    </svg>
                                </button>
                                <span id="quantity-${uniqueItemId}" class="w-4 text-center">${initialQuantity}</span>
                                <button type="button" 
                                        onclick="increaseQuantity('${uniqueItemId}', ${totalItemPrice})" 
                                        aria-label="Increase quantity">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                type="button"
                                class="text-gray-400 hover:text-blue-500 transition-all flex items-center justify-center w-6 h-6 edit-customization"
                                aria-label="Edit item"
                                onclick="editItem('${uniqueItemId}')"
                            >
                                <img src="{% static 'icons/pen.png' %}" alt="Edit" class="h-4 w-4">
                            </button>
                        </div>
                    ${customizations.length > 0 ? `
                        <div class="selected-item-customizations">
                            ${customizations.map(opt => `
                                <div>
                                    <span>• ${opt.name}</span>
                                    <span>+₹${opt.price.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            selectedItemsList.appendChild(listItem);
            totalAmount += totalItemPrice * initialQuantity;
        }

        updateTotalAmount();
        localStorage.setItem('selectedItemsData', JSON.stringify(selectedIds.map(id => {
            const item = document.querySelector(`[data-unique-id="${id}"]`);
            if (!item) return null;
            return {
                itemId: item.getAttribute('data-item-id'),
                customizations: item.hasAttribute('data-selected-customizations') ? JSON.parse(item.getAttribute('data-selected-customizations')) : [],
                totalPrice: item.getAttribute('data-total-price'),
                uniqueItemId: id,
                quantity: document.getElementById(`quantity-${id}`)?.innerText || '1'
            };
        }).filter(item => item !== null)));

        if (selectedItems.length > 0) {
            selectionSidebar.classList.add('open');
        } else {
            selectionSidebar.classList.remove('open');
        }
    }

    window.removeItem = function(uniqueItemId) {
        const itemId = uniqueItemId.split('-')[0];
        const items = document.querySelectorAll(`[data-item-id="${itemId}"]`);
        items.forEach(item => {
            item.classList.remove('selected');
            item.removeAttribute('data-selected-customizations');
            item.removeAttribute('data-total-price');
            item.removeAttribute('data-unique-id');
        });
        updateSidebar();
    };

    let currentItem = null;
    let selectedCustomizations = new Set();

    window.incrementItemQuantity = function(element) {
        const uniqueItemId = element.getAttribute('data-unique-id') || 
                            `${element.getAttribute('data-item-id')}-basic`;

        if (!element.classList.contains('selected')) {
            element.classList.add('selected');
            element.setAttribute('data-unique-id', uniqueItemId);
            element.setAttribute('data-total-price', element.getAttribute('data-item-price'));

            // Ensure quantity element is created for items without customizations
            let quantityDiv = document.getElementById(`quantity-${uniqueItemId}`);
            if (!quantityDiv) {
                quantityDiv = document.createElement('div');
                quantityDiv.id = `quantity-${uniqueItemId}`;
                quantityDiv.classList.add('quantity-tracker');
                quantityDiv.innerText = '1';
                element.appendChild(quantityDiv);
            }

            updateSidebar();
        } else {
            const itemPrice = parseFloat(element.getAttribute('data-total-price'));
            window.increaseQuantity(uniqueItemId, itemPrice);
        }
    };

    window.selectItem = function(element) {
        currentItem = element;
        const itemId = element.getAttribute('data-item-id');
        const uniqueItemId = element.getAttribute('data-unique-id') || `${itemId}-basic`;

        if (element.getAttribute('data-has-customization') === 'true') {
            showCustomizationPopup(element);
        } else {
            incrementItemQuantity(element);
        }
    };

    function showCustomizationPopup(element) {
        const popup = document.getElementById('customizationPopup');
        const content = document.getElementById('popupContent');
        const title = document.getElementById('customizationTitle');
        const categoriesContainer = document.getElementById('customizationCategories');
        const basePriceElement = document.getElementById('basePrice');
        const addedPriceElement = document.getElementById('addedPrice');
        const totalPriceElement = document.getElementById('totalPrice');

        if (!popup || !content || !title || !categoriesContainer || !basePriceElement || !addedPriceElement || !totalPriceElement) {
            console.error('One or more elements are missing in the customization popup.');
            return;
        }

        selectedCustomizations.clear();

        title.textContent = `Customize ${element.getAttribute('data-item-name')}`;
        basePriceElement.textContent = element.getAttribute('data-item-price');

        const options = JSON.parse(element.getAttribute('data-customization-options'));
        const categorizedOptions = {};

        options.forEach(option => {
            if (!categorizedOptions[option.category]) {
                categorizedOptions[option.category] = [];
            }
            categorizedOptions[option.category].push(option);
        });

        categoriesContainer.innerHTML = Object.entries(categorizedOptions).map(([category, options]) => `
            <div class="customization-category">
                <h4>${category}</h4>
                <div class="options-grid">
                    ${options.map(option => `
                        <div class="customization-option" 
                             data-option-id="${option.id}" 
                             data-option-price="${option.price}"
                             onclick="toggleCustomizationOption(this)">
                            <div class="option-name text-white">${option.name}</div>
                            <div class="option-price text-blue-400">+₹${option.price}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        updateCustomizationPrice();

        popup.classList.remove('hidden');
        popup.classList.add('flex');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    window.closeCustomizationPopup = function() {
        const popup = document.getElementById('customizationPopup');
        const content = document.getElementById('popupContent');
        
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            popup.classList.remove('flex');
            popup.classList.add('hidden');
        }, 300);
    };

    window.toggleCustomizationOption = function(element) {
        const optionId = element.getAttribute('data-option-id');
        
        if (selectedCustomizations.has(optionId)) {
            selectedCustomizations.delete(optionId);
            element.classList.remove('selected');
        } else {
            selectedCustomizations.add(optionId);
            element.classList.add('selected');
        }
        
        updateCustomizationPrice();
    };

    function updateCustomizationPrice() {
        const basePrice = parseFloat(document.getElementById('basePrice').textContent);
        let addedPrice = 0;
        
        document.querySelectorAll('.customization-option.selected').forEach(option => {
            addedPrice += parseFloat(option.getAttribute('data-option-price'));
        });
        
        document.getElementById('addedPrice').textContent = addedPrice.toFixed(2);
        document.getElementById('totalPrice').textContent = (basePrice + addedPrice).toFixed(2);
    }

    window.confirmCustomization = function() {
        if (currentItem) {
            closeCustomizationPopup();

            const basePrice = parseFloat(document.getElementById('basePrice').textContent);
            const addedPrice = parseFloat(document.getElementById('addedPrice').textContent);
            const totalItemPrice = basePrice + addedPrice;

            const options = Array.from(selectedCustomizations).map(id => {
                const element = document.querySelector(`.customization-option[data-option-id="${id}"]`);
                return {
                    id: id,
                    name: element.querySelector('.option-name').textContent,
                    price: parseFloat(element.getAttribute('data-option-price'))
                };
            });

            let newItem = document.createElement('div');
            newItem.className = currentItem.className;
            
            Array.from(currentItem.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    newItem.setAttribute(attr.name, attr.value);
                }
            });

            const timestamp = Date.now();
            const uniqueItemId = `${currentItem.getAttribute('data-item-id')}-${timestamp}`;
            
            newItem.classList.add('selected');
            newItem.setAttribute('data-selected-customizations', JSON.stringify(options));
            newItem.setAttribute('data-total-price', totalItemPrice);
            newItem.setAttribute('data-unique-id', uniqueItemId);
            newItem.innerHTML = currentItem.innerHTML;

            let selectedItemsContainer = document.getElementById('selectedItemsContainer');
            if (!selectedItemsContainer) {
                selectedItemsContainer = document.createElement('div');
                selectedItemsContainer.id = 'selectedItemsContainer';
                selectedItemsContainer.style.display = 'none';
                document.body.appendChild(selectedItemsContainer);
            }

            selectedItemsContainer.appendChild(newItem);

            const quantityDiv = document.createElement('div');
            quantityDiv.id = `quantity-${uniqueItemId}`;
            quantityDiv.classList.add('quantity-tracker');
            quantityDiv.innerText = '1';
            newItem.appendChild(quantityDiv);

            selectedCustomizations.clear();
            document.getElementById('addedPrice').textContent = '0.00';
            document.getElementById('totalPrice').textContent = basePrice.toFixed(2);
            document.querySelectorAll('.customization-option.selected').forEach(option => {
                option.classList.remove('selected');
            });

            updateSidebar();
        }
    };

    window.increaseQuantity = function(itemId, itemPrice) {
        var quantityElement = document.getElementById(`quantity-${itemId}`);
        var priceElement = document.getElementById(`price-${itemId}`);
        if (quantityElement && priceElement) {
            var quantity = parseInt(quantityElement.innerText);
            quantityElement.innerText = quantity + 1;
            var totalPrice = itemPrice * (quantity + 1);
            priceElement.innerText = `₹${totalPrice.toFixed(2)}`;
        }
        updateTotalAmount();
    };

    window.decreaseQuantity = function(itemId, itemPrice) {
        var quantityElement = document.getElementById(`quantity-${itemId}`);
        var priceElement = document.getElementById(`price-${itemId}`);
        if (quantityElement && priceElement) {
            var quantity = parseInt(quantityElement.innerText);
            if (quantity > 1) {
                quantityElement.innerText = quantity - 1;
                var totalPrice = itemPrice * (quantity - 1);
                priceElement.innerText = `₹${totalPrice.toFixed(2)}`;
            }
        }
        updateTotalAmount();
    };

    function updateTotalAmount() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        var totalAmount = 0;

        for (var i = 0; i < selectedItems.length; i++) {
            var item = selectedItems[i];
            var uniqueItemId = item.getAttribute('data-unique-id') || `${item.getAttribute('data-item-id')}-basic`;
            var basePrice = parseFloat(item.getAttribute('data-item-price'));
            var totalItemPrice = basePrice;

            if (item.hasAttribute('data-selected-customizations')) {
                const customizations = JSON.parse(item.getAttribute('data-selected-customizations'));
                const customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
                totalItemPrice += customizationPrice;
            }

            var quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
            if (!quantityElement) {
                console.error(`Quantity element not found for item ID: ${uniqueItemId}`);
                continue;
            }
            var quantity = parseInt(quantityElement.innerText);

            var itemTotal = totalItemPrice * quantity;
            totalAmount += itemTotal;
        }

        var gstAmount = totalAmount * 0.18;
        var grandTotal = totalAmount + gstAmount;

        document.getElementById('totalAmount').innerText = `Total: ₹${totalAmount.toFixed(2)}`;
        document.getElementById('gstAmount').innerText = `GST (18%): ₹${gstAmount.toFixed(2)}`;
        document.getElementById('grandTotal').innerText = `Grand Total: ₹${grandTotal.toFixed(2)}`;
    }

    function restoreSelectedItems() {
        var selectedItemsData = JSON.parse(localStorage.getItem('selectedItemsData')) || [];
        selectedItemsData.forEach(itemData => {
            var item = document.querySelector(`[data-item-id="${itemData.itemId}"]`);
            if (item) {
                item.classList.add('selected');
                item.setAttribute('data-selected-customizations', JSON.stringify(itemData.customizations));
                item.setAttribute('data-total-price', itemData.totalPrice);
                item.setAttribute('data-unique-id', itemData.uniqueItemId);

                const quantityDiv = document.createElement('div');
                quantityDiv.id = `quantity-${itemData.uniqueItemId}`;
                quantityDiv.classList.add('quantity-tracker');
                quantityDiv.innerText = itemData.quantity;
                item.appendChild(quantityDiv);
            }
        });
        updateSidebar();
    }

    restoreSelectedItems();

    document.querySelector('.checkout').addEventListener('click', function() {
        var paymentType = document.querySelector('input[name="payment_type"]:checked');
        var orderType = document.querySelector('input[name="order_type"]:checked');

        if (!paymentType || !orderType) {
            alert('Please select both payment type and order type');
            return;
        }

        var selectedItems = document.getElementsByClassName('item-cube selected');
        var orderItems = [];
        var totalAmount = 0;

        for (var i = 0; i < selectedItems.length; i++) {
            var item = selectedItems[i];
            var itemId = item.getAttribute('data-item-id');
            var itemName = item.getAttribute('data-item-name');
            var basePrice = parseFloat(item.getAttribute('data-item-price'));
            var uniqueItemId = item.getAttribute('data-unique-id') || `${itemId}-basic`;

            var quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
            if (quantityElement) {
                var quantity = parseInt(quantityElement.innerText);
                var customizations = [];
                var customizationPrice = 0;

                if (item.hasAttribute('data-selected-customizations')) {
                    customizations = JSON.parse(item.getAttribute('data-selected-customizations'));
                    customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
                }

                var itemTotalPrice = (basePrice + customizationPrice) * quantity;
                totalAmount += itemTotalPrice;

                orderItems.push({
                    id: itemId,
                    name: itemName,
                    price: basePrice + customizationPrice,
                    quantity: quantity,
                    customizations: customizations,
                    totalPrice: itemTotalPrice
                });
            }
        }

        var gstAmount = totalAmount * 0.18;
        var grandTotal = totalAmount + gstAmount;

        var orderData = {
            orderId: Date.now().toString(),
            items: orderItems,
            totalAmount: totalAmount.toFixed(2),
            gstAmount: gstAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            paymentType: paymentType.value,
            orderType: orderType.value,
            time: new Date().toLocaleTimeString('en-US', { hour12: true }),
            date: new Date().toISOString().split('T')[0]
        };

        console.log("Order data being sent:", orderData);  // Debug print

        placeOrder(orderData);
    });

    function placeOrder(orderData) {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        fetch('/place-order/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('Order placed successfully!');
                console.log(orderData);
                generateThermalBill(orderData); // Call the function to show the bill
                clearSelectedItems();
            } else {
                alert('Failed to place order: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while placing the order.');
        });
    }

    function clearSelectedItems() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        while (selectedItems.length > 0) {
            var item = selectedItems[0];
            if (item) {
                item.classList.remove('selected');
                item.removeAttribute('data-selected-customizations');
                item.removeAttribute('data-total-price');
                item.removeAttribute('data-unique-id');
            }
        }
        var selectedItemsList = document.getElementById('selectedItemsList');
        if (selectedItemsList) {
            selectedItemsList.innerHTML = '';
        }
        localStorage.removeItem('selectedItemsData');
        updateTotalAmount();
    }

    document.querySelectorAll('.category-link').forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            var categoryId = this.getAttribute('data-category-id');
            fetch(`/inventory/?category=${categoryId}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                var selectedItemsData = [];
                var selectedItems = document.querySelectorAll('.item-cube.selected');
                selectedItems.forEach(item => {
                    var itemId = item.getAttribute('data-item-id');
                    var customizations = item.hasAttribute('data-selected-customizations') ? JSON.parse(item.getAttribute('data-selected-customizations')) : [];
                    var totalPrice = item.getAttribute('data-total-price');
                    var uniqueItemId = item.getAttribute('data-unique-id');
                    var quantity = document.getElementById(`quantity-${uniqueItemId}`).innerText;
                    selectedItemsData.push({ itemId, customizations, totalPrice, uniqueItemId, quantity });
                });
                localStorage.setItem('selectedItemsData', JSON.stringify(selectedItemsData));

                itemsContainer.innerHTML = '';
                data.items.forEach(function(item) {
                    var itemCube = document.createElement('div');
                    itemCube.classList.add('item-cube');
                    itemCube.setAttribute('data-item-id', item.id);
                    itemCube.setAttribute('data-item-name', item.name);
                    itemCube.setAttribute('data-item-price', item.price);
                    itemCube.setAttribute('data-has-customization', item.has_customization);
                    if (item.has_customization) {
                        itemCube.setAttribute('data-customization-options', JSON.stringify(item.customization_options));
                    }
                    itemCube.innerHTML = `
                        <h3 class="text-xl font-bold mb-2">${item.name}</h3>
                        <img src="${item.image}" alt="${item.name}">
                    `;
                    itemCube.addEventListener('click', function() {
                        selectItem(this);
                    });
                    itemsContainer.appendChild(itemCube);
                });
                restoreSelectedItems();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while fetching items.');
            });
        });
    });

    document.querySelectorAll('.item-cube').forEach(function(item) {
        item.addEventListener('click', function() {
            selectItem(this);
        });
    });

    const releaseButton = document.querySelector('.release-button');
    if (releaseButton) {
        releaseButton.addEventListener('click', function() {
            var selectedTable = localStorage.getItem('selectedTable');
            if (!selectedTable) {
                alert('Please select a table first.');
                return;
            }

            fetch('/api/tables/release', {      
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ table_id: selectedTable })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    alert('Table released successfully!');
                    location.reload(); // Refresh to show updated table status
                } else {
                    alert('Failed to release table: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while releasing the table.');
            });
        });
    }

    window.viewBill = function(event, tableId) {
        event.stopPropagation();
        var tableNumber = tableId.replace('table-', '');
        fetch(`/api/tables/${tableNumber}/orders`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                generateBill(data.orders);
            } else {
                alert('Failed to fetch orders: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching the orders.');
        });
    };

    function loadTables() {
        fetch('/api/tables')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update tables display
            const tableContainer = document.getElementById('tableContainer');
            tableContainer.innerHTML = ''; // Clear existing tables

            Object.entries(data.tables).forEach(([place, tables]) => {
                const placeSection = document.createElement('div');
                placeSection.classList.add('place-section');
                placeSection.innerHTML = `<h2>${place}</h2>`;
                
                const tableGrid = document.createElement('div');
                tableGrid.classList.add('table-container');
                
                tables.forEach(table => {
                    // Create table elements similar to your existing code
                    const tableBox = createTableElement(table);
                    tableGrid.appendChild(tableBox);
                });
                
                placeSection.appendChild(tableGrid);
                tableContainer.appendChild(placeSection);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while loading tables.');
        });
    }

    // Call loadTables when the page loads
    document.addEventListener('DOMContentLoaded', loadTables);

    // Add event listener for edit customization buttons in the sidebar
    selectedItemsList.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-customization');
        if (editButton) {
            const selectedItemBox = editButton.closest('.selected-item-box');
            const itemId = selectedItemBox.querySelector('[data-item-id]').getAttribute('data-item-id');
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
            showCustomizationPopup(itemElement);
        }
    });

    const targetUl = document.querySelector('ul#inventory-list'); // Ensure the <ul> has id="inventory-list"

    if (targetUl) {
        targetUl.addEventListener('click', function(event) {
            var target = event.target;
            if (target && target.getAttribute) {
                var attribute = target.getAttribute('data-attribute');
                // ...rest of the code...
            } else {
                console.warn('Expected element with data-attribute not found.');
            }
        });
    } else {
        console.error('Target <ul id="inventory-list"> element not found.');
    }
});

function generateThermalBill(orderData) {
    // Open a new window for the bill
    const billWindow = window.open('', 'BILL', 'width=400,height=600');
    if (!billWindow) {
        console.error('Failed to open bill window');
        return;
    }
    const billContent = `
        <html>
        <head>
            <title>Thermal Bill</title>
            <style>
                body {
                    width: 58mm; /* Adjust to 80mm if needed */
                    font-family: monospace;
                    font-size: 12px;
                    margin: 0;
                    padding: 10px;
                }
                .header, .footer {
                    text-align: center;
                }
                .header img {
                    max-width: 100px;
                    margin-bottom: 10px;
                }
                .details {
                    margin: 10px 0;
                }
                .details div {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                table, th, td {
                    border: 1px dashed #000;
                }
                th, td {
                    padding: 5px;
                    text-align: left;
                }
                .total {
                    margin: 10px 0;
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                }
                .thank-you {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="https://yourcompany.com/logo.png" alt="Company Logo">
                <h2>Your Company Name</h2>
                <p>1234 Street Name, City, State</p>
                <p>Phone: (123) 456-7890 | Email: info@yourcompany.com</p>
            </div>
            
            <div class="details">
                <div>
                    <span>Order ID:</span>
                    <span>${orderData.orderId}</span>
                </div>
                <div>
                    <span>Date:</span>
                    <span>${orderData.date}</span>
                </div>
                <div>
                    <span>Time:</span>
                    <span>${orderData.time}</span>
                </div>
                ${orderData.tableNumber ? `
                <div>
                    <span>Table No.:</span>
                    <span>${orderData.tableNumber}</span>
                </div>
                ` : ''}
                <div>
                    <span>Payment:</span>
                    <span>${orderData.paymentType}</span>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price (₹)</th>
                        <th>Total (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderData.items.map(item => `
                        <tr>
                            <td>${item.name}${item.customizations.length > 0 ? ` (${item.customizations.map(c => c.name).join(', ')})` : ''}</td>
                            <td>${item.quantity}</td>
                            <td>₹${(item.price).toFixed(2)}</td>
                            <td>₹${(item.totalPrice).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total">
                <span>Subtotal:</span>
                <span>₹${orderData.totalAmount}</span>
            </div>
            <div class="total">
                <span>GST (18%):</span>
                <span>₹${orderData.gstAmount}</span>
            </div>
            <div class="total">
                <strong>Grand Total:</strong>
                <strong>₹${orderData.grandTotal}</strong>
            </div>
            
            <div class="thank-you">
                <p>Thank you for dining with us!</p>
                <p>Please come again.</p>
            </div>
        </body>
        </html>
    `;
    billWindow.document.write(billContent);
    billWindow.document.close();
    billWindow.focus();
}