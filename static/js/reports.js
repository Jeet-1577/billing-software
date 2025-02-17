document.addEventListener('DOMContentLoaded', function() {
    // Initialize print button
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', function() {
            // Remove non-printable elements temporarily
            const nonPrintables = document.querySelectorAll('.no-print');
            nonPrintables.forEach(el => el.style.display = 'none');

            // Print
            window.print();

            // Restore non-printable elements
            nonPrintables.forEach(el => el.style.display = '');
        });
    }
});
