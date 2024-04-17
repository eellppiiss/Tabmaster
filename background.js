// background.js
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.title) {
      chrome.storage.local.get('savedTabs', function(data) {
          var savedTabs = data.savedTabs || [];
          for (var i = 0; i < savedTabs.length; i++) {
              if (savedTabs[i].id === tabId) {
                  savedTabs[i].title = tab.title;
                  savedTabs[i].url = tab.url;
                  chrome.storage.local.set({ 'savedTabs': savedTabs }, function() {
                      loadSavedTabs();
                  });
              }
          }
      });
  }
});
