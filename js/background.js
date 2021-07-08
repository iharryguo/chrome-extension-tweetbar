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
};

// 监听本插件的图标被点击时
// chrome.browserAction.onClicked.addListener(function (tab) {
//   chrome.tabs.getSelected(null, function (tab) {
//     console.log("chrome.browserAction.onClicked url:" + tab.url);
//     chrome.tabs.sendMessage(
//       tab.id,
//       { action: "page-show-fanyi-inpage" },
//       function (response) {
//         if (response)
//           console.log(response);
//       }
//     );
//   });
// });

// 监测网址变化
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   if (tab.url.indexOf("chrome://") == 0 && changeInfo.status == "loading") {
//     chrome.browserAction.setPopup({
//       tabId: tab.id,
//       popup: 'option/options.html'
//     });
//   }
// });
// 监听本插件的图标被点击时
// chrome.browserAction.onClicked.addListener(function (tab) {
//   chrome.tabs.sendMessage(tab.id, { action: 'page-show-fanyi-inpage' });
// });

// chrome.webRequest.onCompleted.addListener(function (details) {
//   // Do something after web request complete
// }, { urls: ["<all_urls>"] },
//   ["responseHeaders"]);

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

// listen hot key
chrome.commands.onCommand.addListener(function callback(command) {
  if (command.indexOf('show-fanyi-inpage') === 0) {
    chrome.tabs.getSelected(null, function (tab) {
      console.log("show-fanyi-inpage url:" + tab.url);
      chrome.tabs.sendMessage(
        tab.id,
        { action: "page-show-fanyi-inpage" }
      );
    });
  } else if (command.indexOf('open-work-table') === 0) {
    chrome.tabs.getSelected(null, function (tab) {
      console.log("open-work-table url:" + tab.url);
      // open work table in current tab
      if (tab.url.indexOf("chrome://newtab") == 0 || tab.url.indexOf("chrome://new-tab-page") == 0) {
        chrome.tabs.update(tab.id, { url: "https://docs.qq.com/doc/DSEVPY1JJd2NIa2R3" });
      } else {
        chrome.tabs.create({ url: 'https://docs.qq.com/doc/DSEVPY1JJd2NIa2R3' });
      }
    });
  }  else if (command.indexOf('open-important-table') === 0) {
    chrome.tabs.getSelected(null, function (tab) {
      console.log("open-important-table url:" + tab.url);
      // open important table(tencent doc stared) in current tab
      if (tab.url.indexOf("chrome://newtab") == 0 || tab.url.indexOf("chrome://new-tab-page") == 0) {
        chrome.tabs.update(tab.id, { url: "https://docs.qq.com/desktop/stared" });
      } else {
        chrome.tabs.create({ url: 'https://docs.qq.com/desktop/stared' });
      }
    });
  } else if (command.indexOf('open-fanyi-on-right') === 0) {
    openFanyiOnRight();
  }
});

function init() {
  Settings.init(function () {
    console.log("Settings.init complete");
  }, function () {
    URL.open("settings");
  });
}

init();
