document.addEventListener('DOMContentLoaded', function() {
    var sidebar = document.getElementById('sidebar');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var searchInput = document.getElementById('searchInput');
    var itemsContainer = document.getElementById('itemsContainer');
    var selectionSidebar = document.getElementById('selectionSidebar');
    var selectedItemsList = document.getElementById('selectedItemsList');
    var mainContent = document.getElementById('mainContent');

    searchInput.addEventListener('input', function() {
        var searchQuery = searchInput.value.toLowerCase();
        var items = itemsContainer.getElementsByClassName('item-cube');
        for (var i = 0; i < items.length; i++) {
            var itemName = items[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
            if (itemName.startsWith(searchQuery)) {
                items[i].style.display = 'block';
            } else {
                items[i].style.display = 'none';
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
        .then(response => response.json())
        .then(data => {
            console.log("Response from server:", data);  // Debug print
            if (data.status === 'success') {
                alert('Order placed successfully!');
                if (document.getElementById('printButton').checked) {
                    generateBill(orderData);
                }
                clearSelectedItems();
            } else {
                alert('Failed to place order: ' + data.error);
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

    function generateBill(orderData) {
        var billWindow = window.open('', 'PRINT', 'height=600,width=800');
        if (!billWindow) {
            console.error('Failed to open bill window');
            return;
        }

        var billContent = `
            <html>
            <head>
                <title>Bill</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .bill-header { text-align: center; margin-bottom: 20px; }
                    .bill-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .bill-items th, .bill-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .bill-total { text-align: right; margin-top: 20px; }
                    .customizations { font-size: 0.9em; color: #666; margin-left: 20px; }
                </style>
            </head>
            <body>
                <div class="bill-header">
                    <h2>Bill</h2>
                    <p>Order ID: ${orderData.orderId}</p>
                    <p>Date: ${orderData.date}</p>
                    <p>Time: ${orderData.time}</p>
                    <p>Payment Type: ${orderData.paymentType}</p>
                    <p>Order Type: ${orderData.orderType}</p>
                </div>
                <table class="bill-items">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderData.items.map(item => `
                            <tr>
                                <td>
                                    ${item.name}
                                    ${item.customizations.length > 0 ? `
                                        <div class="customizations">
                                            ${item.customizations.map(c => 
                                                `+ ${c.name} (₹${parseFloat(c.price).toFixed(2)})`
                                            ).join('<br>')}
                                        </div>
                                    ` : ''}
                                </td>
                                <td>${item.quantity}</td>
                                <td>₹${parseFloat(item.price).toFixed(2)}</td>
                                <td>₹${item.totalPrice.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="bill-total">
                    <p>Subtotal: ₹${orderData.totalAmount}</p>
                    <p>GST (18%): ₹${orderData.gstAmount}</p>
                    <p><strong>Grand Total: ₹${orderData.grandTotal}</strong></p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p>Thank you for your order!</p>
                </div>
            </body>
            </html>
        `;

        billWindow.document.write(billContent);
        billWindow.document.close();
        setTimeout(() => {
            billWindow.print();
        }, 250);
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
            .then(response => response.json())
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
            });
        });
    });

    document.getElementById('printButton').addEventListener('change', function() {
        var label = document.querySelector('label[for="printButton"]');
        if (this.checked) {
            label.classList.add('glow');
        } else {
            label.classList.remove('glow');
        }
    });

    document.querySelectorAll('.item-cube').forEach(function(item) {
        item.addEventListener('click', function() {
            selectItem(this);
        });
    });
});