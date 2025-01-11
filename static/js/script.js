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

    // Ensure the checkout button exists before adding the event listener
    // var checkoutButton = document.querySelector('.checkout');
    // if (checkoutButton) {
    //     checkoutButton.addEventListener('click', function() {
    //         var selectedItems = document.getElementsByClassName('item-cube selected');
    //         var orderItems = [];
    //         var totalAmount = 0;
    //         for (var i = 0; i < selectedItems.length; i++) {
    //             var itemId = selectedItems[i].getAttribute('data-item-id');
    //             var itemName = selectedItems[i].getAttribute('data-item-name');
    //             var itemPrice = parseFloat(selectedItems[i].getAttribute('data-item-price'));
    //             var quantityElement = document.getElementById(`quantity-${itemId}`);
    //             if (quantityElement) {
    //                 var quantity = parseInt(quantityElement.innerText);
    //                 totalAmount += itemPrice * quantity;
    //                 orderItems.push({
    //                     id: itemId,
    //                     name: itemName,
    //                     price: itemPrice,
    //                     quantity: quantity
    //                 });
    //             }
    //         }
    //         var gstAmount = totalAmount * 0.18;
    //         var grandTotal = totalAmount + gstAmount;
    //         var paymentType = document.querySelector('input[name="payment_type"]:checked').value;
    //         var orderType = document.querySelector('input[name="order_type"]:checked').value;
    //         var orderData = {
    //             orderId: Date.now().toString(),
    //             items: orderItems,
    //             totalAmount: totalAmount.toFixed(2),
    //             gstAmount: gstAmount.toFixed(2),
    //             grandTotal: grandTotal.toFixed(2),
    //             paymentType: paymentType,
    //             orderType: orderType,
    //             time: new Date().toLocaleTimeString('en-US', { hour12: true }),  // Ensure time includes AM/PM
    //             date: new Date().toISOString().split('T')[0]
    //         };
    //         fetch('/place-order/', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'X-CSRFToken': '{{ csrf_token }}'
    //             },
    //             body: JSON.stringify(orderData)
    //         })
    //         .then(response => response.json())
    //         .then(data => {
    //             if (data.status === 'success') {
    //                 alert('Order placed successfully!');
    //                 console.log(orderData);
    //                 clearSelectedItems();
    //             } else {
    //                 alert('Failed to place order: ' + data.error);
    //             }
    //         })
    //         .catch(error => {
    //             console.error('Error:', error);
    //             alert('An error occurred while placing the order.');
    //         });
    //     });
    // }

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

    // Example booking buttons
    document.querySelectorAll('.book-button').forEach(function(button) {
        button.addEventListener('click', function() {
            const tableId = this.getAttribute('data-table-id');
            bookTable(tableId);
        });
    });

    // Ensure the modal and close button are handled here if not already in order_data.html
    // If the modal is fully handled in order_data.html, this section can remain unchanged
});

function promptForPassword(orderId) {
    const password = prompt("Enter your password to delete this order:");
    if (password) {
        verifyPassword(password, orderId);
    }
}

function verifyPassword(password, orderId) {
    fetch(`/verify-password/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            promptForReason(orderId);
        } else {
            alert('Password incorrect. Cannot delete the order.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while verifying the password.');
    });
}

function promptForReason(orderId) {
    const reason = prompt("Enter the reason for deleting this order:");
    if (reason) {
        deleteOrder(orderId, reason);
    }
}

function deleteOrder(orderId, reason) {
    fetch(`/delete-order/${orderId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ reason: reason })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const row = document.querySelector(`button[data-order-id="${orderId}"]`).closest('tr');
            row.classList.add('bg-red-700');
            alert('Order deleted successfully!');
        } else {
            alert('Failed to delete order: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the order.');
    });
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}
