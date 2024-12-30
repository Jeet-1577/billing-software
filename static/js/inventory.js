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
        for (var i = 0; i < selectedItems.length; i++) {
            var itemName = selectedItems[i].getAttribute('data-item-name');
            var itemPrice = parseFloat(selectedItems[i].getAttribute('data-item-price'));
            var itemId = selectedItems[i].getAttribute('data-item-id');
            selectedIds.push(itemId);
            totalAmount += itemPrice;
            var listItem = document.createElement('li');
            listItem.classList.add('selected-item-box', 'bg-gray-600', 'p-2', 'rounded', 'shadow', 'flex', 'justify-between', 'items-center', 'text-sm');
            listItem.innerHTML = `
                <div class="flex-1">
                    <h4 class="text-base font-bold">${itemName}</h4>
                </div>
                <div class="flex items-center gap-4">
                    <p id="price-${itemId}" class="text-sm min-w-[80px] text-right">₹${itemPrice.toFixed(2)}</p>
                    <div class="item-counter flex items-center space-x-2">
                        <button onclick="decreaseQuantity(${itemId}, ${itemPrice})" class="bg-gray-800 text-white p-1 rounded hover:bg-gray-900 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
                            </svg>
                        </button>
                        <span id="quantity-${itemId}">1</span>
                        <button onclick="increaseQuantity(${itemId}, ${itemPrice})" class="bg-gray-800 text-white p-1 rounded hover:bg-gray-900 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            selectedItemsList.appendChild(listItem);
        }
        updateTotalAmount();
        localStorage.setItem('selectedItems', JSON.stringify(selectedIds));
        if (selectedItems.length > 0) {
            selectionSidebar.classList.add('open');
            // Remove mainContent class changes since we're using flex layout
        } else {
            selectionSidebar.classList.remove('open');
            // Remove mainContent class changes since we're using flex layout
        }
    }

    window.selectItem = function(element) {
        element.classList.toggle('selected');
        updateSidebar();
    };

    window.increaseQuantity = function(itemId, itemPrice) {
        var quantityElement = document.getElementById(`quantity-${itemId}`);
        var priceElement = document.getElementById(`price-${itemId}`);
        var quantity = parseInt(quantityElement.innerText);
        quantityElement.innerText = quantity + 1;
        priceElement.innerText = `₹${(itemPrice * (quantity + 1)).toFixed(2)}`;
        updateTotalAmount();
    };

    window.decreaseQuantity = function(itemId, itemPrice) {
        var quantityElement = document.getElementById(`quantity-${itemId}`);
        var priceElement = document.getElementById(`price-${itemId}`);
        var quantity = parseInt(quantityElement.innerText);
        if (quantity > 1) {
            quantityElement.innerText = quantity - 1;
            priceElement.innerText = `₹${(itemPrice * (quantity - 1)).toFixed(2)}`;
            updateTotalAmount();
        }
    };

    function updateTotalAmount() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        var totalAmount = 0;
        for (var i = 0; i < selectedItems.length; i++) {
            var itemPrice = parseFloat(selectedItems[i].getAttribute('data-item-price'));
            var itemId = selectedItems[i].getAttribute('data-item-id');
            var quantity = parseInt(document.getElementById(`quantity-${itemId}`).innerText);
            totalAmount += itemPrice * quantity;
        }
        var gstAmount = totalAmount * 0.18;
        var grandTotal = totalAmount + gstAmount;
        document.getElementById('totalAmount').innerText = `Total: ₹${totalAmount.toFixed(2)}`;
        document.getElementById('gstAmount').innerText = `GST (18%): ₹${gstAmount.toFixed(2)}`;
        document.getElementById('grandTotal').innerText = `Grand Total: ₹${grandTotal.toFixed(2)}`;
    }

    function restoreSelectedItems() {
        var selectedIds = JSON.parse(localStorage.getItem('selectedItems')) || [];
        var items = itemsContainer.getElementsByClassName('item-cube');
        for (var i = 0; i < items.length; i++) {
            var itemId = items[i].getAttribute('data-item-id');
            if (selectedIds.includes(itemId)) {
                items[i].classList.add('selected');
            }
        }
        updateSidebar();
    }

    restoreSelectedItems();

    document.querySelector('.checkout').addEventListener('click', function() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        var orderItems = [];
        var totalAmount = 0;
        for (var i = 0; i < selectedItems.length; i++) {
            var itemId = selectedItems[i].getAttribute('data-item-id');
            var itemName = selectedItems[i].getAttribute('data-item-name');
            var itemPrice = parseFloat(selectedItems[i].getAttribute('data-item-price'));
            var quantity = parseInt(document.getElementById(`quantity-${itemId}`).innerText);
            totalAmount += itemPrice * quantity;
            orderItems.push({
                id: itemId,
                name: itemName,
                price: itemPrice,
                quantity: quantity
            });
        }
        var gstAmount = totalAmount * 0.18;
        var grandTotal = totalAmount + gstAmount;
        var paymentType = document.querySelector('input[name="payment_type"]:checked');
        if (!paymentType) {
            alert('Please select a payment type');
            return;
        }
        var orderType = document.querySelector('input[name="order_type"]:checked');
        if (!orderType) {
            alert('Please select an order type');
            return;
        }
        var orderData = {
            orderId: Date.now().toString(),
            items: orderItems,
            totalAmount: totalAmount.toFixed(2),
            gstAmount: gstAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            paymentType: paymentType.value,
            orderType: orderType.value,
            time: new Date().toLocaleTimeString('en-US', { hour12: true }),  // Ensure time includes AM/PM
            date: new Date().toISOString().split('T')[0]
        };
        if (paymentType.value === 'online') {
            // UPI Payment Info
            const upiId = 'mr.jac5333-1@okicici';  // Your UPI ID
            const name = 'Your Restaurant Name';    // Your business name
            const amount = grandTotal.toFixed(2);
            const transactionId = Date.now().toString(); // Unique transaction ID
            
            // Generate direct UPI QR Code URL using a reliable QR code service
            const upiData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tr=${transactionId}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiData)}`;
            
            document.getElementById('upiQrCodeImage').src = qrUrl;
            document.getElementById('upiQrCode').style.display = 'flex';
            
            // Store order data
            window.pendingOrderData = orderData;
            window.pendingOrderData.transactionId = transactionId;
            
            // Start polling for payment status
            startPaymentStatusCheck(transactionId);
            return;
        }
        // Proceed with order placement for cash payments
        placeOrder(orderData);
    });

    // Update closeQrCode function to handle order placement
    window.closeQrCode = function() {
        var upiQrCode = document.getElementById('upiQrCode');
        upiQrCode.style.display = 'none';
        
        if (window.pendingOrderData) {
            placeOrder(window.pendingOrderData);
            window.pendingOrderData = null;
            clearSelectedItems();  // Clear selected items after order placement
        }
    };

    // Add payment success handler
    window.handlePaymentSuccess = function() {
        const successOverlay = document.getElementById('successOverlay');
        successOverlay.style.display = 'flex';
        
        // Wait for animation and auto-close
        setTimeout(() => {
            var upiQrCode = document.getElementById('upiQrCode');
            upiQrCode.style.display = 'none';
            successOverlay.style.display = 'none';
            
            if (window.pendingOrderData) {
                placeOrder(window.pendingOrderData);
                window.pendingOrderData = null;
                clearSelectedItems();
            }
        }, 2000); // Show success message for 2 seconds
    };

    // New function to handle order placement
    function placeOrder(orderData) {
        return fetch('/place-order/', {
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
                alert('Order placed successfully!');
                if (document.getElementById('printButton').checked) {
                    generateBill(orderData);
                }
                return true;
            } else {
                alert('Failed to place order: ' + data.error);
                return false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while placing the order.');
            return false;
        });
    }

    // Add payment status checking functions
    function startPaymentStatusCheck(transactionId) {
        let attempts = 0;
        const maxAttempts = 60; // 1 minute (checking every second)
        
        const checkInterval = setInterval(async () => {
            attempts++;
            try {
                const response = await fetch(`/check-payment-status/?transaction_id=${transactionId}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    clearInterval(checkInterval);
                    showPaymentSuccess();
                } else if (data.status === 'error') {
                    clearInterval(checkInterval);
                    alert('Payment verification failed: ' + data.message);
                    handlePaymentTimeout();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    handlePaymentTimeout();
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 1000);
    }

    function showPaymentSuccess() {
        const successOverlay = document.getElementById('successOverlay');
        successOverlay.style.display = 'flex';
        
        setTimeout(() => {
            document.getElementById('upiQrCode').style.display = 'none';
            successOverlay.style.display = 'none';
            
            if (window.pendingOrderData) {
                placeOrder(window.pendingOrderData);
                window.pendingOrderData = null;
                clearSelectedItems();
            }
        }, 2000);
    }

    function handlePaymentTimeout() {
        alert('Payment timeout. Please try again.');
        document.getElementById('upiQrCode').style.display = 'none';
        window.pendingOrderData = null;
    }

    function showQrCode(upiQrCodeUrl) {
        var upiQrCode = document.getElementById('upiQrCode');
        var upiQrCodeImage = document.getElementById('upiQrCodeImage');
        upiQrCodeImage.src = upiQrCodeUrl;
        upiQrCode.style.display = 'block';
    }

    function closeSidebar() {
        selectionSidebar.classList.remove('open');
        // Remove mainContent class changes since we're using flex layout
    }

    function clearSelectedItems() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        while (selectedItems.length > 0) {
            selectedItems[0].classList.remove('selected');
        }
        selectedItemsList.innerHTML = '';
        localStorage.removeItem('selectedItems');
        updateTotalAmount();
        closeSidebar();
    }

    function generateBill(orderData) {
        var billWindow = window.open('', 'PRINT', 'height=400,width=600');
        billWindow.document.write('<html><head><title>Bill</title>');
        billWindow.document.write('<style>body { font-family: Arial, sans-serif; width: 58mm; margin: 0; padding: 0; } .bill-container { padding: 10px; } .bill-header, .bill-footer { text-align: center; } .bill-header h1, .bill-footer p { margin: 0; } .bill-details, .bill-items { width: 100%; margin-top: 10px; } .bill-items th, .bill-items td { text-align: left; padding: 5px; border-bottom: 1px solid #000; } .bill-items th { background-color: #f0f0f0; } .bill-total { text-align: right; margin-top: 10px; }</style>');
        billWindow.document.write('</head><body>');
        billWindow.document.write('<div class="bill-container">');
        billWindow.document.write('<div class="bill-header"><h1>Bill</h1><p>Order ID: ' + orderData.orderId + '</p><p>Date: ' + orderData.date + '</p><p>Time: ' + orderData.time + '</p></div>');
        billWindow.document.write('<table class="bill-details"><tr><td>Payment Type:</td><td>' + orderData.paymentType + '</td></tr><tr><td>Order Type:</td><td>' + orderData.orderType + '</td></tr></table>');
        billWindow.document.write('<table class="bill-items"><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>');
        orderData.items.forEach(function(item) {
            billWindow.document.write('<tr><td>' + item.name + '</td><td>' + item.quantity + '</td><td>₹' + item.price + '</td></tr>');
        });
        billWindow.document.write('</tbody></table>');
        billWindow.document.write('<div class="bill-total"><p>Total: ₹' + orderData.totalAmount + '</p><p>GST (18%): ₹' + orderData.gstAmount + '</p><p>Grand Total: ₹' + orderData.grandTotal + '</p></div>');
        billWindow.document.write('<div class="bill-footer"><p>Thank you for your order!</p></div>');
        billWindow.document.write('</div>');
        billWindow.document.write('</body></html>');
        billWindow.document.close();
        billWindow.print();
    }

    // Load items for the selected category without reloading the page
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
                var selectedIds = JSON.parse(localStorage.getItem('selectedItems')) || [];
                itemsContainer.innerHTML = '';
                data.items.forEach(function(item) {
                    var itemCube = document.createElement('div');
                    itemCube.classList.add('item-cube');
                    itemCube.setAttribute('data-item-id', item.id);
                    itemCube.setAttribute('data-item-name', item.name);
                    itemCube.setAttribute('data-item-price', item.price);
                    itemCube.innerHTML = `
                        <h3 class="text-xl font-bold mb-2">${item.name}</h3>
                        <img src="${item.image}" alt="${item.name}">
                    `;
                    if (selectedIds.includes(item.id.toString())) {
                        itemCube.classList.add('selected');
                    }
                    itemCube.addEventListener('click', function() {
                        selectItem(this);
                    });
                    itemsContainer.appendChild(itemCube);
                });
                updateSidebar();
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
});