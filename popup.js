document.getElementById('openTab').addEventListener('click', function () {
    chrome.tabs.create({});
});
document.getElementById('addToBlock1').addEventListener('click', function () {
    addTabToBlock('tabsList2', 'inactive');
});
document.getElementById('addToBlock2').addEventListener('click', function () {
    addTabToBlock('tabsList1', 'active');
});
document.getElementById('toggleBlock1').addEventListener('click', function () {
    toggleBlock('tabsList1', 'toggleBlock1');
});
document.getElementById('toggleBlock2').addEventListener('click', function () {
    toggleBlock('tabsList2', 'toggleBlock2');
});


chrome.tabs.onCreated.addListener(function(tab) {
    chrome.tabs.query({ url: tab.url }, function(existingTabs) {
        if (existingTabs.length > 1) {
            existingTabs.forEach(function(existingTab) {
                if (existingTab.id !== tab.id) {
                    chrome.tabs.remove(existingTab.id, function() {
                        console.log('Дубликат вкладки успешно закрыт');
                    });
                }
            });
        }
    });
});



chrome.runtime.onStartup.addListener(function () {
    loadSavedTabs();
});



function removeTabFromStorage(tabId) {
    console.log('Удаление вкладки с ID: ' + tabId + ' из хранилища');
    chrome.storage.local.get('savedTabs', function(data) {
        var savedTabs = data.savedTabs || [];
        var updatedTabs = savedTabs.filter(function(tab) {
            return tab.id !== tabId;
        });
        chrome.storage.local.set({ 'savedTabs': updatedTabs }, function() {
            console.log('Вкладка успешно удалена из хранилища');
            loadSavedTabs();
        });
    });
}

function saveTabToStorage(tab, state) {
    console.log('Сохранение вкладки в хранилище');
    chrome.storage.local.get('savedTabs', function(data) {
        var savedTabs = data.savedTabs || [];
        var existingTab = savedTabs.find(function(savedTab) {
            return savedTab.id === tab.id;
        });
        if (!existingTab) {
            tab.state = state;
            savedTabs.push(tab);
            chrome.storage.local.set({ 'savedTabs': savedTabs }, function() {
                console.log('Вкладка успешно сохранена в хранилище');
            });
        }
    });
}


function addMoveButton(tab) {
    var moveButton = document.createElement('a');
    var img = document.createElement('img');
    function setInitialImage() {
        img.src = tab.state === 'active' ? 'icons/down_arrow.png' : 'icons/up_arrow.png';
    }
    setInitialImage();
    moveButton.appendChild(img);
    moveButton.addEventListener('click', function () {
        var newState = tab.state === 'active' ? 'inactive' : 'active';
        moveTabToBlock(tab.id, newState);
        img.src = newState === 'active' ? 'icons/up_arrow.png' : 'icons/down_arrow.png';
        tab.state = newState;
    });
    var buttonDiv = document.createElement('div');
    buttonDiv.classList.add('button_li');
    buttonDiv.appendChild(moveButton);
    return buttonDiv;
}

window.addEventListener('beforeunload', function() {
    chrome.storage.local.get('savedTabs', function(data) {
        var savedTabs = data.savedTabs || [];
        savedTabs.forEach(function(tab) {
            chrome.tabs.query({ url: tab.url }, function(existingTabs) {
                existingTabs.forEach(function(existingTab) {
                    chrome.tabs.remove(existingTab.id);
                });
            });
        });
        chrome.storage.local.clear(); // Очистка сохраненных вкладок после их закрытия
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log('Вкладка была закрыта физически. ID вкладки: ' + tabId);
    chrome.tabs.get(tabId, function(tab) {
        if (tab) {
            saveTabToStorage(tab, 'inactive');
        }
    });
});

chrome.runtime.onStartup.addListener(function () {
    loadSavedTabs();
    chrome.storage.local.get('savedTabs', function (data) {
        var savedTabs = data.savedTabs || [];
        savedTabs.forEach(function (tab) {
            chrome.tabs.create({ url: tab.url });
        });
    });
});



function loadSavedTabs() {
    chrome.storage.local.get('savedTabs', function (data) {
        var savedTabs = data.savedTabs || [];
        document.getElementById('tabsList1').innerHTML = '';
        document.getElementById('tabsList2').innerHTML = '';
        savedTabs.forEach(function (tab) {
            var li = document.createElement('li');
            var siteContainer = document.createElement('div');
            siteContainer.classList.add('name_web');
            var siteContent = document.createElement('div');
            siteContent.classList.add('name_web');
            var siteName = document.createElement('p');
            siteName.textContent = tab.title;
            var siteIcon = document.createElement('img');
            siteIcon.src = tab.favIconUrl || 'icons/icon16.png';
            siteIcon.width = 16;
            siteIcon.height = 16;
            var buttonDiv = document.createElement('div');
            buttonDiv.classList.add('button_li');
            var closeButton = document.createElement('a');
            closeButton.textContent = '✖';
            closeButton.addEventListener('click', function () {
                chrome.tabs.query({ url: tab.url }, function (existingTabs) {
                    existingTabs.forEach(function (existingTab) {
                        chrome.tabs.remove(existingTab.id);
                    });
                });
                removeTabFromStorage(tab.id);
                li.remove();
            });
            siteContent.addEventListener('click', function () {
                chrome.tabs.update(tab.id, { active: true }, function (updatedTab) {
                    if (!chrome.runtime.lastError) {
                        console.log('Вкладка успешно открыта');
                    } else {
                        console.error(chrome.runtime.lastError.message);
                    }
                });
            });
            siteContent.addEventListener('click', function () {
                chrome.tabs.query({ url: tab.url }, function (existingTabs) {
                    if (existingTabs.length === 0) {
                        chrome.tabs.create({ url: tab.url });
                    } else {
                        existingTabs.forEach(function (existingTab) {
                            chrome.tabs.update(existingTab.id, { active: true });
                        });
                    }
                });
            });
            siteContent.addEventListener('click', function (event) {
                event.stopPropagation();
                if (tab.id) {
                    chrome.tabs.update(tab.id, { active: true }, function (updatedTab) {
                        if (!chrome.runtime.lastError) {
                            console.log('Вкладка успешно открыта');
                        } else {
                            console.error(chrome.runtime.lastError.message);
                        }
                    });
                } else {
                    chrome.tabs.create({ url: tab.url }, function (newTab) {
                        console.log('Создана новая вкладка');
                    });
                }
            });
            var moveButtonDiv = addMoveButton(tab);
            buttonDiv.appendChild(closeButton);
            buttonDiv.appendChild(moveButtonDiv);
            siteContent.appendChild(siteIcon);
            siteContent.appendChild(siteName);
            siteContainer.appendChild(siteContent);
            li.appendChild(siteContainer);
            li.appendChild(buttonDiv);
            var tabsId = (tab.state === 'active') ? 'tabsList1' : 'tabsList2';
            document.getElementById(tabsId).appendChild(li);
            document.getElementById(tabsId).style.display = 'block';
        });
    });
}


function addTabToBlock(tabsId, state) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var tab = tabs[0];
        chrome.storage.local.get('savedTabs', function (data) {
            var savedTabs = data.savedTabs || [];
            var existingTab = savedTabs.find(function (savedTab) {
                return savedTab.id === tab.id;
            });
            var tabInAnotherState = savedTabs.find(function (savedTab) {
                return savedTab.id === tab.id && savedTab.state !== state;
            });
            if (!existingTab && !tabInAnotherState) {
                tab.state = state;
                savedTabs.push(tab);
                chrome.storage.local.set({ 'savedTabs': savedTabs }, function () {
                    loadSavedTabs();
                });
            } else {
                console.log('Нельзя');
            }
        });
    });
}


function toggleBlock(tabsId, blockId) {
    var tabsList = document.getElementById(tabsId);
    var arrowIcon = document.getElementById(blockId).querySelector('img');
    if (arrowIcon.getAttribute('src') === 'icons/down_arrow.png') {
        arrowIcon.src = 'icons/up_arrow.png';
    } else {
        arrowIcon.src = 'icons/down_arrow.png';
    }
    if (tabsList.style.display === 'none') {
        tabsList.style.display = 'block';
    } else {
        tabsList.style.display = 'none';
    }
}

function moveTabToBlock(tabId, newState) {
    chrome.storage.local.get('savedTabs', function (data) {
        var savedTabs = data.savedTabs || [];
        var tabToMove = savedTabs.find(function (savedTab) {
            return savedTab.id === tabId;
        });
        if (tabToMove) {
            tabToMove.state = newState;
            chrome.storage.local.set({ 'savedTabs': savedTabs }, function () {
                loadSavedTabs();
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadSavedTabs();
});





