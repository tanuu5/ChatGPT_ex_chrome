document.addEventListener('DOMContentLoaded', function() {
        // Load and display the current counter and estimated cost
    var counter = parseInt(localStorage.getItem('counter'), 10) || 0;
    document.getElementById('current-counter').innerText = counter;
    document.getElementById('estimated-cost').innerText = (counter * 0.002).toFixed(2);

    // Load API Key if available and mask it
    chrome.storage.sync.get('openaiApiKey', function(data) {
        if (data.openaiApiKey) {
            document.getElementById('api-key-input').value = '●●●●●●●●●●●●●●●●';
        }
    });

    // API Key form submission
    document.getElementById('settings-form').addEventListener('submit', function(event) {
        event.preventDefault();
        var apiKeyInput = document.getElementById('api-key-input');
        
        // Update only if a new value is entered
        if (apiKeyInput.value !== '●●●●●●●●●●●●●●●●') {
            chrome.storage.sync.set({openaiApiKey: apiKeyInput.value}, function() {
                alert('API Key saved.');
                apiKeyInput.value = '●●●●●●●●●●●●●●●●';
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

    // Load the state of the personal information check feature
    chrome.storage.sync.get('enablePersonalInfoCheck', function(data) {
        var isChecked = data.enablePersonalInfoCheck || false;
        document.getElementById('enablePersonalInfoCheck').checked = isChecked;
    });

    // Save the state of the personal information check feature when the checkbox is clicked
    document.getElementById('enablePersonalInfoCheck').addEventListener('click', function() {
        var isChecked = document.getElementById('enablePersonalInfoCheck').checked;
        chrome.storage.sync.set({ 'enablePersonalInfoCheck': isChecked });
    });

    // Function to set the UI language
    function setLanguage(language) {
    const settingsTitle = language === 'ja' ? 'GPT-ChatDIY 設定' : 'GPT-ChatDIY Settings';
    const apiKeyTitle = language === 'ja' ? 'API キー' : 'API Key';
    const languageTitle = language === 'ja' ? '言語' : 'Language';
    const apiKeyInstruction = language === 'ja' ? '以下にOpenAI APIキーを入力してください：' : 'Enter your OpenAI API key below:';
    const saveButton = language === 'ja' ? '保存' : 'Save';
    const counterAndCost = language === 'ja' ? 'カウンターとコスト' : 'Counter and Cost';
    const currentCounterTitle = language === 'ja' ? '現在のカウンター：' : 'Current counter:';
    const estimatedCostTitle = language === 'ja' ? '推定コスト：' : 'Estimated cost:';
    const checkOpenAIPricing = language === 'ja' ? '正確な請求については、OpenAIの価格ページを確認してください。' : 'Check the OpenAI Pricing page for accurate billing.';
    const setCounterManually = language === 'ja' ? '手動でカウンターを設定します：' : 'Set Counter Manually:';
    const setCounter = language === 'ja' ? 'カウンターを設定する' : 'Set Counter';
    const history = language === 'ja' ? '履歴' : 'History';
    const downloadHistory = language === 'ja' ? '履歴のダウンロード' : 'Download History';
    const reset = language === 'ja' ? 'リセット' : 'Reset';
    const resetHistory = language === 'ja' ? '履歴のリセット' : 'Reset History';
    const resetCounter = language === 'ja' ? 'カウンターリセット' : 'Reset Counter';
    const personalInfoCheck = language === 'ja' ? '個人情報チェック' : 'Personal Information Check';
    const enableDisableInfoCheck = language === 'ja' ? '個人情報チェック機能の有効・無効を設定します。' : 'Enable or disable the personal information check feature.';
    const enableInfoCheckDetail = language === 'ja' ? '個人情報チェックを有効にする(電話番号、メールアドレス、郵便番号のみ検出)' : 'Enable Personal Information Check.(Only phone numbers, email addresses, and zip codes are detected.)';
    
    document.getElementById('settings-title').textContent = settingsTitle;
    document.getElementById('api-key-title').textContent = apiKeyTitle;
    document.getElementById('language-title').textContent = languageTitle;
    document.getElementById('api-key-instruction').textContent = apiKeyInstruction;
    document.getElementById('save-button').textContent = saveButton;
    document.getElementById('counter-and-cost').textContent = counterAndCost;
    document.getElementById('current-counter-title').textContent = currentCounterTitle;
    document.getElementById('estimated-cost-title').textContent = estimatedCostTitle;
    document.getElementById('check-openai-pricing').textContent = checkOpenAIPricing;
    document.getElementById('set-counter-manually').textContent = setCounterManually;
    document.getElementById('set-counter').textContent = setCounter;
    document.getElementById('history').textContent = history;
    document.getElementById('download-history').textContent = downloadHistory;
    document.getElementById('reset').textContent = reset;
    document.getElementById('reset-history').textContent = resetHistory;
    document.getElementById('reset-counter').textContent = resetCounter;
    document.getElementById('personal-info-check').textContent = personalInfoCheck;
    document.getElementById('enable-disable-info-check').textContent = enableDisableInfoCheck;
    document.getElementById('enable-info-check-detail').textContent = enableInfoCheckDetail;
    }

    // Event listener for language dropdown changes
    const languageSelect = document.getElementById('language-select');
    

    // Initialize the dropdown with the currently selected language using chrome.storage.sync
      chrome.storage.sync.get('selectedLanguage', function(data) {
      const savedLanguage = data.selectedLanguage || 'en';
      languageSelect.value = savedLanguage;
      setLanguage(savedLanguage);
    });
    
    // Update language when the dropdown selection changes
    if (languageSelect) {
      languageSelect.addEventListener('change', function() {
        const selectedLanguage = this.value;
        chrome.storage.sync.set({'selectedLanguage': selectedLanguage}, function() {
          setLanguage(selectedLanguage);
            });
      });
    }
    
    // デバッグ用 変数の値確認用
    document.getElementById('show-storage').addEventListener('click', function() {
        chrome.storage.sync.get(null, function(items) {
            // オブジェクトをテキスト形式に変換
            var storageText = JSON.stringify(items, null, 2);
        
            // テキストをHTMLに挿入
            document.getElementById('storage-output').innerText = storageText;
        });
    });

});
