document.addEventListener('DOMContentLoaded', function() {
    // Set month as default if no dates are selected
    if (!document.getElementById('start-date').value) {
        const monthRadio = document.querySelector('input[value="month"]');
        if (monthRadio) {
            monthRadio.checked = true;
            monthRadio.dispatchEvent(new Event('change'));
        }
    }

    // Add active class to the selected period button
    document.querySelectorAll('.date-shortcut').forEach(radio => {
        if (radio.checked) {
            radio.nextElementSibling.classList.add('active');
        }
    });

    initializeTimePicker();
    initializeRevenueChart();
    initializeActions();

    // Add shortcut date handlers
    document.querySelectorAll('.date-shortcut').forEach(radio => {
        radio.addEventListener('change', function() {
            const today = new Date();
            let startDate = new Date();
            
            switch(this.value) {
                case 'day':
                    startDate = today;
                    break;
                case 'week':
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    startDate.setDate(today.getDate() - 30);
                    break;
                case 'year':
                    startDate.setDate(today.getDate() - 365);
                    break;
            }
            
            // Update the date inputs
            document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
            document.getElementById('end-date').value = today.toISOString().split('T')[0];
            
            // Automatically apply the date range
            document.getElementById('apply-dates').click();
        });
    });
});

function initializeTimePicker() {
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const applyButton = document.getElementById('apply-dates');

    // Initialize date range inputs and radio buttons
    document.querySelectorAll('.date-shortcut').forEach(radio => {
        radio.addEventListener('change', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected button
            this.nextElementSibling.classList.add('active');

            const today = new Date();
            let startDate = new Date();
            
            switch(this.value) {
                case 'day':
                    startDate = new Date(today);
                    break;
                case 'week':
                    startDate = new Date(today.setDate(today.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(today.setDate(today.getDate() - 30));
                    break;
                case 'year':
                    startDate = new Date(today.setDate(today.getDate() - 365));
                    break;
            }
            
            // Update date inputs
            document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
            document.getElementById('end-date').value = new Date().toISOString().split('T')[0];
            
            // Trigger click on apply button
            document.getElementById('apply-dates').click();
        });
    });

    // Set min/max dates
    const maxDate = new Date().toISOString().split('T')[0];
    endDate.max = maxDate;
    startDate.max = maxDate;

    // Ensure end date is not before start date
    startDate.addEventListener('change', function() {
        if (endDate.value && endDate.value < this.value) {
            endDate.value = this.value;
        }
        endDate.min = this.value;
    });

    // Apply button click handler
    applyButton.addEventListener('click', function() {
        if (startDate.value && endDate.value) {
            const url = new URL(window.location);
            url.searchParams.set('start_date', startDate.value);
            url.searchParams.set('end_date', endDate.value);
            window.location.href = url.toString();
        }
    });

    // Add animation when changing periods
    document.querySelectorAll('.date-shortcut').forEach(radio => {
        radio.addEventListener('change', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected button with animation
            const btn = this.nextElementSibling;
            btn.classList.add('active');
            
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            btn.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => ripple.remove(), 1000);

            // ... rest of your date changing logic ...
        });
    });
}

function initializeRevenueChart() {
    if (!window.financialData) return;

    const options = {
        series: [{
            name: 'Revenue',
            data: window.financialData.revenueData
        }],
        chart: {
            type: 'area',
            height: 320,
            toolbar: { show: false },
            foreColor: '#9CA3AF'
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: window.initialData.daily_revenue_dates,
            type: 'datetime',
            labels: {
                datetimeFormatter: {
                    year: 'yyyy',
                    month: 'MMM',
                    day: 'dd',
                }
            }
        },
        yaxis: {
            labels: {
                formatter: function(value) {
                    return '₹' + value.toFixed(0);
                }
            }
        },
        tooltip: {
            theme: 'dark',
            x: {
                format: 'dd MMM yyyy'
            },
            y: {
                formatter: function(value) {
                    return '₹' + value.toFixed(2);
                }
            }
        },
        grid: {
            borderColor: '#374151',
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        }
    };

    const chart = new ApexCharts(document.querySelector("#revenueTrendChart"), options);
    chart.render();
}

function initializeActions() {
    // Export button
    const exportBtn = document.querySelector('[data-action="export"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const period = getCurrentPeriod();
            window.location.href = `/reports/financial/export/?period=${period}`;
        });
    }

    // Share button
    const shareBtn = document.querySelector('[data-action="share"]');
    if (shareBtn) {
        shareBtn.addEventListener('click', async function() {
            const shareData = {
                title: 'Financial Report',
                text: 'Check out our financial report',
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                }
            } catch (err) {
                console.error('Error sharing:', err);
            }
        });
    }
}

function getCurrentPeriod() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('period') || 'month';
}

