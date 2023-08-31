// Retrieve history and counter from local storage
var historyText = localStorage.getItem('history') || "";
var counter = parseInt(localStorage.getItem('counter'), 10) || 0;

// Display history and counter on the screen
document.getElementById('history').innerText = historyText;
document.getElementById('counter').innerText = "Counter: " + counter;

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

function sendToChatGPT(messages) {
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
                    alert("APIキーが誤っています。");
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
