var historyText = localStorage.getItem('history') || "";
var counter = parseInt(localStorage.getItem('counter'), 10) || 0;

var alertMessages = {
    en: {
        detected: 'Detected personal information.\nDetected Items: \n',
        proceed: 'Are you sure you want to proceed?(Press OK to send.)',
        cancel: 'The message was not sent because a cancel was pressed.\nPlease mask or delete the relevant part and resubmit.',
        apiKeyError: 'The API key is incorrect.',
        otherError: 'An error occurred. HTTP Status Code: ',
        criticalError: 'CriticalError'
    },
    ja: {
        detected: '個人情報が検出されました。\n検出された項目: \n',
        proceed: '本当に送信してもよろしいですか？（送信するにはOKを押してください。）',
        cancel: 'キャンセルが押されたため、メッセージは送信されませんでした。\n関連する部分をマスクまたは削除して、再送信してください。',
        apiKeyError: 'APIキーが間違っています。',
        otherError: 'エラーが発生しました。HTTPステータスコード: ',
        criticalError: 'クリティカルエラー'
    }
};

// Display history and counter on the screen
document.getElementById('history').innerText = historyText;
document.getElementById('counter').innerText = "Counter: " + counter;

async function sendToChatGPT(messages) {

    // 状態変数
    let shouldProceed = true;
    let inputText = document.getElementById('message-input').value;  // この変数を関数全体で使用する

    // 送信前に個人情報をチェック
    const checkPersonalInfo = new Promise((resolve) => {
    
    chrome.storage.sync.get(['enablePersonalInfoCheck', 'selectedLanguage'], function(data) {
        var enableCheck = data.enablePersonalInfoCheck || false;
        var language = data.selectedLanguage || 'en';
        var msg = alertMessages[language];
            if (enableCheck) {
                //var inputText = document.getElementById('message-input').value;
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
        
        if (!shouldProceed) {
        return;  // 処理を中止
    }

    // 送信するメッセージをmessagesに格納
    const messages = inputText;

    // 辞書チェック Get dictionary from local storage
    const csvContent = localStorage.getItem('dictionaryCSV');
    //alert(`CSV Content: ${csvContent ? csvContent : 'No CSV found in local storage'}`); デバッグ用

    if (csvContent) {
        const words = csvContent.split(',').map(word => word.trim());  // カンマで分割後、前後の空白を削除
        //alert(`Parsed Words: ${words.join(', ')}`); デバッグ用

        // 入力テキストが辞書の単語を完全に含む場合にマッチ
        const matchedWords = words.filter(word => inputText.includes(word));
        //alert(`Matched Words: ${matchedWords.length > 0 ? matchedWords.join(', ') : 'No matched words'}`); デバッグ用

        if (matchedWords.length > 0) {
            shouldProceed = false;  // ここでshouldProceedをfalseに設定することで、辞書に一致した場合問答無用で中断する。
            alert(`個人情報が検出されました。\n検出された項目: ${matchedWords.join(', ')}\n以降のチェックで送信を許容した場合でも送信されません。`);
        }
    }
        
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
                    
                    // Assume that the total tokens used are available in the API response
                    // This is a placeholder; replace with the actual field from the API response
                    var total_tokens_from_api = response.usage.total_tokens;  // この部分はAPIの仕様に合わせて変更してください

                    // Get current total tokens from chrome.storage.sync
                    chrome.storage.sync.get('total_tokens', function(data) {
                        var current_total_tokens = data.total_tokens || 0;

                        // Add the new tokens to the current total tokens
                        var new_total_tokens = current_total_tokens + total_tokens_from_api;

                        // Store the new total_tokens into chrome.storage.sync
                        chrome.storage.sync.set({total_tokens: new_total_tokens}, function() {
                            console.log('New total tokens are stored in chrome.storage.sync');
                        });
                    });
                    
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
  const messageText1 = language === 'ja' ? '～使い方～' : '～How to use～';
  const messageText2 = language === 'ja' ? '1.上記の入力エリアにプロンプトを入力します。' : '1. Enter the prompt in the input area above.';
  const messageText3 = language === 'ja' ? '2.プロンプトサジェストエリアから選択することもできます。' : '2. You can also choose from the prompt suggestion area.';
  const messageText4 = language === 'ja' ? '3.送信ボタンを押し、少し待つことで結果が表示されます。' : '3. Press the Send button and wait a few moments to see the results.';
  const messageText5 = language === 'ja' ? '※返答の長さによって、数分待つ場合もあります。' : '*You may have to wait several minutes depending on the length of the response.';
  const messageText6 = language === 'ja' ? '☆このメッセージは正常に受信した際に非表示になります☆' : '☆This message will be hidden when it is successfully received☆.';
  const messageText7 = language === 'ja' ? '注意：現時点で継続したやりとりはできません。' : 'Note: Continued communication is not possible at this time.';
  const sendButton = language === 'ja' ? '送信' : 'Send';
  const clearButton = language === 'ja' ? 'クリア' : 'Clear';
  const copyButton = language === 'ja' ? 'コピー' : 'Copy';
  const promptSuggest = language === 'ja' ? 'プロンプトサジェスト' : 'Prompt Suggestions';
  const promptSuggesttext = language === 'ja' ? '以下のプロンプトをクリックして、入力エリアに挿入できます。' : 'The following prompts can be inserted into the input area by clicking on them.';
  
  document.getElementById('message-placeholder1').textContent = messageText1;
  document.getElementById('message-placeholder2').textContent = messageText2;
  document.getElementById('message-placeholder3').textContent = messageText3;
  document.getElementById('message-placeholder4').textContent = messageText4;
  document.getElementById('message-placeholder5').textContent = messageText5;
  document.getElementById('message-placeholder6').textContent = messageText6;
  document.getElementById('message-placeholder7').textContent = messageText7;
  document.getElementById('send-button').textContent = sendButton;
  document.getElementById('clear-button1').textContent = clearButton;
  document.getElementById('copy-button1').textContent = copyButton;
  document.getElementById('prompt-suggest').textContent = promptSuggest;
  document.getElementById('prompt-suggest-text').textContent = promptSuggesttext;
}

// Initialize language setting for the popup
chrome.storage.sync.get('selectedLanguage', function(data) {
  const savedLanguage = data.selectedLanguage || 'en';
  setPopupLanguage(savedLanguage);
});


// Function to load JSON file
async function loadJSON(filename) {
  const response = await fetch(filename);
  const data = await response.json();
  return data;
}

// Load the prompts from prompt.json
let prompts = [];
loadJSON('prompt.json').then(data => {
  prompts = data;
});

// Load the selected language from Chrome storage
//let selectedLanguage = 'ja';  // Default to Japanese
chrome.storage.sync.get('selectedLanguage', function(data) {
  if (data.selectedLanguage) {
    selectedLanguage = data.selectedLanguage;
  }
});

// Get the message input element
const messageInput = document.getElementById('message-input');

// Create a container for suggestions
const suggestionContainer = document.createElement('div');
suggestionContainer.id = 'suggestion-container';
document.body.appendChild(suggestionContainer);


// JavaScript code to handle unique prompt suggestions
const suggestedPromptIds = new Set();

// Clear previous suggestions and suggestedPromptIds
suggestionContainer.innerHTML = '';
suggestedPromptIds.clear();

// Get the current input text
const currentInput = messageInput.value;

// Search for matching tags in the prompts
prompts.forEach(prompt => {
    let shouldAddSuggestion = false;
    prompt.tags.forEach(tag => {
        if (currentInput.includes(tag)) {
            shouldAddSuggestion = true;
        }
    });

    if (shouldAddSuggestion && !suggestedPromptIds.has(prompt.id)) {
        suggestedPromptIds.add(prompt.id);  // Add the prompt ID to the Set of suggested prompts

        // Create a suggestion element
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion';
        suggestion.textContent = selectedLanguage === 'ja' ? prompt.prompt_ja : prompt.prompt_en;

        // Add click event to fill the text area with the prompt
        suggestion.addEventListener('click', function() {
            messageInput.value = selectedLanguage === 'ja' ? prompt.prompt_ja : prompt.prompt_en;
        });

        // Add the suggestion to the suggestion container
        suggestionContainer.appendChild(suggestion);
    }
});

// Update the suggestion count whenever new suggestions are added
function updateSuggestionCount() {
    const count = suggestedPromptIds.size;  // Use the size of the Set to get the count of unique suggestions
    document.getElementById('suggestion-count').textContent = count + ' Suggestions';
}

// Listen for input events on the message input
messageInput.addEventListener('input', function() {
  // Clear previous suggestions
  suggestionContainer.innerHTML = '';

  const suggestedPromptIds = new Set();  // ここでSetを初期化

  // Get the current input text
  const currentInput = messageInput.value;

  // Search for matching tags in the prompts
  prompts.forEach(prompt => {
    let shouldAddSuggestion = false;
    prompt.tags.forEach(tag => {
      if (currentInput.includes(tag)) {
        shouldAddSuggestion = true;
      }
    });

    if (shouldAddSuggestion && !suggestedPromptIds.has(prompt.id)) {
      suggestedPromptIds.add(prompt.id);  // Add the prompt ID to the Set of suggested prompts

      // Create a suggestion element
      const suggestion = document.createElement('div');
      suggestion.className = 'suggestion';
      suggestion.textContent = selectedLanguage === 'ja' ? prompt.prompt_ja : prompt.prompt_en;

      // Add click event to fill the text area with the prompt
      suggestion.addEventListener('click', function() {
        messageInput.value = selectedLanguage === 'ja' ? prompt.prompt_ja : prompt.prompt_en;
      });

      // Add the suggestion to the suggestion container
      suggestionContainer.appendChild(suggestion);
    }
  });

  // Update the suggestion count whenever new suggestions are added
  const count = suggestedPromptIds.size;  // Use the size of the Set to get the count of unique suggestions
  document.getElementById('suggestion-count').textContent = count + ' Suggestions';
});


// Function to scroll suggestions
function scrollSuggestions(direction) {
  const container = document.getElementById('suggestion-container');
  if (direction === 'left') {
    container.scrollLeft -= 100;
  } else {
    container.scrollLeft += 100;
  }
}

// Update the suggestion count whenever new suggestions are added
function updateSuggestionCount() {
  const count = document.querySelectorAll('.suggestion').length;
  document.getElementById('suggestion-count').textContent = count + ' Suggestions';
}

// Update the suggestion count initially and whenever new suggestions are added
messageInput.addEventListener('input', function() {
  updateSuggestionCount();
});


// JavaScript code to handle active suggestion
let activeSuggestionIndex = 0;
function showActiveSuggestion() {
  const suggestions = document.querySelectorAll('.suggestion');
  suggestions.forEach((suggestion, index) => {
    if (index === activeSuggestionIndex) {
      suggestion.classList.add('active');
    } else {
      suggestion.classList.remove('active');
    }
  });
}

// Initialize the first suggestion as active
showActiveSuggestion();

// Update the active suggestion when arrow buttons are clicked
document.getElementById('scroll-left').addEventListener('click', function() {
  if (activeSuggestionIndex > 0) {
    activeSuggestionIndex--;
  }
  showActiveSuggestion();
});

document.getElementById('scroll-right').addEventListener('click', function() {
  const totalSuggestions = document.querySelectorAll('.suggestion').length;
  if (activeSuggestionIndex < totalSuggestions - 1) {
    activeSuggestionIndex++;
  }
  showActiveSuggestion();
});

// Update the active suggestion initially and whenever new suggestions are added
messageInput.addEventListener('input', function() {
  activeSuggestionIndex = 0;  // Reset to the first suggestion
  showActiveSuggestion();
});

// Function to clear the input area
document.getElementById('clear-button').addEventListener('click', function() {
    document.getElementById('message-input').value = '';
});

// Function to copy the input content to clipboard
document.getElementById('copy-button').addEventListener('click', function() {
    const textarea = document.getElementById('message-input');
    textarea.select();
    document.execCommand('copy');
});

// Function to show toast notification
document.getElementById('copy-button').addEventListener('click', function() {
    const toast = document.getElementById('toast-notification');
    toast.style.display = 'block';
    setTimeout(function() {
        toast.style.display = 'none';
    }, 2000);  // Hide the toast after 2 seconds
});
