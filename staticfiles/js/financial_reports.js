document.addEventListener('DOMContentLoaded', function() {
    // Single initialization function
    function initializeDatePickers() {
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        const applyButton = document.getElementById('apply-dates');
        
        // Set today as max date
        const today = new Date();
        const maxDate = today.toISOString().split('T')[0];
        endDate.max = maxDate;
        startDate.max = maxDate;

        // Set default to month view if no dates selected
        if (!startDate.value) {
            const monthAgo = new Date(today);
            monthAgo.setDate(today.getDate() - 30);
            startDate.value = monthAgo.toISOString().split('T')[0];
            endDate.value = maxDate;
        }

        // Add click handlers for radio buttons
        document.querySelectorAll('.date-shortcut').forEach(radio => {
            radio.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Update visual state
                document.querySelectorAll('.period-btn').forEach(btn => {
                    btn.classList.remove('active', 'bg-blue-500', 'text-white');
                    btn.classList.add('text-gray-300');
                });
                
                let btn = this.nextElementSibling;
                btn.classList.add('active', 'bg-blue-500', 'text-white');
                btn.classList.remove('text-gray-300');

                // Calculate dates
                const newStartDate = new Date(today);
                switch(this.value) {
                    case 'day':
                        // Same day
                        break;
                    case 'week':
                        newStartDate.setDate(today.getDate() - 7);
                        break;
                    case 'month':
                        newStartDate.setDate(today.getDate() - 30);
                        break;
                    case 'year':
                        newStartDate.setDate(today.getDate() - 365);
                        break;
                }

                // Update inputs
                startDate.value = newStartDate.toISOString().split('T')[0];
                endDate.value = maxDate;

                // Trigger apply
                if (applyButton) {
                    applyButton.click();
                }
            });
        });

        // Apply button handler
        if (applyButton) {
            applyButton.addEventListener('click', function() {
                if (startDate.value && endDate.value) {
                    const url = new URL(window.location);
                    url.searchParams.set('start_date', startDate.value);
                    url.searchParams.set('end_date', endDate.value);
                    window.location.href = url.toString();
                }
            });
        }
    }

    // Initialize everything
    initializeDatePickers();

    // Optionally initialize chart if data exists
    if (window.financialData?.revenueData) {
        initializeRevenueChart();
    }
});

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

