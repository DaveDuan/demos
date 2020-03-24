// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function updateProgressBar() {
    let progressbars = document.querySelectorAll(".progress");

    progressbars.forEach(progressbar => {
        progressbar.classList.add('p' + progressbar.dataset.fill);
        let progress_text = progressbar.querySelector("span");
        progress_text.textContent = progressbar.dataset.fill + '%';
    });
}

function findNearest(expand, selector) {
    var target;
    if (!!expand.parentElement) {
        target = expand.parentElement.querySelector(selector);
    } else {
        return target;
    }

    if (!!target) {
        return target;
    } else {
        return findNearest(expand.parentElement, selector);
    }
}

function removeAllNextSiblings(dd) {
    var ns;
    while (ns = dd.nextSibling)
        dd.parentNode.removeChild(ns);
}

function renderTabGroups(tabsGroups) {
    var auto_temp = document.querySelector('#auto_temp');
    // removeAllNextSiblings(auto_temp);
    var manual_temp = document.querySelector('#manual_temp');
    // removeAllNextSiblings(manual_temp);
    var gen = (temp) => {
        var new_t = temp.cloneNode(true);
        new_t.id = '';
        new_t.classList.remove('hide');
        return new_t;
    };
    var insertTabgroup = (parentEle, ele) => {
        var inserted = false;
        var tabgEles = parentEle.querySelectorAll('.tabgroup');
        for (let index = 0; index < tabgEles.length; index++) {
            const element = tabgEles[index];
            if (parseInt(ele.dataset.id) >= parseInt(element.dataset.id)) {
                console.info('remove:' + ele.dataset.id);
                parentEle.insertBefore(ele, element);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            console.info('remove:' + ele.dataset.id);
            parentEle.append(ele);
        }
    };
    var insertAuto = (ele) => {
        insertTabgroup(auto_temp.parentElement, ele);
    };
    var insertManual = (ele) => {
        insertTabgroup(manual_temp.parentElement, ele);
    };
    var removeElements = (tabgs, type) => {
        for (let index = 0; index < tabgs.length; index++) {
            const element = tabgs[index];
            var tgi = tabsGroups.findIndex(tg => tg.type == type && tg.id == element.dataset.id);
            if (tgi < 0) {
                console.info('remove:' + type + ':' + element.dataset.id);
                element.remove();
            } else {
                tabsGroups.splice(tgi, 1);
            }
        }
    };
    removeElements(auto_temp.parentElement.querySelectorAll('.tabgroup'), 'AUTO');
    removeElements(manual_temp.parentElement.querySelectorAll('.tabgroup'), 'MANUAL');

    tabsGroups.forEach((t, i) => {
        var ele = t.type === 'AUTO' ? gen(auto_temp) : gen(manual_temp);
        ele.dataset.id = t.id;
        ele.classList.add('tabgroup');
        var title = ele.querySelector('.title');
        title.textContent = new Date(t.createDT).toLocaleString();
        var collapse_body = ele.querySelector('.collapse-body');
        collapse_body.classList.add('hide');
        //expand
        let expandBt = ele.querySelector(".collapse-title .expand");
        title.onclick = expandBt.onclick = _ => {
            if (!!collapse_body) {
                if (collapse_body.classList.contains("hide")) {
                    collapse_body.classList.remove('hide');
                } else {
                    collapse_body.classList.add('hide');
                }
            }
        };
        //permanent
        let permanentBt = ele.querySelector(".collapse-title .permanent");
        if (!!permanentBt) {
            permanentBt.onclick = _ => {
                turnToManual(t.id);
            };
        }
        // remove
        let removeBt = ele.querySelector(".collapse-title .remove");
        if (!!removeBt) {
            removeBt.onclick = _ => {
                removeTabGroup(t.id);
            };
        }
        // open
        let openBt = ele.querySelector(".collapse-title .open");
        if (!!openBt) {
            openBt.onclick = _ => {
                openTabgroup(t);
            };
        }
        // tabs
        var tabs_temp = ele.querySelector('.tabs-temp');
        t.tabs.forEach(tab => {
            var new_tab = gen(tabs_temp);
            // link
            var page_link = new_tab.querySelector('.page-link a');
            page_link.textContent = tab.link;
            // page_link.href = tab.url;
            page_link.onclick = _ => openTab(tab);
            // title
            var page_title = new_tab.querySelector('.page-title p');
            page_title.textContent = tab.title;
            page_title.onclick = _ => openTab(tab);
            // progress
            var progress = new_tab.querySelector('.progress');
            progress.dataset.fill = tab.progress;
            // todo copy
            tabs_temp.parentElement.append(new_tab);
        })
        t.type === 'AUTO' ? insertAuto(ele) : insertManual(ele);
    });
    updateProgressBar();
}

function turnToManual(id) {
    toggleLoading(true);
    chrome.runtime.sendMessage(chrome.runtime.id, { msg: "turnToManual", id: id }, response => {
        if (response === "success") {
            toggleLoading(false);
            refresh();
        }
    })
}

function removeTabGroup(id) {
    toggleLoading(true);
    chrome.runtime.sendMessage(chrome.runtime.id, { msg: "removeTabGroup", id: id }, response => {
        if (response === "success") {
            toggleLoading(false);
            refresh();
        }
    })
}

function openTabgroup(tabgroup) {
    if (!!tabgroup && !!tabgroup.tabs) {
        chrome.runtime.sendMessage(chrome.runtime.id, { msg: "openTabGroup", tabgroup: tabgroup });
    }
}

function openTab(tab) {
    if (!!tab) {
        chrome.runtime.sendMessage(chrome.runtime.id, { msg: "openTab", tab: tab });
    }
}

// StorageService.getTabs().then(renderAutos);
// StorageService.getTabs().then(console.info);
var groups = [];
init();


function init() {
    setInterval(refresh, 5000);
    refresh();
    addSaveCurrentTabsBtEvent();
}

function refresh() {
    groups = [];
    toggleLoading(true);
    chrome.runtime.sendMessage(chrome.runtime.id, { msg: "tabgroups" }, response => {
        // console.info(response);
        // var autoGs = [];
        // var manualGs = [];
        if (!!response && !!response.length > 0) {
            groups = response;
            // autoGs = response.filter(g => g.type === "AUTO");
            // manualGs = response.filter(g => g.type === "MANUAL");
        }
        toggleLoading(false);
        renderTabGroups(groups);
    })
}

function addSaveCurrentTabsBtEvent() {
    var saveBt = document.querySelector('#save_current_tabs');
    if (!!saveBt) {
        toggleLoading(true);
        saveBt.onclick = _ => chrome.runtime.sendMessage(chrome.runtime.id, { msg: "saveCurrent" }, response => {
            if (response === "success") {
                toggleLoading(false);
                refresh();
            }
        });
    }
}

function toggleLoading(isShow) {
    var loadingEle = document.querySelector('#loading_bar');
    if (!!loadingEle) {
        if (isShow != undefined) {
            if (isShow) {
                loadingEle.classList.add('bar');
            } else {
                loadingEle.classList.remove('bar');
            }
        } else {
            if (loadingEle.classList.contains('bar')) {
                loadingEle.classList.remove('bar');
            } else {
                loadingEle.classList.add('bar');
            }
        }
    }
}