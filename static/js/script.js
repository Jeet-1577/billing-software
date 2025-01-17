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
// Utility Functions
function prepareOrderData() {
    const selectedItems = document.querySelectorAll('.item-cube.selected');
    const orderItems = [];
    let totalAmount = 0;

    selectedItems.forEach(item => {
        const itemId = item.dataset.itemId;
        const itemName = item.dataset.itemName;
        const itemPrice = parseFloat(item.dataset.itemPrice);
        const quantity = parseInt(document.getElementById(`quantity-${itemId}`).innerText);

        if (quantity > 0) {
            totalAmount += itemPrice * quantity;
            orderItems.push({
                id: itemId,
                name: itemName,
                price: itemPrice,
                quantity: quantity
            });
        }
    });

    const gstAmount = totalAmount * 0.18;
    const grandTotal = totalAmount + gstAmount;
    const paymentType = document.querySelector('input[name="payment_type"]:checked').value;
    const orderType = document.querySelector('input[name="order_type"]:checked').value;

    return {
        orderId: Date.now().toString(),
        items: orderItems,
        totalAmount: totalAmount.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        paymentType: paymentType,
        orderType: orderType,
        time: new Date().toLocaleTimeString('en-US', { hour12: true }),
        date: new Date().toISOString().split('T')[0]
    };
}

// Main Functions
function placeOrder() {
    const orderData = prepareOrderData(); // Use the reusable function
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

// Example of how to call the save_note endpoint
function saveNote(itemId, note) {
    fetch('/save-note/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  // Ensure CSRF token is included
        },
        body: JSON.stringify({ itemId: itemId, note: note })
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success'){
            alert('Note saved successfully!');
        } else {
            alert('Error saving note: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function fetchOrderDetails(orderId) {
    if (!orderId) {
        console.error('Invalid Order ID:', orderId);
        alert('Invalid Order ID.');
        return;
    }

    fetch(`/order-details/${orderId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showOrderDetailsModal(data.order);
            } else {
                alert('Failed to fetch order details: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error fetching order details:', error);
            alert('An error occurred while fetching the order details.');
        });
}
