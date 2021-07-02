/**
 * contentscript.js handles only requests to modify the DOM.
 * 
 * menu items are initialized in background.js
 */

var Sidebar = {
  DOM_ID: "fanyiqq_sidebar",
  sidebar: null,

  CSS_COMMON: "\
    position:fixed;\
    top:0px;\
    left:0px;\
    width:350px;\
    height:100%;\
    padding:0px;\
    background:white;\
    border-left: 2px solid #999;\
    z-index:9999999999;\
    overflow:hidden;\
  ",

  init: function () {
  },

  toggle: function (request) {
    var mySidebar = document.getElementById(Sidebar.DOM_ID);
    if (mySidebar) {
      if (mySidebar.style.display != "none") {
        // hide side bar
        mySidebar.style.display = "none";
      } else {
        // show side bar
        mySidebar.style.display = "block";
        mySidebar.style.opacity = "0.8";
        setTimeout(function () {
          mySidebar.style.opacity = "0.2";
        }, 1000);
      }
      return undefined;
    } else {
      // create new sidebar
      var mySidebar = document.createElement('div');
      mySidebar.id = Sidebar.DOM_ID;
      mySidebar.innerHTML = '<iframe src ="https://fanyi.qq.com/" width="100%"\
        height="100%"><p>Your browser does not support iframes.</p></iframe>';

      var funMouseMotion = function (event) {
        if (event.type == "mousemove") {
          console.log('鼠标移入');
          mySidebar.style.opacity = "0.7";
        } else if (event.type == "mouseout") {
          console.log('鼠标移出');
          mySidebar.style.opacity = "0.2";
        }
      };
      mySidebar.onmousemove = funMouseMotion;
      mySidebar.onmouseout = funMouseMotion;

      Sidebar.sidebar = mySidebar;
      document.body.appendChild(Sidebar.sidebar);
      Sidebar.sidebar.style.cssText = Sidebar.CSS_VISIBLE;
      mySidebar.style.opacity = "0.8";

      setTimeout(function () {
        // var iframeWindow = document.getElementById("fanyiqq_sidebar_iframe").contentWindow;
        // iframeWindow.addEventListener("keypress",function(event) {
        //   // 监听了按键
        //   console.log(event.key);
        //   Sidebar.sidebar.style.opacity="0.7";
        // },false);
        Sidebar.sidebar.style.opacity = "0.2";
      }, 1000);
      return Sidebar.sidebar;
    }
  },
}

Sidebar.CSS_VISIBLE = Sidebar.CSS_COMMON + "display:block;";
Sidebar.CSS_HIDDEN = Sidebar.CSS_COMMON + "display:none;";

//prevent IFRAMES from loading this listener multiple times.
if (!window.top.listenerLoaded) {
  console.log('listener loading');
  window.top.listenerLoaded = true;
  Sidebar.init();

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('onMessage: ' + request.action)
    if (request.action == "page-show-fanyi-inpage") {
      Sidebar.toggle(request);
    }
  });

  console.log('contentscript.js: loaded (' + (new Date()).getTime() + ')');
}

