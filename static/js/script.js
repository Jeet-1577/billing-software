document.addEventListener('DOMContentLoaded', function() {
    var sidebar = document.getElementById('sidebar');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var inventoryLink = document.getElementById('inventoryLink');
    var customizeButton = document.getElementById('customizeButton');
    var customizeDropdown = document.getElementById('customizeDropdown');

    // Show/Hide Customize Dropdown with Animation
    if (customizeButton) {
        customizeButton.addEventListener('mouseenter', function() {
            customizeDropdown.classList.remove('hidden');
            setTimeout(function() {
                customizeDropdown.classList.add('opacity-100');
                customizeDropdown.classList.add('scale-100');
            }, 10); // Delay to ensure the transition works
        });
        customizeButton.addEventListener('mouseleave', function() {
            customizeDropdown.classList.remove('opacity-100');
            customizeDropdown.classList.remove('scale-100');
            setTimeout(function() {
                customizeDropdown.classList.add('hidden');
            }, 300); // Match the duration of the transition
        });
        customizeDropdown.addEventListener('mouseenter', function() {
            customizeDropdown.classList.remove('hidden');
            customizeDropdown.classList.add('opacity-100');
            customizeDropdown.classList.add('scale-100');
        });
        customizeDropdown.addEventListener('mouseleave', function() {
            customizeDropdown.classList.remove('opacity-100');
            customizeDropdown.classList.remove('scale-100');
            setTimeout(function() {
                customizeDropdown.classList.add('hidden');
            }, 300); // Match the duration of the transition
        });
    }

    // Revenue Chart
    var ctxRevenue = document.getElementById('revenueChart');
    if (ctxRevenue) {
        new Chart(ctxRevenue.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 15000, 10000, 20000, 18000, 22000, 25000],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Revenue (₹)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                }
            }
        });
    }

    // Orders Chart
    var ctxOrders = document.getElementById('ordersChart');
    if (ctxOrders) {
        new Chart(ctxOrders.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [{
                    label: 'Orders',
                    data: [100, 150, 130, 170, 200, 220, 250],
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Orders'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                }
            }
        });
    }

    // Order Types Chart
    var ctxOrderTypes = document.getElementById('orderTypesChart');
    if (ctxOrderTypes) {
        new Chart(ctxOrderTypes.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Dine In', 'Take Away', 'Delivery'],
                datasets: [{
                    label: 'Order Types',
                    data: [45, 25, 30],
                    backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                }
            }
        });
    }

    // Shortcut key to focus on the search bar
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            var searchInput = document.getElementById('searchInput'); // Ensure searchInput is defined
            if (searchInput) {
                searchInput.focus();
            }
        }
    });

    document.querySelector('.checkout').addEventListener('click', function() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        var orderItems = [];
        var totalAmount = 0;
        for (var i = 0; i < selectedItems.length; i++) {
            var itemId = selectedItems[i].getAttribute('data-item-id');
            var itemName = selectedItems[i].getAttribute('data-item-name');
            var itemPrice = parseFloat(selectedItems[i].getAttribute('data-item-price'));
            var quantityElement = document.getElementById(`quantity-${itemId}`);
            if (quantityElement) {
                var quantity = parseInt(quantityElement.innerText);
                totalAmount += itemPrice * quantity;
                orderItems.push({
                    id: itemId,
                    name: itemName,
                    price: itemPrice,
                    quantity: quantity
                });
            }
        }
        var gstAmount = totalAmount * 0.18;
        var grandTotal = totalAmount + gstAmount;
        var paymentType = document.querySelector('input[name="payment_type"]:checked').value;
        var orderType = document.querySelector('input[name="order_type"]:checked').value;
        var orderData = {
            orderId: Date.now().toString(),
            items: orderItems,
            totalAmount: totalAmount.toFixed(2),
            gstAmount: gstAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            paymentType: paymentType,
            orderType: orderType,
            time: new Date().toLocaleTimeString('en-US', { hour12: true }),  // Ensure time includes AM/PM
            date: new Date().toISOString().split('T')[0]
        };
        fetch('/place-order/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Order placed successfully!');
                console.log(orderData);
                generateBill(orderData);
                clearSelectedItems();
            } else {
                alert('Failed to place order: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while placing the order.');
        });
    });

    function clearSelectedItems() {
        var selectedItems = document.getElementsByClassName('item-cube selected');
        while (selectedItems.length > 0) {
            var item = selectedItems[0];
            item.classList.remove('selected');
            item.removeAttribute('data-selected-customizations');
            item.removeAttribute('data-total-price');
            item.removeAttribute('data-unique-id');
        }
        document.getElementById('selectedItemsList').innerHTML = '';
        localStorage.removeItem('selectedItemsData');
        updateTotalAmount();
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
});
