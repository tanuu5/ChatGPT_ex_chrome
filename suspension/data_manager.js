
        function showTab(tabId) {
            let tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        }
    

document.getElementById('register-confirm').addEventListener('click', function() {
    // Get the input values
    let writer = document.getElementById('writer').value || 'none';
    let organization = document.getElementById('organization').value || 'none';
    let url = document.getElementById('url').value || 'none';
    let prompt_ja = document.getElementById('prompt_ja').value;
    let prompt_en = document.getElementById('prompt_en').value || 'none';
    let tags = document.getElementById('tags').value.split(',').slice(0, 10);

    // Check if required fields are filled
    if (!prompt_ja || tags.length === 0) {
        alert('Prompt JA and Tags are required fields.');
        return;
    }

    // Create the new data entry
    let newData = {
        id: '00001',  // This should be dynamically set based on existing data
        date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        writer: writer,
        organization: organization,
        url: url,
        prompt_ja: prompt_ja,
        prompt_en: prompt_en,
        tags: tags
    };

    
    // Save the new data entry to chrome.storage.local
    chrome.storage.local.get('dataEntries', function(result) {
        let dataEntries = result.dataEntries || [];
        // Set the new ID based on existing data
        let newId = ('0000' + (dataEntries.length + 1)).slice(-5);
        newData.id = newId;
        dataEntries.push(newData);
        chrome.storage.local.set({'dataEntries': dataEntries}, function() {
            alert('Data successfully registered.');
        });
    });
    
    console.log('New data saved:', newData);
    alert('Data successfully registered.');
});


document.getElementById('update-confirm').addEventListener('click', function() {
    let id = document.getElementById('update-id').value;
    if (!id) {
        alert('ID is required for updating.');
        return;
    }
    // Similar logic as registration to update the data based on ID
    // ...
    alert('Data successfully updated.');
});

document.getElementById('delete-confirm').addEventListener('click', function() {
    let id = document.getElementById('delete-id').value;
    if (!id) {
        alert('ID is required for deletion.');
        return;
    }
    // Logic to set the date to 99999999 for logical deletion
    // ...
    alert('Data successfully marked as deleted.');
});

// Logic for "Inquiry" tab would involve reading all the data and displaying in the table
// ...
