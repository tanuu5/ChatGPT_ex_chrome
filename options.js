document.addEventListener('DOMContentLoaded', function() {
    // Load and display the current counter and estimated cost
    var counter = parseInt(localStorage.getItem('counter'), 10) || 0;
    document.getElementById('current-counter').innerText = counter;
    document.getElementById('estimated-cost').innerText = (counter * 0.002).toFixed(2);

    // Load API Key if available and mask it
    chrome.storage.sync.get('openaiApiKey', function(data) {
        if (data.openaiApiKey) {
            document.getElementById('api-key-input').value = '●●●●●●●●';
        }
    });

    // API Key form submission
    document.getElementById('settings-form').addEventListener('submit', function(event) {
        event.preventDefault();
        var apiKeyInput = document.getElementById('api-key-input');
        
        // Update only if a new value is entered
        if (apiKeyInput.value !== '●●●●●●●●') {
            chrome.storage.sync.set({openaiApiKey: apiKeyInput.value}, function() {
                alert('API Key saved.');
                apiKeyInput.value = '●●●●●●●●';
            });
        }
    });

    // Reset Counter
    document.getElementById('reset-counter').addEventListener('click', function() {
        localStorage.setItem('counter', 0);
        updateCounterAndCost();
        alert('Counter has been reset.');
    });

    // Reset History
    document.getElementById('reset-history').addEventListener('click', function() {
        localStorage.setItem('history', '');
        alert('History has been reset.');
    });

    // Download History
    document.getElementById('download-history').addEventListener('click', function() {
        var history = localStorage.getItem('history') || '';
        var blob = new Blob([history], { type: 'text/plain' });
        var url = window.URL.createObjectURL(blob);

        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'chat_history.txt';

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    });

    // Set Counter Manually
    document.getElementById('set-counter').addEventListener('click', function() {
        var newCounter = parseInt(document.getElementById('manual-counter').value, 10);
        if (isNaN(newCounter)) {
            alert('Please enter a valid number.');
            return;
        }
        localStorage.setItem('counter', newCounter);
        updateCounterAndCost();
    });

    function updateCounterAndCost() {
        var counter = parseInt(localStorage.getItem('counter'), 10) || 0;
        document.getElementById('current-counter').innerText = counter;
        document.getElementById('estimated-cost').innerText = (counter * 0.002).toFixed(2);
    }
});

