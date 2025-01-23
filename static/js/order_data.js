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
                <div class="grid grid-cols-2 gap-4">
                    <p><strong>Date:</strong> ${order.date}</p>
                    <p><strong>Time:</strong> ${order.time}</p>
                    <p><strong>Payment Type:</strong> ${order.payment_type}</p>
                    <p><strong>Order Type:</strong> ${order.order_type}</p>
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
            <div class="grid grid-cols-2 gap-4">
                <p><strong>Subtotal:</strong> ₹${parseFloat(order.subtotal).toFixed(2)}</p>
                <p><strong>GST Amount:</strong> ₹${parseFloat(order.gst_amount).toFixed(2)}</p>
                <p><strong>Grand Total:</strong> ₹${parseFloat(order.grand_total).toFixed(2)}</p>
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
});


