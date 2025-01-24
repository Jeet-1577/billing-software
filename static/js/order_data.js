document.addEventListener('DOMContentLoaded', function() {
    // Event listener for "view-order" buttons
    document.querySelectorAll('.view-order').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            fetchOrderDetails(orderId);
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

    // Function to close the modal
    function closeOrderDetailsModal() {
        const modal = document.getElementById('orderDetailsModal');
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }

    // Event listener for closing the modal
    const closeButton = document.getElementById('closeOrderDetailsModal');
    if (closeButton) {
        closeButton.addEventListener('click', closeOrderDetailsModal);
    }

    // Close modal when clicking outside the modal content
    const modalOverlay = document.getElementById('orderDetailsModal');
    modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) {
            closeOrderDetailsModal();
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
            if (cells.length >= 9) { // Ensure enough cells
                const rowOrderId = cells[0].textContent.toLowerCase();
                const rowSubtotal = cells[1].textContent.toLowerCase();
                const rowGstAmount = cells[2].textContent.toLowerCase();
                const rowGrandTotal = cells[3].textContent.toLowerCase();
                const rowPaymentType = cells[4].textContent.toLowerCase();
                const rowOrderType = cells[5].textContent.toLowerCase();
                const rowDate = cells[6].textContent;
                const rowTime = cells[7].textContent.toLowerCase();
                const rowStatus = cells[8].textContent.toLowerCase();

                // Check Status
                const statusMatch = status ? rowStatus === status : true;

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


