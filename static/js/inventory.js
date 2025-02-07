document.addEventListener('DOMContentLoaded', function() {
    const selectedTable = localStorage.getItem('selectedTable');
    const selectedTableElement = document.getElementById('selectedTable');
    if (selectedTable && selectedTableElement) {
        selectedTableElement.innerText = `Table: ${selectedTable.replace('table-', '')}`;
    }

    const orderData = localStorage.getItem('orderData');
    if (orderData) {
        try {
            const orders = JSON.parse(orderData);
            loadOrderToSidebar(orders);
            localStorage.removeItem('orderData');
        } catch (error) {
            console.error('Failed to parse stored orders:', error);
        }
    }

    function loadOrderToSidebar(orders) {
        // Ensure orders is an array
        if (!Array.isArray(orders)) {
            orders = [orders]; // Convert to array if it's a single object
        }

        const sidebar = document.getElementById('orderSidebar');
        if (!sidebar) {
            return; // Exit if sidebar element is not found
        }
        sidebar.innerHTML = ''; // Clear existing content

        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');
            orderItem.innerHTML = `
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Time:</strong> ${order.time}</p>
                <p><strong>Items:</strong></p>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} (x${item.quantity}) - ₹${parseFloat(item.total_price).toFixed(2)}</li>
                    `).join('')}
                </ul>
                <p><strong>Subtotal:</strong> ₹${parseFloat(order.subtotal).toFixed(2)}</p>
                <p><strong>GST Amount:</strong> ₹${parseFloat(order.gst_amount).toFixed(2)}</p>
                <p><strong>Grand Total:</strong> ₹${parseFloat(order.grand_total).toFixed(2)}</p>
            `;
            sidebar.appendChild(orderItem);
        });
    }

    var sidebar = document.getElementById('sidebar');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var searchInput = document.getElementById('searchInput');
    var itemsContainer = document.getElementById('itemsContainer');
    var selectionSidebar = document.getElementById('selectionSidebar');
    var selectedItemsList = document.getElementById('selectedItemsList');
    var mainContent = document.getElementById('mainContent');

    if (searchInput) {
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
    }

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
                customizations.push(...JSON.parse(item.getAttribute('data-selected-customizations')));
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
                        </div>
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

    document.addEventListener('DOMContentLoaded', function() {
        const inventoryList = document.getElementById('inventory-list');
        if (!inventoryList) {
            console.error("Target <ul id='inventory-list'> element not found.");
            return;
        }

        // ...existing JavaScript code that manipulates inventoryList...
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

    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            const selectedItems = document.getElementsByClassName('item-cube selected');
            const orderItems = [];
            let totalAmount = 0;

            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                const itemId = item.getAttribute('data-item-id');
                const itemName = item.getAttribute('data-item-name');
                const basePrice = parseFloat(item.getAttribute('data-item-price'));
                const uniqueItemId = item.getAttribute('data-unique-id') || `${itemId}-basic`;

                const quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
                if (quantityElement) {
                    const quantity = parseInt(quantityElement.innerText);
                    const customizations = item.hasAttribute('data-selected-customizations') ? JSON.parse(item.getAttribute('data-selected-customizations')) : [];
                    const customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
                    const itemTotalPrice = (basePrice + customizationPrice) * quantity;
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

            const orderData = {
                orderId: Date.now().toString(),
                items: orderItems,
                totalAmount: totalAmount.toFixed(2),
                gstAmount: (totalAmount * 0.18).toFixed(2),
                grandTotal: (totalAmount * 1.18).toFixed(2),
                paymentType: 'N/A',  // Default value if not selected
                orderType: 'N/A',    // Default value if not selected
                time: new Date().toLocaleTimeString('en-US', { hour12: true }),
                date: new Date().toISOString().split('T')[0]
            };

            console.log("Order data being sent:", orderData);  // Debug print

            fetch('/send-order/', {  // Corrected URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(orderData)
            })
            .then(response => {
                console.log("Response status:", response.status);  // Debug response status
                if (!response.ok) {
                    return response.json().then(data => {
                        console.error("Response data:", data);  // Debug response data
                        throw new Error('Network response was not ok');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    clearSelectedItems();
                    showSuccessPopup();  // Show success popup
                } else {
                    alert('Failed to send order: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while sending the order.');
            });
        });
    }

    function showSuccessPopup() {
        const successOverlay = document.createElement('div');
        successOverlay.classList.add('success-overlay', 'fixed', 'inset-0', 'flex', 'items-center', 'justify-center', 'z-50');
        successOverlay.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg text-center">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
                <p class="success-text mt-4">Order sent successfully!</p>
            </div>
        `;
        document.body.appendChild(successOverlay);

        setTimeout(() => {
            successOverlay.classList.add('opacity-0');
            setTimeout(() => {
                successOverlay.remove();
            }, 300);
        }, 2000);
    }

    // Handle status button clicks
    const statusButtons = document.querySelectorAll('.status-button');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentState = button.getAttribute('data-state');
            const orderBox = button.closest('.order-box');

            if (currentState === 'start') {
                // Change to 'Order Preparing'
                button.innerText = 'Order Preparing';
                button.setAttribute('data-state', 'preparing');
                orderBox.classList.add('neon-yellow');
                orderBox.classList.remove('neon-green');
            }
            // Add more states if needed
        });
    });
});

function generateThermalBill(orderData) {
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
                    width: 58mm; 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                               "Helvetica Neue", Arial, sans-serif; 
                    font-size: 12px; 
                    margin: 0; 
                    padding: 10px; 
                }
                @media print {
                    body { 
                        width: 58mm;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                                   "Helvetica Neue", Arial, sans-serif;
                    }
                }
                .header, .footer { text-align: center; }
                .details div { display: flex; justify-content: space-between; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                table, th, td { border: 1px dashed #000; }
                th, td { padding: 5px; text-align: left; }
                .total { margin: 10px 0; display: flex; justify-content: space-between; font-size: 14px; }
                .thank-you { margin-top: 20px; text-align: center; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Your Restaurant</h2>
                <p>1234 Street Name, City</p>
                <p>Phone: (123) 456-7890</p>
            </div>
            <div class="details">
                <div><span>Order ID:</span> <span>${orderData.order_id}</span></div>
                <div><span>Date:</span> <span>${orderData.date}</span></div>
                <div><span>Time:</span> <span>${orderData.time}</span></div>
                <div><span>Table No.:</span> <span>${orderData.table_number}</span></div>
                <div><span>Payment:</span> <span>${orderData.payment_type}</span></div>
            </div>
            <table>
                <thead>
                    <tr><th>Item</th><th>Qty</th><th>Price (₹)</th><th>Total (₹)</th></tr>
                </thead>
                <tbody>
                    ${orderData.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${parseFloat(item.price).toFixed(2)}</td>
                            <td>₹${parseFloat(item.total_price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total"><span>Subtotal:</span> <span>₹${parseFloat(orderData.subtotal).toFixed(2)}</span></div>
            <div class="total"><span>GST (18%):</span> <span>₹${parseFloat(orderData.gst_amount).toFixed(2)}</span></div>
            <div class="total"><strong>Grand Total:</strong> <strong>₹${parseFloat(orderData.grand_total).toFixed(2)}</strong></div>
            <div class="thank-you"><p>Thank you for dining with us!</p><p>Please come again.</p></div>
        </body>
        </html>
    `;

    billWindow.document.write(billContent);
    billWindow.document.close();
    billWindow.focus();
    billWindow.print();
    billWindow.close();
}

document.addEventListener('DOMContentLoaded', function() {
    const targetElement = document.getElementById('someButton');
    if (targetElement) {
        targetElement.addEventListener('click', () => {
            // ...existing logic...
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    function loadOrderToSidebar(orders) {
        // Ensure orders is an array
        if (!Array.isArray(orders)) {
            console.error('Expected orders to be an array, but got:', orders);
            orders = [orders]; // Convert to array if it's a single object
        }

        const sidebar = document.getElementById('orderSidebar');
        if (!sidebar) {
            console.error('Order sidebar element not found.');
            return;
        }
        sidebar.innerHTML = ''; // Clear existing content

        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');
            orderItem.innerHTML = `
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Time:</strong> ${order.time}</p>
                <p><strong>Items:</strong></p>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} (x${item.quantity}) - ₹${parseFloat(item.total_price).toFixed(2)}</li>
                    `).join('')}
                </ul>
                <p><strong>Subtotal:</strong> ₹${parseFloat(order.subtotal).toFixed(2)}</p>
                <p><strong>GST Amount:</strong> ₹${parseFloat(order.gst_amount).toFixed(2)}</p>
                <p><strong>Grand Total:</strong> ₹${parseFloat(order.grand_total).toFixed(2)}</p>
            `;
            sidebar.appendChild(orderItem);
        });
    }

    // Load orders from localStorage
    const storedOrders = localStorage.getItem('orderData');
    if (storedOrders) {
        try {
            const orders = JSON.parse(storedOrders);
            loadOrderToSidebar(orders);
        } catch (error) {
            console.error('Failed to parse stored orders:', error);
        }
    }

    // ...existing code...
});
document.addEventListener('DOMContentLoaded', function() {
    const checkoutButton = document.querySelector('.checkout');

    if (checkoutButton) {
        checkoutButton.removeEventListener('click', handleCheckout); // Remove any existing listener
        checkoutButton.addEventListener('click', handleCheckout); // Add new listener
    }
});

function handleCheckout() {
    const selectedItems = document.getElementsByClassName('item-cube selected');
    const orderItems = [];
    let totalAmount = 0;

    for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const itemId = item.getAttribute('data-item-id');
        const itemName = item.getAttribute('data-item-name');
        const basePrice = parseFloat(item.getAttribute('data-item-price'));
        const uniqueItemId = item.getAttribute('data-unique-id') || `${itemId}-basic`;

        const quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
        if (quantityElement) {
            const quantity = parseInt(quantityElement.innerText);
            const customizations = item.hasAttribute('data-selected-customizations') ? JSON.parse(item.getAttribute('data-selected-customizations')) : [];
            const customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
            const itemTotalPrice = (basePrice + customizationPrice) * quantity;
            totalAmount += itemTotalPrice;

            orderItems.push({
                name: itemName,
                price: basePrice + customizationPrice,
                quantity: quantity,
                customizations: customizations,
                total_price: itemTotalPrice
            });
        }
    }

    const orderData = {
        order_id: Date.now().toString(),
        items: orderItems,
        subtotal: totalAmount.toFixed(2),
        gst_amount: (totalAmount * 0.18).toFixed(2),
        grand_total: (totalAmount * 1.18).toFixed(2),
        payment_type: document.querySelector('input[name="payment_type"]:checked')?.value || 'N/A',
        order_type: document.querySelector('input[name="order_type"]:checked')?.value || 'N/A',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: true })
    };

    fetch('/complete-order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Order completed successfully!');
            // Clear selected items and update the sidebar
            clearSelectedItems();
            updateSidebar();
            closeSidebar(); // Close the sidebar
        } else {
            alert('Failed to complete order: ' + (data.error || 'Unknown error'));
        }
    })
  
}

document.addEventListener('DOMContentLoaded', function() {
    const printButton = document.querySelector('.print');
    if (printButton) {
        printButton.addEventListener('click', function() {
            const selectedItems = document.getElementsByClassName('item-cube selected');
            const orderItems = [];
            let totalAmount = 0;

            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                const itemId = item.getAttribute('data-item-id');
                const itemName = item.getAttribute('data-item-name');
                const basePrice = parseFloat(item.getAttribute('data-item-price'));
                const uniqueItemId = item.getAttribute('data-unique-id') || `${itemId}-basic`;

                const quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
                if (quantityElement) {
                    const quantity = parseInt(quantityElement.innerText);
                    const customizations = item.hasAttribute('data-selected-customizations') ? JSON.parse(item.getAttribute('data-selected-customizations')) : [];
                    const customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
                    const itemTotalPrice = (basePrice + customizationPrice) * quantity;
                    totalAmount += itemTotalPrice;

                    orderItems.push({
                        name: itemName,
                        price: basePrice + customizationPrice,
                        quantity: quantity,
                        customizations: customizations,
                        total_price: itemTotalPrice
                    });
                }
            }

            const orderData = {
                order_id: Date.now().toString(),
                items: orderItems,
                subtotal: totalAmount.toFixed(2),
                gst_amount: (totalAmount * 0.18).toFixed(2),
                grand_total: (totalAmount * 1.18).toFixed(2),
                payment_type: document.querySelector('input[name="payment_type"]:checked')?.value || 'N/A',
                order_type: document.querySelector('input[name="order_type"]:checked')?.value || 'N/A',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-US', { hour12: true })
            };

            generateThermalBill(orderData);
        }, { once: true });  // This ensures the event fires only once
    }
});



function generateThermalBill(orderData) {
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
                    width: 58mm; 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                               "Helvetica Neue", Arial, sans-serif; 
                    font-size: 12px; 
                    margin: 0; 
                    padding: 10px; 
                }
                @media print {
                    body { 
                        width: 58mm;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                                   "Helvetica Neue", Arial, sans-serif;
                    }
                }
                .header, .footer { text-align: center; }
                .details div { display: flex; justify-content: space-between; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                table, th, td { border: 1px dashed #000; }
                th, td { padding: 5px; text-align: left; }
                .total { margin: 10px 0; display: flex; justify-content: space-between; font-size: 14px; }
                .thank-you { margin-top: 20px; text-align: center; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Your Restaurant</h2>
                <p>1234 Street Name, City</p>
                <p>Phone: (123) 456-7890</p>
            </div>
            <div class="details">
                <div><span>Order ID:</span> <span>${orderData.order_id}</span></div>
                <div><span>Date:</span> <span>${orderData.date}</span></div>
                <div><span>Time:</span> <span>${orderData.time}</span></div>
                <div><span>Table No.:</span> <span>${orderData.table_number}</span></div>
                <div><span>Payment:</span> <span>${orderData.payment_type}</span></div>
            </div>
            <table>
                <thead>
                    <tr><th>Item</th><th>Qty</th><th>Price (₹)</th><th>Total (₹)</th></tr>
                </thead>
                <tbody>
                    ${orderData.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${parseFloat(item.price).toFixed(2)}</td>
                            <td>₹${parseFloat(item.total_price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total"><span>Subtotal:</span> <span>₹${parseFloat(orderData.subtotal).toFixed(2)}</span></div>
            <div class="total"><span>GST (18%):</span> <span>₹${parseFloat(orderData.gst_amount).toFixed(2)}</span></div>
            <div class="total"><strong>Grand Total:</strong> <strong>₹${parseFloat(orderData.grand_total).toFixed(2)}</strong></div>
            <div class="thank-you"><p>Thank you for dining with us!</p><p>Please come again.</p></div>
        </body>
        </html>
    `;

    billWindow.document.write(billContent);
    billWindow.document.close();
    billWindow.focus();
    billWindow.print();
    billWindow.close();
}


document.addEventListener('DOMContentLoaded', function () {
    const coPrintButton = document.querySelector('.co-print');

    if (coPrintButton) {
        coPrintButton.addEventListener('click', function () {
            if (coPrintButton.disabled) return; // Prevent multiple clicks
            coPrintButton.disabled = true;

            const selectedItems = document.getElementsByClassName('item-cube selected');
            if (selectedItems.length === 0) {
                alert("No items selected!");
                coPrintButton.disabled = false;
                return;
            }

            const orderItems = [];
            let totalAmount = 0;

            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                const itemId = item.getAttribute('data-item-id');
                const itemName = item.getAttribute('data-item-name');
                const basePrice = parseFloat(item.getAttribute('data-item-price'));
                const uniqueItemId = item.getAttribute('data-unique-id') || `${itemId}-basic`;

                const quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
                if (quantityElement) {
                    const quantity = parseInt(quantityElement.innerText);
                    const customizations = item.hasAttribute('data-selected-customizations') ? JSON.parse(item.getAttribute('data-selected-customizations')) : [];
                    const customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
                    const itemTotalPrice = (basePrice + customizationPrice) * quantity;
                    totalAmount += itemTotalPrice;

                    orderItems.push({
                        name: itemName,
                        price: basePrice + customizationPrice,
                        quantity: quantity,
                        customizations: customizations,
                        total_price: itemTotalPrice
                    });
                }
            }

            const orderId = Date.now().toString();
            const orderData = {
                order_id: orderId,
                items: orderItems,
                subtotal: totalAmount.toFixed(2),
                gst_amount: (totalAmount * 0.18).toFixed(2),
                grand_total: (totalAmount * 1.18).toFixed(2),
                payment_type: document.querySelector('input[name="payment_type"]:checked')?.value || 'N/A',
                order_type: document.querySelector('input[name="order_type"]:checked')?.value || 'N/A',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-US', { hour12: true })
            };

            fetch('/complete-order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(orderData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Order completed and printed successfully!');
                    generateThermalBill(orderData);
                    clearSelectedItems();
                    updateSidebar();
                    closeSidebar(); // Close the sidebar
                } else {
                    alert('Failed to complete order: ' + (data.error || 'Unknown error'));
                }
            })
          
            .finally(() => {
                setTimeout(() => {
                    coPrintButton.disabled = false; // Re-enable button
                }, 1000);
            });
        }, { once: true }); // Ensures the event listener runs only once
    }
});

function closeSidebar() {
    selectionSidebar.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    // Add event listeners for order type radio buttons
    const orderTypeRadios = document.querySelectorAll('input[name="order_type"]');
    const checkoutButton = document.querySelector('.checkout');

    orderTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'dine_in') {
                checkoutButton.textContent = 'Save Order';
                // Change the button functionality to handle save order
                checkoutButton.removeEventListener('click', handleCheckout);
                checkoutButton.addEventListener('click', handleSaveOrder);
            } else {
                checkoutButton.textContent = 'Checkout';
                // Restore original checkout functionality
                checkoutButton.removeEventListener('click', handleSaveOrder);
                checkoutButton.addEventListener('click', handleCheckout);
            }
        });
    });

    function handleSaveOrder() {
        // Disable the save order button immediately to prevent multiple clicks
        const saveOrderButton = document.querySelector('.checkout');
        if (saveOrderButton.disabled) {
            return; // If button is already disabled, exit early
        }
        saveOrderButton.disabled = true;

        const selectedItems = document.getElementsByClassName('item-cube selected');
        if (selectedItems.length === 0) {
            alert("No items selected!");
            saveOrderButton.disabled = false;
            return;
        }

        const orderType = document.querySelector('input[name="order_type"]:checked');
        if (!orderType) {
            alert("Please select an order type!");
            saveOrderButton.disabled = false;
            return;
        }

        const selectedTable = localStorage.getItem('selectedTable');
        if (!selectedTable) {
            alert("Please select a table first!");
            saveOrderButton.disabled = false;
            return;
        }

        const orderItems = [];
        let totalAmount = 0;

        for (let i = 0; i < selectedItems.length; i++) {
            const item = selectedItems[i];
            const itemId = item.getAttribute('data-item-id');
            const itemName = item.getAttribute('data-item-name');
            const basePrice = parseFloat(item.getAttribute('data-item-price'));
            const uniqueItemId = item.getAttribute('data-unique-id') || `${itemId}-basic`;

            const quantityElement = document.getElementById(`quantity-${uniqueItemId}`);
            if (quantityElement) {
                const quantity = parseInt(quantityElement.innerText);
                const customizations = item.hasAttribute('data-selected-customizations') ? 
                    JSON.parse(item.getAttribute('data-selected-customizations')) : [];
                const customizationPrice = customizations.reduce((sum, opt) => sum + parseFloat(opt.price), 0);
                const itemTotalPrice = (basePrice + customizationPrice) * quantity;
                totalAmount += itemTotalPrice;

                orderItems.push({
                    name: itemName,
                    price: basePrice + customizationPrice,
                    quantity: quantity,
                    customizations: customizations,
                    total_price: itemTotalPrice
                });
            }
        }

        const tableNumber = selectedTable.replace('table-', '');
        const orderData = {
            table_order_id: Date.now().toString(),
            table_number: parseInt(tableNumber),
            items: orderItems,
            subtotal: totalAmount.toFixed(2),
            gst_amount: (totalAmount * 0.18).toFixed(2),
            grand_total: (totalAmount * 1.18).toFixed(2),
            payment_type: document.querySelector('input[name="payment_type"]:checked')?.value || 'N/A',
            order_type: orderType.value,
            status: 'active'
        };

        fetch('/save-table-order/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Order saved successfully!');
                clearSelectedItems();
                localStorage.removeItem('selectedTable');
                const selectedTableElement = document.getElementById('selectedTable');
                if (selectedTableElement) {
                    selectedTableElement.innerText = '';
                }
                updateSidebar();
                closeSidebar();
                const orderTypeRadios = document.querySelectorAll('input[name="order_type"]');
                const paymentTypeRadios = document.querySelectorAll('input[name="payment_type"]');
                orderTypeRadios.forEach(radio => radio.checked = false);
                paymentTypeRadios.forEach(radio => radio.checked = false);
            } else {
                alert('Failed to save order: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while saving the order.');
        })
        .finally(() => {
            // Re-enable the button after a short delay
            setTimeout(() => {
                saveOrderButton.disabled = false;
            }, 1000);
        });
    }

    // ...existing code...
});

// ...existing code...

// Removed all table popup box related functions and design
// function createTablePopup() { ... }
// function closeTablePopup() { ... }
// function selectTableFromPopup(tableNumber) { ... }

// ...existing code...


// Update the order type radio button event listener
document.addEventListener('DOMContentLoaded', function() {
    const orderTypeRadios = document.querySelectorAll('input[name="order_type"]');
    const checkoutButton = document.querySelector('.checkout');
    
    if (!checkoutButton) {
        console.error('Checkout button not found');
        return;
    }

    orderTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'dine_in') {
                const selectedTable = localStorage.getItem('selectedTable');
                if (!selectedTable) {
                    handleDineInOption();
                }
                checkoutButton.textContent = 'Save Order';
                checkoutButton.removeEventListener('click', handleCheckout);
                checkoutButton.addEventListener('click', handleSaveOrder);
            } else {
                checkoutButton.textContent = 'Checkout';
                checkoutButton.removeEventListener('click', handleSaveOrder);
                checkoutButton.addEventListener('click', handleCheckout);
            }
        });
    });
});

// New function to handle dine in option click
function handleDineInOption() {
    const selectedTable = localStorage.getItem('selectedTable');
    showTableSelectionPopup();
}

// New function to fetch table data from the table page
function fetchTablesForPopup() {
    return fetch('/table-status/')
        .then(response => response.json())
        .catch(error => {
            console.error("Error fetching tables:", error);
            return [];
        });
}

// New function to show the table selection popup with improved design
function showTableSelectionPopup() {
    // Remove existing popup if present
    const existingPopup = document.getElementById('tableSelectionPopup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'tableSelectionPopup';
    popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    // Create container for table list
    const container = document.createElement('div');
    container.className = 'bg-gray-900 text-white rounded-lg p-6 w-[100%] max-w-[1500px] max-h-[95vh] shadow-lg transform transition-all scale-95 opacity-0';
    container.innerHTML = `
        <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h2 class="text-xl font-bold">Select a Table</h2>
            <button id="closeTablePopup" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="overflow-y-auto custom-scrollbar max-h-[80vh] mt-4 pr-2">
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4" id="tableList">
                <div class="text-center col-span-full">Loading tables...</div>
            </div>
        </div>
        <style>
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #1F2937;
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4B5563;
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6B7280;
            }
            .table-card {
                transition: all 0.2s ease-in-out;
                width: 100px;
                height: 100px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 0.5rem;
                padding: 0.5rem;
                text-align: center;
                background-color: #374151;
                color: white;
                cursor: pointer;
            }
            .table-card:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
            }
            .table-card.disabled {
                cursor: not-allowed;
                background-color: #10B981; /* Green color for booked tables */
                opacity: 1;
            }
            .table-card .status-badge {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-bottom: 0.5rem;
            }
            .table-card .table-number {
                font-size: 1rem;
                font-weight: bold;
            }
            .table-card .table-area {
                font-size: 0.75rem;
                color: #9CA3AF;
            }
            .table-card .table-status {
                font-size: 0.625rem;
                margin-top: 0.25rem;
            }
        </style>
    `;
    popup.appendChild(container);
    document.body.appendChild(popup);

    // Add animation
    setTimeout(() => {
        container.classList.remove('scale-95', 'opacity-0');
        container.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Populate table list
    fetchTablesForPopup().then(tables => {
        const tableList = document.getElementById('tableList');
        tableList.innerHTML = ''; // Clear previous tables

        if (!tables.length) {
            tableList.innerHTML = '<div class="text-center col-span-full">No tables available.</div>';
        } else {
            tables.forEach(table => {
                const btn = document.createElement('button');
                btn.className = `table-card ${table.is_booked ? 'disabled' : ''}`;
                btn.innerHTML = `
                    <div class="status-badge ${table.is_booked ? 'bg-green-400' : 'bg-green-400'}"></div>
                    <div class="table-number">Table ${table.number}</div>
                    <div class="table-area">${table.place || 'Main Area'}</div>
                    <div class="table-status ${table.is_booked ? 'text-green-200' : 'text-green-200'}">${table.is_booked ? 'Occupied' : 'Available'}</div>
                `;

                if (!table.is_booked) {
                    btn.onclick = () => {
                        localStorage.setItem('selectedTable', `table-${table.number}`);
                        const tableDisplay = document.getElementById('selectedTable');
                        if (tableDisplay) {
                            tableDisplay.textContent = `Table: ${table.number}`;
                        }
                        document.body.removeChild(popup);
                    };
                }
                tableList.appendChild(btn);
            });
        }
    });

    // Close button handler to remove popup
    container.querySelector('#closeTablePopup').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Example integration: attach dine in option click handler
document.addEventListener('DOMContentLoaded', () => {
    const dineInOption = document.getElementById('dineInOption'); // Ensure this element exists
    if (dineInOption) {
        dineInOption.addEventListener('click', handleDineInOption);
        dineInOption.addEventListener('dblclick', handleDineInOption); // Add double-click event listener
    }
});

