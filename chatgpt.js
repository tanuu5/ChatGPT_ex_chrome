var historyText = localStorage.getItem('history') || "";
var counter = parseInt(localStorage.getItem('counter'), 10) || 0;

var alertMessages = {
    en: {
        detected: 'Detected personal information.\nDetected Items: \n',
        proceed: 'Are you sure you want to proceed?(Press OK to send.)',
        cancel: 'The message was not sent because a cancel was pressed.\nPlease mask or delete the relevant part and resubmit.',
        apiKeyError: 'The API key is incorrect.',
        otherError: 'An error occurred. HTTP Status Code: '
    },
    ja: {
        detected: '個人情報が検出されました。\n検出された項目: \n',
        proceed: '本当に送信してもよろしいですか？（送信するにはOKを押してください。）',
        cancel: 'キャンセルが押されたため、メッセージは送信されませんでした。\n関連する部分をマスクまたは削除して、再送信してください。',
        apiKeyError: 'APIキーが間違っています。',
        otherError: 'エラーが発生しました。HTTPステータスコード: '
    }
};

// Display history and counter on the screen
document.getElementById('history').innerText = historyText;
document.getElementById('counter').innerText = "Counter: " + counter;

async function sendToChatGPT(messages) {
    // 状態変数
    let shouldProceed = true;

    // 送信前に個人情報をチェック
    const checkPersonalInfo = new Promise((resolve) => {
    chrome.storage.sync.get(['enablePersonalInfoCheck', 'selectedLanguage'], function(data) {
        var enableCheck = data.enablePersonalInfoCheck || false;
        var language = data.selectedLanguage || 'en';
        var msg = alertMessages[language];
            if (enableCheck) {
                var inputText = document.getElementById('message-input').value;
                var phoneRegex = /\d{2,4}-\d{2,4}-\d{4}/g;
                var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                var postalRegex = /\d{3}-\d{4}/g;
        
                var foundPhone = inputText.match(phoneRegex);
                var foundEmail = inputText.match(emailRegex);
                var foundPostal = inputText.match(postalRegex);

                if (foundPhone || foundEmail || foundPostal) {
                var detectedItems = '';
                if (foundPhone) detectedItems += 'Phone Numbers: ' + foundPhone.join(', ') + '\n';
                if (foundEmail) detectedItems += 'Email Addresses: ' + foundEmail.join(', ') + '\n';
                if (foundPostal) detectedItems += 'Postal Codes: ' + foundPostal.join(', ') + '\n';
                
                var proceed = window.confirm(msg.detected + detectedItems + msg.proceed);
                if (!proceed) {
                    shouldProceed = false;
                    alert(msg.cancel);
                }
            }
            }
            resolve(shouldProceed); // Promiseをresolveして値を返す
        });
    });

    shouldProceed = await checkPersonalInfo; // 非同期処理が完了するまで待つ

    // shouldProceed が false なら後続の処理をスキップ
    if (!shouldProceed) return;

    chrome.storage.sync.get('openaiApiKey', function(data) {
        var apiKey = data.openaiApiKey;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.openai.com/v1/chat/completions', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + apiKey);

        xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                document.getElementById('loading-indicator').style.display = 'none';

                if (this.status === 200) {
                    var response = JSON.parse(this.responseText);
                    var chatGptMessageContent = response['choices'][0]['message']['content'];

                    // Timestamp
                    var timestamp = new Date().toLocaleString();

                    // Update history with your prompt and ChatGPT's reply
                    historyText += "---\n" + "You (" + timestamp + "): " + messages[messages.length - 1]['content'] + "\n";
                    historyText += "ChatGPT (" + timestamp + "): " + chatGptMessageContent + "\n";

                    counter++;

                    // Save to local storage and display on screen
                    document.getElementById('history').innerText = historyText;
                    document.getElementById('counter').innerText = "Counter: " + counter;
                    localStorage.setItem('history', historyText);
                    localStorage.setItem('counter', counter);

                    // Display ChatGPT's message
                    var chatGptMessageElem = document.createElement('p');
                    chatGptMessageElem.innerHTML = "ChatGPT: " + chatGptMessageContent.replace(/\n/g, "<br>");
                    document.getElementById('chat-log').appendChild(chatGptMessageElem);
                } else if (this.status === 401) {
                    alert("The API key is incorrect.(APIキーが間違っています。)");
                } else {
                    alert("エラーが発生しました。HTTPステータスコード: " + this.status);
                }
            }
        };

        var data = {
            'model': 'gpt-3.5-turbo',
            'messages': messages
        };

        xhr.send(JSON.stringify(data));
    });
}

// 履歴を表示・非表示を切り替えるボタン
document.getElementById('toggle-history').addEventListener('click', function() {
    var historySection = document.getElementById('history-section');
    if (historySection.style.display === 'none') {
        historySection.style.display = 'block';
    } else {
        historySection.style.display = 'none';
    }
});

document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var initialMessage = { 'role': 'system', 'content': '' };
    var userMessageContent = document.getElementById('message-input').value;
    var userMessage = { 'role': 'user', 'content': userMessageContent };
    sendToChatGPT([initialMessage, userMessage]);
    var userMessageElem = document.createElement('p');
    userMessageElem.innerHTML = "You: " + userMessageContent.replace(/\n/g, "<br>");
    document.getElementById('chat-log').appendChild(userMessageElem);
});

// Function to set the UI language in the popup
function setPopupLanguage(language) {
  const messageText1 = language === 'ja' ? '送信ボタンを押した後、返信がくるまで少々お待ちください...' : 'Please wait a moment after you hit send until you hear back... ';
  const messageText2 = language === 'ja' ? '（メッセージが正常に受信された場合、このメッセージは消えます。）' : '(This message will disappear when the message is successfully received.)';
  const sendButton = language === 'ja' ? '送信' : 'Send';
  
  document.getElementById('message-placeholder1').textContent = messageText1;
  document.getElementById('message-placeholder2').textContent = messageText2;
  document.getElementById('send-button').textContent = sendButton;
}

// Initialize language setting for the popup
chrome.storage.sync.get('selectedLanguage', function(data) {
  const savedLanguage = data.selectedLanguage || 'en';
  setPopupLanguage(savedLanguage);
});
