document.addEventListener('DOMContentLoaded', function() {
    // Event listener for "view-order" buttons
    document.querySelectorAll('.view-order').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            fetchOrderDetails(orderId);
        });
    });

    // Event listener for "delete-order" buttons
    document.querySelectorAll('.delete-order').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            openDeleteOrderModal(orderId);
        });
    });

    // Event listener for deleted order ID links
    document.querySelectorAll('.deleted-order-id').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const deletionReason = this.getAttribute('data-deletion-reason');
            const deletedBy = this.getAttribute('data-deleted_by');
            showDeletionDetails(deletedBy, deletionReason);
        });
    });

    // Function to fetch order details from the backend
    function fetchOrderDetails(orderId) {
        fetch(`/get-order-details/?order_id=${orderId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    displayOrderDetails(data.order);
                } else {
                    alert('Failed to fetch order details: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
                alert('An error occurred while fetching the order details.');
            });
    }

    // Function to display order details in the modal
    function displayOrderDetails(order) {
        const orderDetailsContent = document.getElementById('orderDetailsContent');
        orderDetailsContent.innerHTML = `
            <div class="border-b border-gray-700 pb-2 mb-2">
                <h4 class="text-lg font-bold">Order ID: ${order.order_id}</h4>
                <div class="flex flex-wrap justify-between gap-4">
                    <div class="flex-1 min-w-[45%]">
                        <p><strong>Date:</strong> ${order.date}</p>
                    </div>
                    <div class="flex-1 min-w-[45%]">
                        <p><strong>Time:</strong> ${order.time}</p>
                    </div>
                    <div class="flex-1 min-w-full">
                        <p><strong>Payment Type:</strong> ${order.payment_type}</p>
                    </div>
                    <div class="flex-1 min-w-full">
                        <p><strong>Order Type:</strong> ${order.order_type}</p>
                    </div>
                </div>
            </div>
            <div class="border-b border-gray-700 pb-2 mb-2">
                <h4 class="text-lg font-bold">Items:</h4>
                <ul class="list-disc pl-5 space-y-2 items-container">
                    ${order.items.map(item => `
                        <li>
                            <p><strong>${item.name}</strong> (x${item.quantity}) - ₹${parseFloat(item.total_price).toFixed(2)}</p>
                            ${item.customizations.length > 0 ? `
                                <ul class="list-disc pl-5 space-y-1">
                                    ${item.customizations.map(c => `
                                        <li>${c.name} - ₹${parseFloat(c.price).toFixed(2)}</li>
                                    `).join('')}
                                </ul>
                            ` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="flex flex-wrap justify-between gap-4">
                <div class="flex-1 min-w-[45%]">
                    <p><strong>Subtotal:</strong> ₹${parseFloat(order.subtotal).toFixed(2)}</p>
                </div>
                <div class="flex-1 min-w-[45%]">
                    <p><strong>GST Amount:</strong> ₹${parseFloat(order.gst_amount).toFixed(2)}</p>
                </div>
                <div class="flex-1 min-w-[45%]">
                    <p><strong>Grand Total:</strong> ₹${parseFloat(order.grand_total).toFixed(2)}</p>
                </div>
            </div>
        `;

        // Remove scrollbar from the entire modal
        const modalInnerContent = orderDetailsContent.parentElement;
        if (modalInnerContent) {
            modalInnerContent.style.overflow = 'hidden';
        }

        // Add scrollbar to the items container only
        const itemsContainer = orderDetailsContent.querySelector('.items-container');
        if (itemsContainer) {
            itemsContainer.style.maxHeight = '200px'; // Adjust height as needed
            itemsContainer.style.overflowY = 'auto';
        }

        const modal = document.getElementById('orderDetailsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    // Function to open the delete order modal
    function openDeleteOrderModal(orderId) {
        const modal = document.getElementById('deleteOrderModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('data-order-id', orderId);
    }

    // Function to close the delete order modal
    function closeDeleteOrderModal() {
        const modal = document.getElementById('deleteOrderModal');
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.removeAttribute('data-order-id');
        document.getElementById('deleteOrderForm').reset();
    }

    // Function to close the modal
    function closeOrderDetailsModal() {
        const modal = document.getElementById('orderDetailsModal');
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }

    // Function to display deletion details in the modal
    function showDeletionDetails(deletedBy, reason) {
        document.getElementById('deletedByName').textContent = deletedBy || 'N/A';
        document.getElementById('deletionReason').textContent = reason || 'No reason provided.';
        const modal = document.getElementById('deletionDetailsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    // Function to close the deletion details modal
    function closeDeletionDetailsModal() {
        const modal = document.getElementById('deletionDetailsModal');
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }

    // Event listener for closing the modal
    const closeButton = document.getElementById('closeOrderDetailsModal');
    if (closeButton) {
        closeButton.addEventListener('click', closeOrderDetailsModal);
    }

    // Event listener for closing the deletion details modal
    const closeDeletionDetailsBtn = document.getElementById('closeDeletionDetailsModal');
    if (closeDeletionDetailsBtn) {
        closeDeletionDetailsBtn.addEventListener('click', closeDeletionDetailsModal);
    }

    // Event listener for cancel button in the modal
    const cancelDeleteButton = document.getElementById('cancelDelete');
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', closeDeleteOrderModal);
    }

    // Event listener for form submission in the modal
    const deleteOrderForm = document.getElementById('deleteOrderForm');
    if (deleteOrderForm) {
        deleteOrderForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const modal = document.getElementById('deleteOrderModal');
            const orderId = modal.getAttribute('data-order-id');
            const employeeId = document.getElementById('employeeId').value.trim();
            const password = document.getElementById('password').value;
            const reason = document.getElementById('reason').value.trim();

            if (!employeeId || !password || !reason) {
                alert('All fields are required.');
                return;
            }

            // Verify employee credentials
            fetch('/verify-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({ employee_id: employeeId, password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Proceed to delete the order
                    deleteOrder(orderId, reason);
                } else {
                    alert('Authentication failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error verifying credentials:', error);
                alert('An error occurred during authentication.');
            });
        });
    }

    // Function to delete the order
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
                closeDeleteOrderModal();

                // Find the row/container of the deleted order
                const button = document.querySelector(`.delete-order[data-order-id="${orderId}"]`);
                if (button) {
                    const row = button.closest('tr') || button.closest('.order-row');
                    if (row) {
                        // Add your existing CSS class for deleted orders
                        row.classList.add('deleted-order');
                    }
                }
                // Refresh page after successful delete
                window.location.reload();
            } else {
                alert('Failed to delete order: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting order:', error);
            alert('An error occurred while deleting the order.');
        });
    }

    // Helper function to get CSRF token from cookies
    function getCSRFToken() {
        let cookieValue = null;
        const name = 'csrftoken';
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

    // Close modal when clicking outside the modal content
    const modalOverlay = document.getElementById('orderDetailsModal');
    modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) {
            closeOrderDetailsModal();
        }
    });

    // Close the modal when clicking outside of it
    const deleteModalOverlay = document.getElementById('deleteOrderModal');
    deleteModalOverlay.addEventListener('click', function(event) {
        if (event.target === deleteModalOverlay) {
            closeDeleteOrderModal();
        }
    });

    // Close modal when clicking outside the modal content
    const deletionModalOverlay = document.getElementById('deletionDetailsModal');
    deletionModalOverlay.addEventListener('click', function(event) {
        if (event.target === deletionModalOverlay) {
            closeDeletionDetailsModal();
        }
    });

    // Get filter and search elements
    const filterStatus = document.getElementById('filterStatus');
    const filterPaymentType = document.getElementById('filterPaymentType');
    const filterOrderType = document.getElementById('filterOrderType');
    const filterFromDate = document.getElementById('filterFromDate');
    const filterToDate = document.getElementById('filterToDate');
    const searchOrderId = document.getElementById('searchOrderId');
    const ordersTableBody = document.getElementById('ordersTableBody');

    // Function to debounce rapid function calls
    function debounce(func, delay) {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Function to filter orders
    function filterOrders() {
        const status = filterStatus.value.toLowerCase();
        const paymentType = filterPaymentType.value.toLowerCase();
        const orderType = filterOrderType.value.toLowerCase();
        const fromDate = filterFromDate.value;
        const toDate = filterToDate.value;
        const searchQuery = searchOrderId.value.trim().toLowerCase();

        // Get all table rows
        const rows = ordersTableBody.getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            const rowStatus = (row.dataset.status || '').toLowerCase();
            if (cells.length >= 9) { // Ensure enough cells
                const rowOrderId = cells[0].textContent.toLowerCase();
                const rowSubtotal = cells[1].textContent.toLowerCase();
                const rowGstAmount = cells[2].textContent.toLowerCase();
                const rowGrandTotal = cells[3].textContent.toLowerCase();
                const rowPaymentType = cells[4].textContent.toLowerCase();
                const rowOrderType = cells[5].textContent.toLowerCase();
                const rowDate = cells[6].textContent;
                const rowTime = cells[7].textContent.toLowerCase();
                // const rowStatus = cells[8].textContent.toLowerCase();

                // Check Status
                let statusMatch = true;
                if (status === 'deleted') {
                    statusMatch = rowStatus === 'deleted';
                } else if (status === 'completed') {
                    statusMatch = rowStatus !== 'deleted';
                } else {
                    statusMatch = status ? rowStatus === status : true;
                }

                // Check Payment Type
                const paymentMatch = paymentType ? rowPaymentType === paymentType : true;
                
                // Check Order Type
                const orderTypeMatch = orderType ? rowOrderType === orderType : true;

                // Check Date Range
                let dateMatch = true;
                if (fromDate) {
                    dateMatch = dateMatch && (new Date(rowDate) >= new Date(fromDate));
                }
                if (toDate) {
                    dateMatch = dateMatch && (new Date(rowDate) <= new Date(toDate));
                }

                // Check Search Query
                const searchMatch = searchQuery ? rowOrderId.includes(searchQuery) : true;

                // Combine all conditions
                if (statusMatch && paymentMatch && orderTypeMatch && dateMatch && searchMatch) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }

    // Attach event listeners
    filterStatus.addEventListener('change', filterOrders);
    filterPaymentType.addEventListener('change', filterOrders);
    filterOrderType.addEventListener('change', filterOrders);
    filterFromDate.addEventListener('change', filterOrders);
    filterToDate.addEventListener('change', filterOrders);
    searchOrderId.addEventListener('input', debounce(filterOrders, 300));

    // Initial filter to display all orders
    filterOrders();
});

