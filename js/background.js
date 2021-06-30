/**
 * background.js is loaded once per browser instance. acts as the handler from
 * page.js and dispatcher to contentscript.js
 */

var manifest = chrome.runtime.getManifest();

if (chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(function () {
    Settings.save(Settings.DEFAULT);
  });

  // Put page action icon on all tabs
  // chrome.tabs.onUpdated.addListener(function(tabId) {
  //   chrome.browserAction.show(tabId);
  // });

  // chrome.tabs.getSelected(null, function(tab) {
  //   chrome.browserAction.show(tab.id);
  // });

  // Send request to current tab when page action is clicked
  chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "toggleSidebar" },
        function (response) {
          console.log(response);
        }
      );
    });
  });
};

// 监听本插件的图标被点击时
// chrome.browserAction.onClicked.addListener(function (tab) {
//   chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
// });

// Handle message from page
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var type = request.type;
  if (type == "background.reloadSettings") {
    init();
    sendResponse({});
    // allow async callback of sendResponse()
    return true;
  }
});

chrome.webRequest.onCompleted.addListener(function (details) {
  // Do something after web request complete
},

{ urls: ["<all_urls>"] },
["responseHeaders"]);

function init() {
  Settings.init(function () {
    console.log("Settings.init complete");
  }, function () {
    URL.open("settings");
  });
}

init();
