'use strict';

var SERVER_HOST = "http://122.51.181.208:8080/";

function getServerUrl() {
    chrome.storage.sync.get('iContinue_server', function(result) {
        var iContinue_server = result.iContinue_server;
        if (!!iContinue_server) {
            SERVER_HOST = iContinue_server;
        }
    });
}

var reportingPromise;
var get_tab_reports = (timeout) => {
    if (!!reportingPromise && !reportingPromise.isFulfilled && !reportingPromise.isRejected) {
        return reportingPromise;
    }
    return reportingPromise = new Promise((resolve, reject) => {
        console.info('asking tabs to report...' + new Date().toLocaleString());
        chrome.tabs.query({}, function(tabs) {
            var promises = [];
            // ask each tab to report
            tabs.forEach(tab => {
                if (!/chrome:\/\//.test(tab.url) &&
                    !/chrome-extension:\/\//.test(tab.url) &&
                    "complete" == tab.status) {
                    promises.push(new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tab.id, { msg: "report" }, function(response) {
                            resolve(response);
                            promise.done = true;
                        });
                        setTimeout(_ => {
                            if (!promise.done) {
                                resolve();
                                promise.done = true;
                            }
                        }, timeout - 100);
                    }));
                }
            });
            // wait for all tab reprot their info
            Promise.all(promises).then((results) => {
                console.info('got all reports' + new Date().toLocaleString());
                results = results.filter(el => {
                    return !!el;
                });
                var tabGroup = {
                    createDT: new Date().getTime(),
                    tabs: results
                };
                console.info(tabGroup);
                resolve(tabGroup);
                reportingPromise.isFulfilled = true;
            }).catch(_ => {
                reject();
                reportingPromise.isRejected = true;
            });
        });
    });
}

var startAutoSaving = () => {
    getProfile().then(profile => {
        var interv = 10;
        if (!!profile && !!profile.autoSaveInterval) {
            interv = parseInt(profile.autoSaveInterval);
        }
        interv = interv * 1000;
        get_tab_reports(interv).then(tabgroup => {
            // save into server
            tabgroup.type = 'AUTO';
            if (!!profile && !!profile.identityCode) {
                postTabGroup(profile.identityCode, tabgroup);
            }
        }).finally(_ => {
            scheduleNext(interv);
        });
    }).catch(_ => scheduleNext());
};

var nextSchedule;
var scheduleNext = (interv) => {
    if (!interv) interv = 1000;
    console.info('next round after ' + (interv / 1000) + ' seconds.' + new Date().toLocaleString());
    nextSchedule = setTimeout(() => {
        startAutoSaving();
    }, interv);
};

var stopAutoSaving = () => {
    clearTimeout(nextSchedule);
};

// get Json from server
function getJsonFromURL(url) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        console.info(SERVER_HOST + url);
        xhr.open("GET", SERVER_HOST + url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    console.info(resp);
                    resolve(resp);
                } catch (error) {
                    reject(error);
                }
            }
        }
        xhr.addEventListener('error', e => {
            reject(e);
        });
        xhr.send();
    });
}

// delete from server
function deleteFromURL(url) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", SERVER_HOST + url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    resolve(resp);
                } catch (error) {
                    reject(error);
                }
            }
        }
        xhr.addEventListener('error', e => {
            reject(e);
        });
        xhr.send();
    });
}

// send Json to server
function postJsonToURL(url, data) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", SERVER_HOST + url);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                try {
                    var resp = JSON.parse(xhr.responseText);
                    resolve(resp);
                } catch (error) {
                    reject(error);
                }
            }
        }
        xhr.addEventListener('error', e => {
            reject(e);
        });
        xhr.send(JSON.stringify(data));
    });
}

// create new profile
function createNewProfile() {
    return getJsonFromURL("public/person/new");
}

// get profile by identitycode
function getProfileFromServer(identityCode) {
    return getJsonFromURL("public/person/" + identityCode);
}

//post tabgrop
function postTabGroup(identityCode, tabgrop) {
    console.info(tabgrop);
    return postJsonToURL("public/" + identityCode + "/tabgroups", tabgrop);
}

function turnAutoToManual(identityCode, id) {
    console.info("turnAutoToManual:" + id + new Date().toLocaleString());
    return getJsonFromURL("public/" + identityCode + "/tabgroups/" + id + "/toManual");
}

function removeTabGroup(identityCode, id) {
    console.info("removeTabGroup:" + id + new Date().toLocaleString());
    return deleteFromURL("public/" + identityCode + "/tabgroups/" + id);
}

//get all tabgroups
function getTabgroupsFromURL(identityCode) {
    return getJsonFromURL("public/" + identityCode + "/tabgroups");
}

var promise;

function getProfile(isRefreshFromServer) {
    if (!promise) {
        promise = new Promise((resolve, reject) => {
            // check if there is a profile, create one if there isn't and save it in sync storage.
            // the reason use sync is that the profile will be bound to the goole account.
            chrome.storage.sync.get('iContinue_profile', function(result) {
                var iContinue_profile = result.iContinue_profile;
                var saveProfile = (profile) => {
                    if (!!profile) {
                        console.info(profile);
                        chrome.storage.sync.remove('iContinue_profile');
                        chrome.storage.sync.set({
                            'iContinue_profile': profile
                        });
                    }
                    resolve(profile);
                };
                if (!iContinue_profile) {
                    createNewProfile().then(saveProfile).catch(reject);
                } else {
                    if (isRefreshFromServer) {
                        getProfileFromServer(iContinue_profile.identityCode).then(saveProfile).catch(_ => {
                            createNewProfile().then(saveProfile).catch(reject);
                        });
                    } else {
                        resolve(iContinue_profile);
                    }
                }
            });
        });
    }
    return promise;
}
var tabProgress = {};
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.info("got message:" + request.msg + new Date().toLocaleString());
    if (request.msg === "tabgroups") {
        getProfile().then(profile => {
            if (!!profile && !!profile.identityCode) {
                getTabgroupsFromURL(profile.identityCode).then(sendResponse);
            }
        });
        return true;
    } else if (request.msg === "turnToManual") {
        let id = request.id;
        if (!!id) {
            getProfile().then(profile => {
                if (!!profile && !!profile.identityCode) {
                    turnAutoToManual(profile.identityCode, id).then(_ => sendResponse("success"));
                }
            });
        }
        return true;
    } else if (request.msg === "removeTabGroup") {
        let id = request.id;
        if (!!id) {
            getProfile().then(profile => {
                if (!!profile && !!profile.identityCode) {
                    removeTabGroup(profile.identityCode, id).then(_ => sendResponse("success"));
                }
            });
        }
        return true;
    } else if (request.msg === "openTabGroup") {
        var tabgroup = request.tabgroup
        tabgroup.tabs.forEach(t => chrome.tabs.create({
            url: t.link
        }, tab => tabProgress[tab.id] = t.progress));
    } else if (request.msg === "openTab") {
        var t = request.tab
        chrome.tabs.create({
            url: t.link
        }, tab => tabProgress[tab.id] = t.progress)
    } else if (request.msg === "saveCurrent") {
        stopAutoSaving();
        get_tab_reports(10000).then(tabgroup => {
            // save into server
            tabgroup.type = 'MANUAL';
            getProfile().then(profile => {
                if (!!profile && !!profile.identityCode) {
                    postTabGroup(profile.identityCode, tabgroup).then(_ => sendResponse("success")).finally(_ => scheduleNext(profile.autoSaveInterval * 1000));
                }
            });
        }).catch(scheduleNext);
        return true;
    } else if (request.msg === "server") {
        if (!!request.server) {
            SERVER_HOST = request.server;
        }
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    var progress = -1;
    for (const key in tabProgress) {
        if (key == activeInfo.tabId) {
            progress = tabProgress[key];
            delete tabProgress[key];
            break;
        }
    }
    if (progress > 0) {
        chrome.tabs.sendMessage(activeInfo.tabId, { msg: "scroll", progress: progress });
    }
})

chrome.runtime.onInstalled.addListener(function() {
    // execute contentScript.js on every tab
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
            if (!/chrome:\/\//.test(tab.url) &&
                !/chrome-extension:\/\//.test(tab.url)) {
                chrome.tabs.executeScript(tab.id, {
                    file: 'contentScript.js'
                });
            }
        });
    });
    getServerUrl();
    getProfile(true).then(_ => {
        // start save tabs automatically
        startAutoSaving();
    });
});

chrome.runtime.onStartup.addListener(function() {
    // execute contentScript.js on every tab
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
            if (!/chrome:\/\//.test(tab.url) &&
                !/chrome-extension:\/\//.test(tab.url)) {
                chrome.tabs.executeScript(tab.id, {
                    file: 'contentScript.js'
                });
            }
        });
    });
    getServerUrl();
    getProfile(true).then(_ => {
        // start save tabs automatically
        startAutoSaving();
    });
});