document.addEventListener('DOMContentLoaded', function() {
    const selectedTable = localStorage.getItem('selectedTable');
    if (selectedTable) {
        const selectedTableElement = document.getElementById('selectedTable');
        if (selectedTableElement) {
            selectedTableElement.innerText = `Table: ${selectedTable.replace('table-', '')}`;
        } else {
            console.error('Element with ID "selectedTable" not found.');
        }
    }

    const element = document.getElementById('yourElementId');
    if (element) {
        element.innerText = 'Your text here';
    } else {
        console.error('Element with ID "yourElementId" not found.');
    }
});
