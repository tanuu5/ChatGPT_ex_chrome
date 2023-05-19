document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();

    var initialMessage = { 'role': 'system', 'content': '' };
    var userMessageContent = document.getElementById('message-input').value;
    var userMessage = { 'role': 'user', 'content': userMessageContent };

    sendToChatGPT([initialMessage, userMessage]);

    // ユーザーのメッセージを表示
    var userMessageElem = document.createElement('p');
    userMessageElem.textContent = "あなた: " + userMessageContent;
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
            if (this.readyState === 4 && this.status === 200) {
                var response = JSON.parse(this.responseText);
                var chatGptMessageContent = response['choices'][0]['message']['content'];

                // ChatGPTのメッセージを表示
                var chatGptMessageElem = document.createElement('p');
                chatGptMessageElem.textContent = "ChatGPT: " + chatGptMessageContent;
                document.getElementById('chat-log').appendChild(chatGptMessageElem);
            }
        };

        var data = {
            'model': 'gpt-3.5-turbo',
            'messages': messages
        };

        xhr.send(JSON.stringify(data));
    });
}
