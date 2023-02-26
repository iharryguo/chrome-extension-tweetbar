/**
 * @author Dongxu Huang
 * @date   2010-2-21
 * @date   2023-2-26 引入了 speech.js 为了 playAudio('http://dict.youdao.com/dictvoice?audio=' + word + '&type=1')
 */

var Options =
{
  "dict_disable": ["checked", false],
  "ctrl_only": ["checked", false],
  "english_only": ["checked", false],
  "autoplay": ["checked", false],
  "playwhenhovering": ["checked", false],
  "playwhenclicking": ["checked", false]
};

{
  // 自动搜索当前剪贴板中的文字，最大只允许 50 个字符。超过的话，就直接呈现上次结果
  var tempNode = document.createElement("input");
  document.body.appendChild(tempNode);
  tempNode.maxLength = 51;
  tempNode.focus();
  document.execCommand("paste");
  var clipboardText = tempNode.value; //this is your clipboard data
  document.body.removeChild(tempNode);

  var worldNode = document.getElementById('word');
  if (worldNode) {
    if (clipboardText && clipboardText.length <= 50
       && clipboardText != localStorage["LastCopy"]) {
      worldNode.value = clipboardText;
      worldNode.select();
      localStorage["LastCopy"] = clipboardText;
      mainQuery(clipboardText, translateXML);
    } else {
      // 恢复上次结果
      var resultHtml = document.getElementById('result');
      var lastResults = localStorage["LastResults"];
      if (resultHtml && lastResults)
        resultHtml.innerHTML = localStorage["LastResults"];
  
      var worldNode = document.getElementById('word');
      var lastWord = localStorage["LastWord"];
      if (worldNode && lastWord) {
        worldNode.value = lastWord;
        worldNode.select();
      }
    }
    worldNode.oninput = function(event) {
      if (worldNode.value == ' ')
        window.close();
    };
  }

  // 半透明
  // var myBody = document.getElementById("my_body");
  // myBody.style.opacity = "0.4";
}

var phonetic = "";
var phoneticHistory = ""; // 用于保存历史记录
var retphrase = "";
var basetrans = "";
var basetransHistory = ""; // 用于保存历史记录
var webtrans = "";
var webtransHistory = ""; // 用于保存历史记录
var noBaseTrans = false;
var noWebTrans = false;
function isChinese(temp) {
  var re = /[^\u4e00-\u9fa5]/;
  if (re.test(temp)) return false;
  return true;
}
function isJapanese(temp) {
  var re = /[^\u0800-\u4e00]/;
  if (re.test(temp)) return false;
  return true;
}
function isKoera(str) {
  for (i = 0; i < str.length; i++) {
    if (((str.charCodeAt(i) > 0x3130 && str.charCodeAt(i) < 0x318F) || (str.charCodeAt(i) >= 0xAC00 && str.charCodeAt(i) <= 0xD7A3))) {
      return true;
    }
  }
  return false;
}
function isContainKoera(temp) {
  var cnt = 0;
  for (var i = 0; i < temp.length; i++) {
    if (isKoera(temp.charAt(i)))
      cnt++;
  }
  if (cnt > 0) return true;
  return false;
}

function isContainChinese(temp) {
  var cnt = 0;
  for (var i = 0; i < temp.length; i++) {
    if (isChinese(temp.charAt(i)))
      cnt++;
  }
  if (cnt > 5) return true;
  return false;
}
function isContainJapanese(temp) {
  var cnt = 0;
  for (var i = 0; i < temp.length; i++) {
    if (isJapanese(temp.charAt(i)))
      cnt++;
  }
  if (cnt > 2) return true;
  return false;
}
var langType = '';
function translateXML(xmlnode) {
  var translate = "<strong>查询:</strong><br/>";
  var root = xmlnode.getElementsByTagName("yodaodict")[0];

  if ("" + root.getElementsByTagName("return-phrase")[0].childNodes[0] != "undefined")
    retphrase = root.getElementsByTagName("return-phrase")[0].childNodes[0].nodeValue;

  if ("" + root.getElementsByTagName("lang")[0] != "undefined") {
    langType = root.getElementsByTagName("lang")[0].childNodes[0].nodeValue;
  }

  // 音标
  var phouk = "";
  if ("" + root.getElementsByTagName("uk-phonetic-symbol")[0] != "undefined") {
    if ("" + root.getElementsByTagName("uk-phonetic-symbol")[0].childNodes[0] != "undefined")
      phouk = root.getElementsByTagName("uk-phonetic-symbol")[0].childNodes[0].nodeValue;
    if (phouk != null) {
      phonetic += "英[" + phouk + "]";
      phoneticHistory = phonetic;
    }
  }
  var phous = "";
  if ("" + root.getElementsByTagName("us-phonetic-symbol")[0] != "undefined") {
    if ("" + root.getElementsByTagName("us-phonetic-symbol")[0].childNodes[0] != "undefined")
      phous = root.getElementsByTagName("us-phonetic-symbol")[0].childNodes[0].nodeValue;
    if (phous != null) {
      // 两个音标之间，插入间隔
      if (phonetic !== "") {
        phonetic += (phonetic.length >= 25 ? "<br/>" : "&nbsp;&nbsp;");
      }
      phonetic += "美[" + phous + "]<br/>";
      phoneticHistory += " 美[" + phous + "]";
    }
  }
  // 补充换行符
  if (phous === "" && phonetic !== "")
    phonetic += "<br/>";
  if (phonetic === "") {
    if ("" + root.getElementsByTagName("phonetic-symbol")[0] != "undefined") {
      if ("" + root.getElementsByTagName("phonetic-symbol")[0].childNodes[0] != "undefined")
        var pho = root.getElementsByTagName("phonetic-symbol")[0].childNodes[0].nodeValue;
      if (pho != null) {
        phonetic += "注音[" + pho + "]<br/>";
        phoneticHistory += "  注音[" + pho + "]";
      }
    }
  }

  if ("" + root.getElementsByTagName("translation")[0] == "undefined") {
    noBaseTrans = true;
  }
  if ("" + root.getElementsByTagName("web-translation")[0] == "undefined") {
    noWebTrans = true;
  }


  if (noBaseTrans == false) {
    translate += retphrase + "<br/><br/><strong>基本释义:</strong><br/>";

    if ("" + root.getElementsByTagName("translation")[0].childNodes[0] != "undefined")
      var translations = root.getElementsByTagName("translation");
    else {
      basetrans += '未找到基本释义';
    }

    for (var i = 0; i < translations.length; i++) {
      var line = translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue;
      basetransHistory += ("    " + line + "\n");
      line += "<br/>";
      if (line.length > 50) {
        var reg = /[;；]/;
        var childs = line.split(reg);
        line = '';
        for (var j = 0; j < childs.length; j++)
          line += childs[j] + "<br/>";
      }
      basetrans += line;
    }
  }
  if (noWebTrans == false) {
    if ("" + root.getElementsByTagName("web-translation")[0].childNodes[0] != "undefined")
      var webtranslations = root.getElementsByTagName("web-translation");
    else {
      webtrans += '未找到网络释义';
    }

    for (var i = 0; i < webtranslations.length; i++) {
      var key = webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ": ";
      webtrans += key;
      var value = webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue;
      webtrans += (value + "<br/>");
      webtransHistory += ("    " + key + value + "\n");
    }
  }
  mainFrameQuery();

  // select the word, for quick inputting next word
  var worldNode = document.getElementById('word');
  if (worldNode)
    worldNode.select();
  return;
}
var _word;

function mainQuery(word, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function (data) {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        var dataText = translateXML(xhr.responseXML);
        if (dataText != null)
          callback(dataText);
      }
    }
  }
  _word = word;
  var url = 'http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q=' + encodeURIComponent(word) + '&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng'
  xhr.open('GET', url, true);
  xhr.send();
}
function removeDiv(divname) {
  var div = document.getElementById(divname);
  if (div == null) return;
  div.parentNode.removeChild(div);
}

/**
 * @str: 待查找的字符串
 * @substr: 查找内容
 * @times: 指定第几次出现
 */
function findPosition(str, substr, times = 1) {
  var start = 0;
  var pos = -1;
  for (var i = 0; i < times; i++) {
    pos = str.indexOf(substr, start);
    if (pos == -1)
      break;
    else
      start = pos + substr.length;
  }
  return pos;
}

function mainFrameQuery() {
  removeDiv('opt_text');
  removeDiv('opt_text');
  removeDiv('opt_text');
  removeDiv('opt_text');
  var lan = '';
  if (isContainKoera(_word)) {
    lan = "&le=ko";
  }
  if (isContainJapanese(_word)) {
    lan = "&le=jap";
  }
  if (langType == 'fr') {
    lan = "&le=fr";
  }
  var res = document.getElementById('result');
  res.innerHTML = '';
  if (noBaseTrans == false) {
    phonetic = "<strong>音标:</strong><br/>" + phonetic;
    res.innerHTML = phonetic;
    if (langType == 'ko') {
      basetrans = "<strong>韩汉翻译:</strong><br/>" + basetrans;
      basetransHistory = "  [韩汉翻译]:\n" + basetransHistory;
    }
    else if (langType == 'jap') {
      basetrans = "<strong>日汉翻译:</strong><br/>" + basetrans;
      basetransHistory = "  [日汉翻译]:\n" + basetransHistory;
    }
    else if (langType == 'fr') {
      basetrans = "<strong>法汉翻译:</strong><br/>" + basetrans;
      basetransHistory = "  [法汉翻译]:\n" + basetransHistory;
    }
    else {
      basetrans = "<strong>英汉翻译:</strong><br/>" + basetrans;
      basetransHistory = "  [英汉翻译]:\n" + basetransHistory;
    }
    res.innerHTML += basetrans;
  }
  if (noWebTrans == false) {
    webtrans = "<strong>网络释义:</strong><br/>" + webtrans;
    webtransHistory = "  [网络释义]:\n" + webtransHistory;
    res.innerHTML += webtrans;
  }
  if (noBaseTrans == false || noWebTrans == false) {
    res.innerHTML += "<a href ='http://dict.youdao.com/search?q=" + encodeURIComponent(_word) + "&ue=utf8&keyfrom=chrome.extension" + lan + "' target=_blank>点击 查看详细释义</a>";
  }
  // 发音音频： type=1 英音； type=2 美音
  playAudio('http://dict.youdao.com/dictvoice?audio=' + retphrase + '&type=2');

  var worldNode = document.getElementById('word');
  if (noBaseTrans && noWebTrans) {
    res.innerHTML = "未找到英汉翻译!";
    res.innerHTML += "<br><a href ='http://www.youdao.com/search?q=" + encodeURIComponent(_word) + "&ue=utf8&keyfrom=chrome.extension' target=_blank>尝试用有道搜索</a>";
  } else {
    // 保存所有查询记录（上限：总字数不大于200K。总字数大于150K时，就提示）
    // allQueryRes： just for short
    var allQueryRes = localStorage["AllQueryRes"];
    if (!allQueryRes) {
      localStorage["AllQueryRes"] = '';
      allQueryRes = '';
    }
    var wordSep = "---------------------";
    if (allQueryRes && allQueryRes.length > 130*1000) {
      if (allQueryRes.length > 200*1000) {
        // 找到第 10 个单词所在的位置。一次淘汰10个单词，大约每隔10次做一次淘汰
        var nextWordPos = findPosition(allQueryRes, wordSep, 10);
        localStorage["AllQueryRes"] = allQueryRes.substr(nextWordPos);
        res.innerHTML = "<strong style='color:red'>历史记录超过200K，最早的记录已被清空~~</strong><br/>" + res.innerHTML;
      } else {
        res.innerHTML = "<strong>历史记录已达 " + allQueryRes.length + " ，请及时导出（超出200K就将清空）！！！</strong><br/>" + res.innerHTML;
      }
    }
    localStorage["AllQueryRes"] += (wordSep + '\n【 ' + worldNode.value + ' 】: ' + phoneticHistory + "\n" + basetransHistory + "\n" + webtransHistory + '\n\n');
  }

  // 保存结果
  if (worldNode)
    localStorage["LastWord"] = worldNode.value;
  localStorage["LastResults"] = res.innerHTML;

  phonetic = '';
  phoneticHistory = '';
  retphrase = '';
  webtrans = '';
  webtransHistory = '';
  basetrans = '';
  basetransHistory = '';
  _word = '';
  langType = '';
  noBaseTrans = false;
  noWebTrans = false;
  document.getElementsByName('word')[0].focus();
}

var DefaultOptions =
{
  "dict_disable": ["checked", false],
  "ctrl_only": ["checked", false],
  "english_only": ["checked", true],
  "autoplay": ["checked", false],
  "playwhenhovering": ["checked", true],
  "playwhenclicking": ["checked", false]
};

var ColorsChanged = true;

if (localStorage["ColorOptions"] == undefined) {
  localStorage["ColorOptions"] = JSON.stringify(DefaultOptions);
}

function save_options() {
  changeIcon();
  for (key in Options) {
    if (Options[key][0] == "checked") {
      Options[key][1] = document.getElementById(key).checked;
    }
  }
  localStorage["ColorOptions"] = JSON.stringify(Options);
}
function goFeedback() {
  window.open("http://feedback.youdao.com/deskapp_report.jsp?prodtype=deskdict&ver=chrome.extension");
}
function goAbout() {
  window.open("http://cidian.youdao.com/chromeplus");
}
function changeIcon() {

  if (document.getElementById('dict_disable').checked) {

    var a = document.getElementById('ctrl_only');
    a.disabled = true;
    a.parentElement.style.color = 'grey';

    a = document.getElementById('english_only');
    a.disabled = true;
    a.parentElement.style.color = 'grey';

    a = document.getElementById('autoplay');
    a.disabled = true;
    a.parentElement.style.color = 'grey';
    a = document.getElementById('playwhenhovering');
    a.disabled = true;
    a.parentElement.style.color = 'grey';
    a = document.getElementById('playwhenclicking');
    a.disabled = true;
    a.parentElement.style.color = 'grey';
  }
  else {
    var a = document.getElementById('ctrl_only');
    a.disabled = false;
    a.parentElement.style.color = 'black';

    a = document.getElementById('english_only');
    a.disabled = false;
    a.parentElement.style.color = 'black';

    a = document.getElementById('autoplay');
    a.disabled = false;
    a.parentElement.style.color = 'black';
    a = document.getElementById('playwhenhovering');
    a.disabled = false;
    a.parentElement.style.color = 'black';
    a = document.getElementById('playwhenclicking');
    a.disabled = false;
    a.parentElement.style.color = 'black';
  }
}

function check() {
  var word = document.getElementsByName("word")[0].value;
  window.open("http://dict.youdao.com/search?q=" + encodeURI(word) + "&ue=utf8&keyfrom=chrome.index");
}
function restore_options() {
  var localOptions = JSON.parse(localStorage["ColorOptions"]);

  for (key in localOptions) {
    optionValue = localOptions[key];
    if (!optionValue) return;
    var element = document.getElementById(key);
    if (element) {
      element.value = localOptions[key][1];
      switch (localOptions[key][0]) {
        case "checked":
          if (localOptions[key][1]) element.checked = true;
          else element.checked = false;
          break;
      }
    }
  }

}

document.body.onload = function () { restore_options(); document.getElementById('word').focus(); changeIcon(); };
document.getElementById("dict_disable").onclick = function () { save_options(); };
document.getElementById("ctrl_only").onclick = function () { save_options(); };
document.getElementById("english_only").onclick = function () { save_options(); };
document.getElementById("autoplay").onclick = function () { save_options(); };
document.getElementById("playwhenhovering").onclick = function () { save_options(); };
document.getElementById("playwhenclicking").onclick = function () { save_options(); };
document.getElementById("feedback").onclick = function () { goFeedback(); };
document.getElementById("about").onclick = function () { goAbout(); };
document.getElementById("word").onkeydown = function () { if (event.keyCode == 13) mainQuery(document.getElementsByName("word")[0].value, translateXML); };
document.getElementById("querybutton").onclick = function () {
   mainQuery(document.getElementsByName("word")[0].value, translateXML);
};
