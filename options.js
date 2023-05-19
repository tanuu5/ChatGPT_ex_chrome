document.getElementById('settings-form').addEventListener('submit', function(event) {
    event.preventDefault();

    var apiKey = document.getElementById('api-key-input').value;
    chrome.storage.sync.set({ 'openaiApiKey': apiKey }, function() {
        alert('設定は保存されました（Settings saved.）');
    });
});

// Load any saved API key into the settings form
chrome.storage.sync.get('openaiApiKey', function(data) {
    document.getElementById('api-key-input').value = data.openaiApiKey;
});
