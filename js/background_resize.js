// -------------------------------------------------------------------------------------------
// Bellow is resize code
// -------------------------------------------------------------------------------------------
export { openFanyiOnRight };

// 在文件顶部添加此函数
function getResizeParams(command) {
    const params = {
        primaryRatio: 7,    // 默认主窗口占70%
        secondaryRatio: 3,  // 副窗口占30%
        orientation: 'horizontal',
        rows: 1,
        cols: 2
    };

    if (command.includes('scale')) {
        // 如果有缩放参数，解析具体比例
        const scaleMatch = command.match(/scale-(\d+)-(\d+)/);
        if (scaleMatch) {
            params.primaryRatio = parseInt(scaleMatch[1]);
            params.secondaryRatio = parseInt(scaleMatch[2]);
        }
        
        // 检查方向参数
        if (command.includes('vertical')) {
            params.orientation = 'vertical';
        }
    }
    
    // 其他命令可能修改rows和cols
    if (command.includes('grid')) {
        const gridMatch = command.match(/grid-(\d+)x(\d+)/);
        if (gridMatch) {
            params.rows = parseInt(gridMatch[1]);
            params.cols = parseInt(gridMatch[2]);
        }
    }

    return params;
}

function openFanyiOnRight(command) {
	if(chrome.system && chrome.system.display) {
		chrome.system.display.getInfo(function(displayInfo){
			chrome.windows.getCurrent(function(windowInfo) {
				var currentWindowInfo = {
					left: windowInfo.left + windowInfo.width - 100,
					top: windowInfo.top + 100
				};

				var displayJSON = util.displayInfoFormatter(displayInfo,currentWindowInfo),
					isScaled = command.indexOf('scale') !== -1,
					resizeParams = getResizeParams(command);

				if(isScaled){
					resizeScaledTabs(displayJSON.displays[displayJSON.primaryIndex].workArea, resizeParams.primaryRatio, resizeParams.secondaryRatio, resizeParams.orientation);
				} else {
					resizeTabs(displayJSON.displays[displayJSON.primaryIndex].workArea,resizeParams.rows,resizeParams.cols);
				}
			});
		});
	};
  chrome.tabs.create({ url: 'https://www.kdocs.cn/latest' });
}
var util = {
	/**
	* creates a new window at specific location with the tab input
	* @param {Number} tabId - id of main tab in new window
	* @param {Number} startX - horizontal position of window
	* @param {Number} startY - vertical position of window
	* @param {Number} width - width of window
	* @param {Number} height - height of window
	* @param {boolean} incog - if window is of type incognito
	* @param {function} callback - callback function after window is created
	*/
	createNewWindow: function(tabId, startX, startY, width, height, incog, callback) {
		var objectInfo = {
			url: 'https://fanyi.qq.com/',
			left: startX,
			top: startY,
			width: width,
			height: height,
			incognito: incog
		};

		if(tabId){
			if($.isArray(tabId)){
				objectInfo.tabId = tabId[0];
			} else {
				objectInfo.tabId = tabId;
			}
		}

		window.chrome.windows.create(objectInfo,
								function(_windowCb){
									callback(_windowCb, tabId);
								}
		);
	},

	/**
	* iterates through tab array to create layout
	* @param {array} tabsArray array of tab objects to be moved
	* @param {number} startIndex index of selected tab in window
	* @param {number} windowId index of window
	* @param {boolean} singleTab flag of single tab option
	* @param {boolean} incog - if window is of type incognito
	* @param {string} veritical or horizontal for scaled layouts
	*/
	processTabs: function(resize, tabsArray, startIndex, windowId, singleTab, incog, scaledOrientation) {
		var tabId,
			_tabsArray = tabsArray.slice(startIndex),
			index = 0,
			numEmptyWindows = 0,
			tabsLength = _tabsArray.length,
			emptyWindowLimit = (resize.numRows * resize.numCols) - tabsLength,
			that = this,
			leftValue,
			rightValue,
			createNewWindowCB = function(_windowCb,_tabId){
				//only if update storage when tab option is used
				if(!_tabId && resize.emptyTab){
						_tabsArray.push(_windowCb.tabs[0]);
						numEmptyWindows++;
					if(emptyWindowLimit === numEmptyWindows){
						that.updateUndoStorage(resize, _tabsArray);
					}
				} else if(_tabId && $.isArray(_tabId)){ //moving tabs to last window
					chrome.tabs.move(_tabId.slice(1),{
						windowId: _windowCb.id,
						index: 1
					});
				}
			};

		if (resize.numRows == 1 && resize.numCols == 1) {
			chrome.tabs.create({url: 'https://docs.qq.com/doc/DSEVPY1JJd2NIa2R3'});
			return;
		}
		//loop through all row and col options
		for(var y=0; y<resize.numRows; y++){
			for(var x=0; x<resize.numCols; x++){

				if(resize.alignment === 'left'){
					leftValue = (x*resize.width) + resize.offsetX;
				} else {
					leftValue = resize.fullWidth - ((x+1)*resize.width) + resize.offsetX;
				}

				topValue = (y*resize.height) + resize.offsetY;

				// base case we update the current window
				if(x === 0 && y === 0){
					window.chrome.windows.update(_tabsArray[index].windowId,{ left: leftValue,
												top: topValue,
												width: resize.width,
												height: resize.height,
												state: "normal"
											});

					if(singleTab){
						return;
					}
				} else { //otherwise we create a new window
					tabId = _tabsArray[index] ? _tabsArray[index].id : null;

					//when no more tabs avaiable and option to create empty tab is not checked
					if(!tabId && !resize.emptyTab){
						return;
					}

					//splitting the rest of the tabs to the last window created
					if(y === resize.numRows-1 && x === resize.numCols -1 && tabsLength - index > 1){
						tabId = [];
						for(var z = index; z < tabsLength; z++){
							tabId.push(_tabsArray[z].id);
						}
					}

					//check the number of new windows that will be created
					//store the windowId information

					//handling secondary ratio
					if(scaledOrientation){
						if(scaledOrientation === 'horizontal'){
							resize.width = resize.fullWidth - resize.width;
							if(resize.alignment !== 'left'){
								leftValue = resize.offsetX;
							}
						} else {
							resize.height = resize.fullHeight - resize.height;
						}
					}

					if (resize.numRows == 1 && resize.numCols == 2)
						that.createNewWindow(tabId, leftValue, topValue, resize.fullWidth - resize.width, resize.height, incog, createNewWindowCB);
					else
						that.createNewWindow(tabId, leftValue, topValue, resize.width, resize.height, incog, createNewWindowCB);

				}
				index++;
			}
		}
	},

	/**
	* set storage of last window and tabs being moved
	* @param {object} resize object from foreground
	* @param {number} tabIndex Starting tab index in previous window of first tab
	* @param {number} windowId Id of the previous window object which was modified
	* @param {array} tabsArray Array of tab objects to be moved back to the previous window
	*/
	setUndoStorage: function(resize, tabIndex, windowId, tabsArray, cb) {
		window.chrome.windows.get(windowId,{},function(_windowCb){
			var updateInfo = {	left: _windowCb.left,
								top: _windowCb.top,
								width: _windowCb.width,
								height: _windowCb.height,
								focused: true,
								state: _windowCb.state,
								incognito: _windowCb.incognito
							};
			var lastTab = {};
			lastTab.lastWindowInfo = updateInfo;
			lastTab.lastTabIndex = tabIndex;
			lastTab.lastWindowId = windowId;
			var tabsStore = [];
			for(var x=0; x<tabsArray.length; x++){
				tabsStore.push(tabsArray[x].id);
			}
			lastTab.lastTabsArray = tabsStore;
			chrome.storage.local.set('lastTab',JSON.stringify(lastTab));
			chrome.runtime.sendMessage('enable-undo');
			cb();
		});
	},

	/**
	* set storage of last window and tabs being moved
	* @param {object} resize object from foreground
	* @param {array} tabsArray Array of tab objects to be moved back to the previous window
	*/
	updateUndoStorage: function(resize, tabsArray) {
		var currentLastTab = JSON.parse(chrome.storage.local.get('lastTab'));
		var tabsStore = [];
		for(var x=0; x<tabsArray.length; x++){
			tabsStore.push(tabsArray[x].id);
		}
		if(currentLastTab){
			currentLastTab.lastTabsArray = tabsStore;
			chrome.storage.local.set('lastTab',JSON.stringify(currentLastTab));
			chrome.runtime.sendMessage('enable-undo');
		}
	},


	/*
	* undo previous resize option
	*/

	/**
	* undo the previous resize that was selected
	*/
	undoResize: function(resize,callback) {
		var that = this,
			lastTab = chrome.storage.local.get('lastTab');

		//undo not available
		if(!lastTab){
			return;
		}

		resize.lastTab = JSON.parse(lastTab);
		var tabIndex = resize.lastTab.lastTabIndex;
		var windowId = resize.lastTab.lastWindowId;
		var tabsArray = resize.lastTab.lastTabsArray;

		window.chrome.windows.get(windowId, {}, function(window){
			if(window){
				that.removeTabAndRestore(resize,tabIndex,windowId,tabsArray,callback);
			} else {
				chrome.tabs.query({status: "complete"}, function(tabs){
					var currentExistingTabs = {};
					var newTabsArray = [];
					for(var i=0; i< tabs.length; i++){
						currentExistingTabs[tabs[i].id] = true;
					}
					for(var j = 0; j< tabsArray.length; j++){
						if(currentExistingTabs[tabsArray[j]]){
							newTabsArray.push(tabsArray[j]);
						}
					}
					if(newTabsArray.length !==0){
						chrome.windows.create({tabId: newTabsArray[0]},function(window){
							that.recombineTabs(resize,1,window.id,newTabsArray.slice(1),callback);
						});
					} else {
						if(!resize.isMac){
							alert("Previous tabs were closed.");
						}
						if(callback){
							callback();
						}
					}
				});
			}
		});
	},

	/**
	* recombine the tabs into one window
	* @param {object} resize object passed in for modification
	* @param {number} tabIndex Starting tab index in previous window of first tab
	* @param {number} windowId Id of final window holding recombined tabs
	* @param {array} tabsArray Array of tab objects to be moved back to the previous window
	*/
	recombineTabs: function(resize,tabIndex, windowId, tabsArray, callback) {
		var indexCounter = tabIndex;
		window.chrome.tabs.move(tabsArray,{windowId: windowId, index: indexCounter});
		var updateInfo = resize.lastTab.lastWindowInfo;
		if (updateInfo.state == 'maximized')
			updateInfo = {state: "maximized"};
		var updateInfoForUpdate = $.extend(true, {}, updateInfo);
		delete updateInfoForUpdate.incognito;
		window.chrome.windows.update(windowId,updateInfoForUpdate);
		if(callback){
			callback();
		}
	},

	/**
	* remove the selected tab and restore the former one
	* @param {object} resize object passed in for modification
	* @param {number} tabIndex Starting tab index in previous window of first tab
	* @param {number} windowId Id of final window holding recombined tabs
	* @param {array} tabsArray Array of tab objects to be moved back to the previous window
	*/
	removeTabAndRestore: function(resize, tabIndex, windowId, tabsArray, callback) {
		chrome.tabs.remove(tabsArray[1]);
		var updateInfo = resize.lastTab.lastWindowInfo;
		if (updateInfo.state == 'maximized')
			updateInfo = {state: "maximized"};
		var updateInfoForUpdate = $.extend(true, {}, updateInfo);
		delete updateInfoForUpdate.incognito;
		window.chrome.windows.update(windowId,updateInfoForUpdate);
		if(callback){
			callback();
		}
	},

	//format the displayInfo
	displayInfoFormatter: function(displayInfo,currentWindowInfo){
		var index = 0,
			length = displayInfo.length,
			info,
			displayJSON = { //may need to check for some mirroring property, currently only one monitor is display when mirroring
				displays: [],
				primaryIndex: 0
			};

		for(;index<length;index++){
			info = displayInfo[index];
			info.id = String(index); //setting index of display
			displayJSON.displays.push({
				workArea: info.workArea,
				isEnabled: info.isEnabled,
				id: info.id
			});

			if(currentWindowInfo.left > info.workArea.left && currentWindowInfo.left < info.workArea.left + info.workArea.width && currentWindowInfo.top > info.workArea.top && currentWindowInfo.top < info.workArea.top + info.workArea.height){
				displayJSON.primaryIndex = index;
			}

		}
		return displayJSON;
	}

};

/**
* resizes tabs to the right of selected tab
* @param {object} screenInfo object with hardware screen properties
* @param {number} rows number of rows in resize layout
* @param {number} cols number of columns in resize layout
*/
function resizeTabs(screenInfo,rows,cols) {

	var resize = {};

	resize.numRows = rows;
	resize.numCols = cols;

	/*
	* split width of screen equally depending on number of cells
	* create new window unable to take non integers for width and height
	*/

	initResizePreferences(resize);
	seMainWidthHeight(resize, screenInfo,resize.numRows,resize.numCols);
	resizeTabHelper(resize, screenInfo);
}

function resizeScaledTabs(screenInfo, primaryRatio, secondaryRatio, orientation){

	var resize = {};

	resize.numRows = (orientation === 'horizontal' ? 1 : 2);
	resize.numCols = (orientation === 'horizontal' ? 2 : 1);

	/*
	* split width of screen equally depending on number of cells
	* create new window unable to take non integers for width and height
	*/

	initResizePreferences(resize);
	setScaledResizeWidthHeight(resize, screenInfo, primaryRatio, secondaryRatio, orientation);
	resizeTabHelper(resize, screenInfo, orientation);

}

function setScaledResizeWidthHeight(resize, screenInfo, primaryRatio, secondaryRatio, orientation){
	if(!$.isEmptyObject(screenInfo)){
		resize.width = (orientation === 'horizontal') ? Math.round(screenInfo.width*0.1*primaryRatio) : screenInfo.width;
		resize.height = (orientation === 'horizontal') ? screenInfo.height : Math.round(screenInfo.height*0.1*primaryRatio);
	} else {
		resize.width = (orientation === 'horizontal') ? Math.round(window.screen.availWidth*0.1*primaryRatio) : window.screen.availWidth;
		resize.height = (orientation === 'horizontal') ? window.screen.availHeight : Math.round(window.screen.availHeight*0.1*primaryRatio);
	}
}

function seMainWidthHeight(resize, screenInfo, rows, cols){
	if(!$.isEmptyObject(screenInfo)){
		if (rows == 1 && cols == 2) {
			resize.width = Math.round(screenInfo.width * 0.8);
			resize.height = Math.round(screenInfo.height/rows);
			return;
		}
		resize.width = Math.round(screenInfo.width/cols);
		resize.height = Math.round(screenInfo.height/rows);
	} else {
		resize.width = Math.round(window.screen.availWidth/cols);
		resize.height  = Math.round(window.screen.availHeight/rows);
	}
}

function setResizeWidthHeight(resize, screenInfo, rows, cols){
	if(!$.isEmptyObject(screenInfo)){
		resize.width = Math.round(screenInfo.width/cols);
		resize.height = Math.round(screenInfo.height/rows);
	} else {
		resize.width = Math.round(window.screen.availWidth/cols);
		resize.height  = Math.round(window.screen.availHeight/rows);
	}
}

function resizeTabHelper(resize, screenInfo, scaledOrientation){

	if(!$.isEmptyObject(screenInfo)){
		resize.offsetX = screenInfo.left;
		resize.offsetY = screenInfo.top;
		resize.fullWidth = screenInfo.width;
		resize.fullHeight = screenInfo.height;
	} else {
		resize.offsetX = 0;
		resize.offsetY = 0;
		resize.fullWidth = window.screen.availWidth;
		resize.fullHeight = window.screen.availHeight;
	}

	window.chrome.tabs.query({currentWindow: true},
		function (tabs) {
			resize.tabsArray = tabs;
			window.chrome.tabs.query({currentWindow: true, highlighted: true},
				function (tab) {
					resize.currentTab = tab[0];
					var index = resize.currentTab.index;
					if(tab.length > 1){
						resize.tabsArray = tab;
						index = 0;
					}

					var cb = function(){
							// reason for replace index with 'tabs.length - 1': I want to create a new fanyi.qq.com window, not split
							return util.processTabs(resize, resize.tabsArray, tabs.length - 1, resize.currentTab.windowId, resize.singleTab, resize.currentTab.incognito, scaledOrientation);
					};
					if(resize.singleTab){
						util.setUndoStorage(resize,resize.currentTab.index,resize.currentTab.windowId, resize.tabsArray.slice(index,index + 1), cb);
					} else {
						util.setUndoStorage(resize,resize.currentTab.index,resize.currentTab.windowId, resize.tabsArray.slice(index), cb);
					}

				}
			);
		}
	);
}

function initResizePreferences(resize){
	var singleTabValue = chrome.storage.local.get('singleTab');
	if(singleTabValue && singleTabValue === 'true'){
		resize.singleTab = true;
	}

	var emptyTabValue = chrome.storage.local.get('emptyTab');
	if(!emptyTabValue || emptyTabValue === 'true'){
		resize.emptyTab = true;
	}

	var alignmentValue = chrome.storage.local.get('alignment');
	if(!alignmentValue){
		resize.alignment = 'left';
	} else {
		resize.alignment = alignmentValue;
	}
}