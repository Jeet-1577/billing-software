// ...existing code...

function showTableOrderDetails(tableNumber) {
    fetch(`/api/table-order/${tableNumber}/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.table_orders.length > 0) {
                const popup = document.getElementById('tableOrderDetailsPopup');
                const content = document.getElementById('orderDetailsContent');
                const detailsList = document.getElementById('orderDetailsList');
                const editBtn = document.getElementById('editOrderBtn');
                
                // Get the most recent order
                const latestOrder = data.table_orders[0];
                
                // Show/hide edit button based on order status
                if (latestOrder.status === 'active') {
                    editBtn.classList.remove('hidden');
                    editBtn.setAttribute('data-order-id', latestOrder.table_order_id);
                } else {
                    editBtn.classList.add('hidden');
                }

                // Populate order details
                detailsList.innerHTML = `
                    <p><strong>Order ID:</strong> ${latestOrder.table_order_id}</p>
                    <p><strong>Status:</strong> ${latestOrder.status}</p>
                    <p><strong>Subtotal:</strong> ₹${latestOrder.subtotal}</p>
                    <p><strong>GST Amount:</strong> ₹${latestOrder.gst_amount}</p>
                    <p><strong>Grand Total:</strong> ₹${latestOrder.grand_total}</p>
                    <div class="mt-4">
                        <h4 class="font-bold mb-2">Items:</h4>
                        <ul class="space-y-2">
                            ${latestOrder.items.map(item => `
                                <li class="flex justify-between">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>₹${parseFloat(item.total_price).toFixed(2)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;

                // Show popup with animation
                popup.classList.remove('hidden');
                popup.classList.add('flex');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 10);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to fetch order details');
        });
}

// ...existing code...