// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function () {
    // Load initial data and populate charts
    loadData();

    // Load saved filters
    loadSavedFilters();

    // Set up event listeners
    document.getElementById('filter-form').addEventListener('submit', function (e) {
        e.preventDefault();
        loadData();
    });

    document.getElementById('save-filter').addEventListener('click', saveCurrentFilter);
});

// Function to load data and update charts
function loadData() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const location = document.getElementById('location').value;

    // Show loading indicators
    document.getElementById('cases-chart').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    document.getElementById('deaths-chart').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    document.getElementById('pie-chart').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    // Fetch data from API
    fetch(`/api/data?start_date=${startDate}&end_date=${endDate}&location=${location}`)
        .then(response => response.json())
        .then(data => {
            // Update charts
            Plotly.newPlot('cases-chart', JSON.parse(data.line_cases));
            Plotly.newPlot('deaths-chart', JSON.parse(data.line_deaths));
            Plotly.newPlot('pie-chart', JSON.parse(data.pie_chart));

            // Update location dropdown if needed
            const locationSelect = document.getElementById('location');
            if (locationSelect.options.length <= 1) {
                data.countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    locationSelect.appendChild(option);
                });
            }

            // Update data summary
            updateDataSummary(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load data. Please try again.');
        });
}

// Function to save current filter
function saveCurrentFilter() {
    const filterName = document.getElementById('filter-name').value;
    if (!filterName) {
        alert('Please enter a name for this filter');
        return;
    }

    const filterData = {
        name: filterName,
        start_date: document.getElementById('start-date').value,
        end_date: document.getElementById('end-date').value,
        location: document.getElementById('location').value
    };

    fetch('/api/save_filter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('filter-name').value = '';
                loadSavedFilters();
            } else {
                alert('Failed to save filter');
            }
        })
        .catch(error => {
            console.error('Error saving filter:', error);
            alert('Failed to save filter. Please try again.');
        });
}

// Function to load saved filters
function loadSavedFilters() {
    fetch('/api/get_filters')
        .then(response => response.json())
        .then(data => {
            const filtersList = document.getElementById('saved-filters-list');
            filtersList.innerHTML = '';

            if (data.filters.length === 0) {
                filtersList.innerHTML = '<p class="text-muted">No saved filters</p>';
                return;
            }

            data.filters.forEach(filter => {
                const filterElement = document.createElement('div');
                filterElement.className = 'saved-filter';
                filterElement.textContent = filter.filter_name;
                filterElement.addEventListener('click', function () {
                    // Apply this filter
                    document.getElementById('start-date').value = filter.start_date;
                    document.getElementById('end-date').value = filter.end_date;
                    document.getElementById('location').value = filter.location || '';
                    loadData();
                });
                filtersList.appendChild(filterElement);
            });
        })
        .catch(error => {
            console.error('Error loading saved filters:', error);
        });
}

// Function to update data summary
function updateDataSummary(data) {
    const summaryElement = document.getElementById('data-summary');

    // Extract data from charts to calculate summary statistics
    const casesData = JSON.parse(data.line_cases);
    const deathsData = JSON.parse(data.line_deaths);

    let totalCases = 0;
    let totalDeaths = 0;

    // Simple calculation for demo purposes - in reality you'd want more robust calculations
    casesData.data.forEach(series => {
        if (series.y && series.y.length) {
            totalCases += series.y.reduce((a, b) => a + b, 0);
        }
    });

    deathsData.data.forEach(series => {
        if (series.y && series.y.length) {
            totalDeaths += series.y.reduce((a, b) => a + b, 0);
        }
    });

    // Create summary HTML
    summaryElement.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Date Range</h6>
                <p>${document.getElementById('start-date').value} to ${document.getElementById('end-date').value}</p>
                
                <h6>Selected Location</h6>
                <p>${document.getElementById('location').value || 'All Countries'}</p>
            </div>
            <div class="col-md-6">
                <h6>Total Cases</h6>
                <p>${totalCases.toLocaleString()}</p>
                
                <h6>Total Deaths</h6>
                <p>${totalDeaths.toLocaleString()}</p>
                
                <h6>Case Fatality Rate</h6>
                <p>${(totalDeaths / totalCases * 100).toFixed(2)}%</p>
            </div>
        </div>
    `;
}