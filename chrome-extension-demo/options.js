// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function getJsonFromURL(url) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 2000; // time in milliseconds
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

var msgEle = document.querySelector('#msg');
let server_host_e = document.getElementById('server_host');

function init() {
    let apply_bt = document.getElementById('apply');
    if (!!apply_bt) {
        apply_bt.onclick = _ => {
            msgEle.classList.remove('red');
            msgEle.classList.remove('green');
            msgEle.textContent = '';
            if (!!server_host_e) {
                getJsonFromURL(server_host_e.value + '/public/check').then(resp => {
                    console.info(resp);
                    if (!!resp && resp.app == "iContinue") {
                        chrome.storage.sync.set({
                            'iContinue_server': server_host_e.value
                        });
                        // let save_inter_e = document.getElementById('save_inter');
                        // if (!!save_inter_e) {
                        //     chrome.storage.sync.set({
                        //         'iContinue_save_inter': save_inter_e.value
                        //     });
                        // }
                        chrome.runtime.sendMessage(chrome.runtime.id, { msg: "server", server: server_host_e.value })
                        msgEle.classList.add('green');
                        msgEle.textContent = 'Applied';
                    }
                }).catch(_ => {
                    msgEle.classList.add('red');
                    msgEle.textContent = 'Can not connect to the server!';
                });
            }
        }
    }
    chrome.storage.sync.get('iContinue_server', function(result) {
        var iContinue_server = result.iContinue_server;
        if (!iContinue_server) {
            iContinue_server = "http://122.51.181.208:8080/";
        }
        server_host_e.value = iContinue_server;
    });
}
init();