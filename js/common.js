var Settings = {
  // set to false for development
  ONLINE: true,
  UI_TIMEOUT: 2000,

  API_KEY: 'GQyCKJBmiufakgJ7P5T1eAsxV',
  API_SECRET: 'Hmwv71tVYpHOSOrNT7w0WGdb71JG5Wgxcfo3Gn2qDlhmbtWs2w',
  //  ACCESS_TOKEN : null,
  //  ACCESS_TOKEN_SECRET : null,
  ACCESS_TOKEN: '54256387-TFUcMqAJdEMDWjyMOmsXMhyi4B95cxakSfF3aQ6tv',
  ACCESS_TOKEN_SECRET: 'd45FxNmL5NiVsO5EWzZhPECmqEycAwSMO5Jk8jebGBqbR',

  AUTH_STATE_LOGIN: 'login',
  AUTH_STATE_PIN: 'pin',
  AUTH_STATE_COMPLETED: 'completed',

  PROPERTIES: ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret', 'authState',
    'embedShowMedia', 'embedShowConversation', 'embedIncludeScriptTag'],
  properties: {},

  init: function (success, failure) {
    chrome.storage.sync.get(this.PROPERTIES, function (properties) {
      Settings.properties = properties;
      success(properties);
    });
  },

  save: function (properties, callback) {
    chrome.storage.sync.set(properties, function () {
      for (var key in properties) {
        Settings.properties[key] = properties[key];
      }
      if (callback) {
        callback();
      }
    });
  },

  remove: function (properties, callback) {
    chrome.storage.sync.remove(properties, function () {
      for (var key in properties) {
        delete Settings.properties[key];
      }
      if (callback) {
        callback();
      }
    });
  }
}

var URL = {
  CHROME_BASE: "chrome-extension://" + chrome.runtime.id + "/",

  make: function (page, params) {
    if (!params) {
      params = {}
    }
    params['page'] = page;
    var url = URL.CHROME_BASE + "page.html?" + QueryString.encode(params);
    return url;
  },

  open: function (page, params) {
    var url = URL.make(page, params);
    chrome.tabs.create({
      "url": url
    });
  },

  external: function (url) {
    chrome.tabs.create({
      "url": url
    });
  }
}

var QueryString = {
  encode: function (obj) {
    var str = [];
    for (var p in obj) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
  },

  parse: function (str) {
    var query = {};
    var a = str.split('&');
    for (var i in a) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
  },

  get: function (name, _default) {
    var value = _default;
    var search = window.location.search;
    if (search.length > 0) {
      search = search.substring(1);
      var qs = QueryString.parse(search);
      if (qs[name]) {
        value = qs[name];
      }
    }
    return value;
  }
}

Settings.DEFAULT = {
  'apiKey': Settings.API_KEY,
  'apiSecret': Settings.API_SECRET,
  'accessToken': Settings.ACCESS_TOKEN,
  'accessTokenSecret': Settings.ACCESS_TOKEN_SECRET,
  'authState': Settings.AUTH_STATE_LOGIN,
  'embedShowMedia': false,
  'embedShowConversation': false,
  'embedIncludeScriptTag': false
}