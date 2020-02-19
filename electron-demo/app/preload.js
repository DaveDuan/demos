// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

window.addEventListener('DOMContentLoaded', () => {
    StorageService.setDefaultConf()
    RenderService.render_side_nav()
    RenderService.render_add_page()
    RenderService.render_setting_page()
})

var StorageService = (function() {
    const Store = require('electron-store')

    const store = new Store()
        // store.set('servers', [])

    function getServers() {
        return store.get('servers')
    }

    function getServer(serverId) {
        var servers = store.get('servers')
        return servers.find(server => server.id == serverId)
    }

    function addServer(server) {
        if (!server.id) {
            server.id = server.host + server.port + server.username
        }
        server.globalEnv = getConf().env
        var servers = store.get('servers')
        if (!servers) {
            servers = []
        }
        servers.push(server)
        store.set('servers', servers)
        return server
    }

    function saveServer(server) {
        var servers = store.get('servers')
        var index = servers.findIndex(el => el.id == server.id)
        servers[index] = server
        store.set('servers', servers)
    }

    function deleteServer(serverId) {
        var servers = store.get('servers')
        for (let index = 0; index < servers.length; index++) {
            const element = servers[index];
            if (element.id == serverId) {
                servers.splice(index, 1)
                break
            }
        }
        store.set('servers', servers)
    }

    function setDefaultConf() {
        var globalConf = store.get('globalConf')
        if (!globalConf) {
            store.set('globalConf', {
                env: [{
                        id: 'OS',
                        key: 'OS version',
                        command: 'cat /etc/os-release | grep -Po \'PRETTY_NAME="\\K.*?(?=")\''
                    },
                    {
                        id: 'tz',
                        key: 'Timezone',
                        command: 'timedatectl | grep -Po \'(?<=Time zone: ).*\''
                    },
                    {
                        id: 'path',
                        key: 'Path',
                        command: 'echo $PATH'
                    },
                    {
                        id: 'pythonversion',
                        key: 'Python version',
                        command: 'python -V'
                    },
                    {
                        id: 'nodejsversion',
                        key: 'Node js version',
                        command: 'node -v'
                    }

                ]
            })
        }
    }

    function getConf() {
        return store.get('globalConf')
    }

    function saveGlobalEnvs(envs) {
        store.set('globalConf.env', envs)
    }

    function addGlobalEnv(env) {
        store.set('globalConf.env', store.get('globalConf.env').push(env))
    }

    function removeGlobalEnv(envId) {
        var envs = store.get('globalConf.env')
        for (let index = 0; index < envs.length; index++) {
            const env = envs[index];
            if (env.id == envId) {
                envs.splice(index, 1)
            }
        }
        store.set('globalConf.env', envs)
    }

    function syncGlobalToServer(server) {
        var genvs = store.get('globalConf.env')
        var senvs = server.globalEnv
        server.globalEnv = genvs
        if (!!senvs) {
            for (let index = 0; index < server.globalEnv.length; index++) {
                const genv = server.globalEnv[index];
                var senv = senvs.find(env => env.id == genv.id)
                if (!!senv) {
                    genv.result = senv.result
                }
            }
        }

        saveServer(server)
        return server
    }

    function saveServerEnv(server, env) {
        var servers = store.get('servers')
        var server = servers.find(el => el.id == server.id)
        console.info(server.id)
        var index = server.globalEnv.findIndex(el => el.id == env.id)
        server.globalEnv[index] = env
        store.set('servers', servers)
    }

    return {
        getServer: getServer,
        getServers: getServers,
        addServer: addServer,
        saveServer: saveServer,
        deleteServer: deleteServer,
        setDefaultConf: setDefaultConf,
        getConf: getConf,
        saveGlobalEnvs: saveGlobalEnvs,
        addGlobalEnv: addGlobalEnv,
        removeGlobalEnv: removeGlobalEnv,
        syncGlobalToServer: syncGlobalToServer,
        saveServerEnv: saveServerEnv
    };
}());

var SSHService = (function() {
    // var node_ssh = require('node-ssh')
    var _connections = []

    function testConnection(server) {
        if (!UtilService.validateIPaddress(server.host)) {
            Promise.reject('Bad host')
        }
        if (!UtilService.validatePort(server.port)) {
            Promise.reject('Bad port')
        }

        return new Promise((resolve, reject) => {
            var Client = require('ssh2').Client;

            var conn = new Client();
            conn.on('ready', function() {
                console.log('connected');
                _connections.push({
                    server: server,
                    ssh: conn
                })
                resolve(conn)

            }).on('error', function(error) {
                console.log('connection error');
                reject(error)
            }).on('end', function() {
                console.log('disconnected');
                var index = _connections.findIndex(con => con.server.host == server.host && con.server.username == server.username)
                _connections.splice(index, 1)
                if (!!server.id) {
                    RenderService.render_server_page_datails(server.id)
                }
                reject('disconnected')
            }).connect({
                host: server.host,
                port: parseInt(server.port),
                username: server.username,
                password: server.password
            })
        })

        // console.info('---=-===---')
        // var ssh = new node_ssh()
        // return ssh.connect({
        //     host: server.host,
        //     port: parseInt(server.port),
        //     username: server.username,
        //     password: server.password,
        //     tryKeyboard: true,
        //     onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
        //         if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
        //             finish([server.password])
        //         }
        //     }
        // }).then(() => {
        //     _connections.push({
        //         server: server,
        //         ssh: ssh
        //     })
        //     return ssh
        // })
    }

    function _findConnection(server) {
        return _connections.find(con => con.server.host == server.host && con.server.username == server.username)
    }

    function isServerConnected(server) {
        return !!_findConnection(server)
    }

    function ensureConnection(server) {
        var connection = _findConnection(server)
        if (!connection) {
            return testConnection(server)
        }
        return Promise.resolve(connection.ssh)
    }

    function runCommand(server, commandId, onData) {
        return ensureConnection(server).then(conn => {

            return new Promise((resolve, reject) => {
                var env = server.globalEnv.find(e => e.id == commandId)
                console.info(env.command)
                conn.exec(env.command, function(err, stream) {
                    if (err) reject(err);
                    var result = ''
                    var stdout = ''
                    var stderr = ''
                    stream.on('close', function(code, signal) {
                        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                        resolve({
                            stdout: stdout,
                            stderr: stderr,
                            result: result
                        })
                    }).on('data', function(data) {
                        console.info('stream on data')
                        stdout += data
                        result += data
                        if (!!onData) onData(data)
                    }).stderr.on('data', function(data) {
                        console.info('stderr on data')
                        stderr += data
                        result += data
                        if (!!onData) onData(data)
                    });
                });
            })

            // var env = server.globalEnv.find(e => e.id == commandId)
            // return ssh.execCommand(env.command).then(function(result) {
            //     console.info(result)
            //     env.result = result.stdout || result.stderr
            //     StorageService.saveServer(server)
            //     return {
            //         server: server,
            //         env: env,
            //         result: result
            //     }
            // })
        })
    }

    function disconnect(server) {
        var index = _connections.findIndex(con => con.server.host == server.host && con.server.username == server.username)
            // _connections[index].ssh.dispose()
        _connections[index].ssh.end()
            // _connections.splice(index, 1)
    }

    return {
        isServerConnected: isServerConnected,
        testConnection: testConnection,
        runCommand: runCommand,
        disconnect: disconnect
    }
}())

var RenderService = (function() {

    function render(servers) {

    }

    function nav_page(pageName, serverId) {
        var exist = false
        const pages = document.querySelectorAll('.page')
        for (let index = 0; index < pages.length; index++) {
            const page = pages[index];
            if (page.dataset.pageName == pageName) {
                if (pageName == 'server') {
                    if (page.dataset.serverId == serverId) {
                        exist = true
                        UtilService.removeClass(page, 'hide')
                        render_server_page_datails(serverId)
                    } else {
                        UtilService.addClass(page, 'hide')
                    }
                } else {
                    exist = true
                    UtilService.removeClass(page, 'hide')
                }
            } else {
                UtilService.addClass(page, 'hide')
            }
        }
        if (pageName == 'server' && !exist) {
            const server_details_page_tem = document.querySelector('#server_details_page')
            var server_details_page = server_details_page_tem.cloneNode(true)
            server_details_page.id = ''
            server_details_page.dataset.serverId = serverId
            server_details_page_tem.parentNode.append(server_details_page)
            UtilService.removeClass(server_details_page, 'hide')
            render_server_page_datails(serverId)
        }
    }

    function render_server_page_datails(serverId) {
        var server = StorageService.getServer(serverId)
        server = StorageService.syncGlobalToServer(server)
        console.info(server)
        const server_details_page_ele = document.querySelector('.server-page[data-server-id="' + serverId + '"]')
        var name = server_details_page_ele.querySelector('.name_label')
        name.textContent = server.name
        var connect_button = server_details_page_ele.querySelector('.connect-button')
        var connect_progress = server_details_page_ele.querySelector('#connecting_progress')
        var connect_status = server_details_page_ele.querySelector('#connection_status')
        if (SSHService.isServerConnected(server)) {
            connect_button.textContent = 'Disconnect'
            connect_status.textContent = 'Connected'
            UtilService.removeClass(connect_status, 'red-text')
            UtilService.addClass(connect_status, 'teal-text')
        } else {
            connect_button.textContent = 'Connect'
            connect_status.textContent = 'Disconnected'
            UtilService.removeClass(connect_status, 'teal-text')
            UtilService.addClass(connect_status, 'red-text')
        }

        function connected() {
            UtilService.addClass(connect_progress, 'hide')
            connect_button.textContent = 'Disconnect'
            connect_status.textContent = 'Connected'
            UtilService.removeClass(connect_status, 'red-text')
            UtilService.addClass(connect_status, 'teal-text')
        }
        connect_button.onclick = () => {
            if (SSHService.isServerConnected(server)) {
                SSHService.disconnect(server)
                connect_button.textContent = 'Connect'
                connect_status.textContent = 'Disconnected'
                UtilService.addClass(connect_status, 'red-text')
                UtilService.removeClass(connect_status, 'teal-text')
            } else {
                UtilService.removeClass(connect_progress, 'hide')
                SSHService.testConnection(server).then(() => {
                    connected()
                }).catch((err) => {
                    connect_status.textContent = err
                    UtilService.addClass(connect_status, 'red-text')
                    UtilService.removeClass(connect_status, 'teal-text')
                    UtilService.addClass(connect_progress, 'hide')
                })
            }

        }
        var delete_button = server_details_page_ele.querySelector('.delete-button')
        delete_button.onclick = () => {
                StorageService.deleteServer(server.id)
                render_side_nav()
                nav_page('add')
                server_details_page_ele.remove()
            }
            // Connection info
        var host_e = server_details_page_ele.querySelector('.host')
        host_e.textContent = server.host
        var port_e = server_details_page_ele.querySelector('.port')
        port_e.textContent = server.port
        var username_e = server_details_page_ele.querySelector('.username')
        username_e.textContent = server.username
        var password_e = server_details_page_ele.querySelector('.password')
        password_e.textContent = server.password
            // Environment
        var env_li_tem = server_details_page_ele.querySelector('.env-li')
        UtilService.removeAllChildrenExceptionfirst(env_li_tem.parentElement, 2)
        server.globalEnv.forEach(env => {
            var env_e = env_li_tem.cloneNode(true)
            UtilService.removeClass(env_e, 'hide')
            var env_key = env_e.querySelector('.env-key')
            env_key.textContent = env.key
            env_key.dataset.tooltip = env.command
            var env_result = env_e.querySelector('.env-result')
            env_result.textContent = env.result
            var refresh_button = env_e.querySelector('.refresh')
            var refresh_spinner = env_e.querySelector('.refresh-spinner')
            var error_icon = env_e.querySelector('.error-icon')
            refresh_button.onclick = () => {
                env_result.textContent = ''
                UtilService.removeClass(refresh_spinner, 'hide')
                SSHService.runCommand(server, env.id, (data) => {
                    // console.info(data)
                    UtilService.addClass(error_icon, 'hide')
                    env_result.textContent = env_result.textContent + data
                }).then(resp => {
                    connected()
                    env.result = resp.result
                    StorageService.saveServerEnv(server, env)
                    env_result.textContent = env.result
                    if (!!resp.stderr) {
                        UtilService.removeClass(error_icon, 'hide')
                        error_icon.dataset.tooltip = resp.stderr
                    }
                }).finally(() => {
                    UtilService.addClass(refresh_spinner, 'hide')
                })
            }
            env_li_tem.parentElement.append(env_e)
        });
        var elems = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(elems);
    }

    function render_server_list(servers) {
        var server_list = document.getElementById('server_list')
        var server_lis = document.querySelectorAll('.server-li')
        server_lis.forEach(server_li => {
            server_li.remove()
        })
        var item_tem = document.getElementById('server_list_item_tem')
        for (const i in servers) {
            var server = servers[i]
            var item = item_tem.cloneNode(true)
            item.id = ''
            UtilService.addClass(item, 'server-li')
            var server_name = item.getElementsByClassName('server_name')[0]
            server_name.textContent = server.name || server.host
            server_name.id = server.id
            server_name.onclick = (event) => {
                var target = event.target
                nav_page('server', target.id)
            }
            server_list.append(item)
        }
    }

    function render_side_nav() {
        const add_server_button = document.getElementById('add_button')
        add_server_button.onclick = () => {
            RenderService.nav_page('add')
        }
        const setting_button = document.getElementById('setting_button')
        setting_button.onclick = () => {
            RenderService.nav_page('setting')
        }
        var servers = StorageService.getServers()
        render_server_list(servers)
    }

    function render_add_page() {
        // add
        const add_name_e = document.getElementById('add_name')
        const add_host_e = document.getElementById('add_host')
        UtilService.validateInputElement(add_host_e, UtilService.validateIPaddress)
        const add_port_e = document.getElementById('add_port')
        UtilService.validateInputElement(add_port_e, UtilService.validatePort)
        const add_username_e = document.getElementById('add_username')
        const add_password_e = document.getElementById('add_password')
        const add_test_success = document.getElementById('add_test_success')
        const add_test_fail = document.getElementById('add_test_fail')

        var toggle_add_test_progress = (display) => {
            const add_test = document.getElementById('add_test_progress')
            if (display == undefined) {
                add_test.classList.toggle('hide');
            } else if (!display) {
                UtilService.addClass(add_test, 'hide')
            } else {
                UtilService.removeClass(add_test, 'hide')
            }
        }

        function reset_message() {
            UtilService.addClass(add_test_success, 'hide')
            UtilService.addClass(add_test_fail, 'hide')
            add_test_fail.textContent = ''
        }

        function get_add_server() {
            if (UtilService.validateIPaddress(add_host_e.value) && UtilService.validatePort(add_port_e.value)) {
                return {
                    name: add_name_e.value,
                    host: add_host_e.value,
                    port: add_port_e.value,
                    username: add_username_e.value,
                    password: add_password_e.value
                }
            } else {
                if (!UtilService.validateIPaddress(add_host_e.value)) {
                    UtilService.removeClass(add_host_e, 'valid')
                    UtilService.addClass(add_host_e, 'invalid')
                }
                if (!UtilService.validatePort(add_port_e.value)) {
                    UtilService.removeClass(add_port_e, 'valid')
                    UtilService.addClass(add_port_e, 'invalid')
                }
                return null
            }
        }

        const add_test = document.getElementById('add_test')
        if (add_test) {
            add_test.onclick = () => {
                reset_message()
                var server = get_add_server()
                if (!!server) {
                    toggle_add_test_progress()
                    UtilService.addClass(add_test, 'disabled')
                    SSHService.testConnection(server).then(() => {
                        UtilService.removeClass(add_test_success, 'hide')
                    }).catch((error) => {
                        add_test_fail.textContent = error
                        UtilService.removeClass(add_test_fail, 'hide')
                    }).finally(() => {
                        toggle_add_test_progress()
                        UtilService.removeClass(add_test, 'disabled')
                    })
                }
            }
        }
        const add_add = document.getElementById('add_add')
        if (add_add) {
            add_add.onclick = () => {
                reset_message()
                var server = get_add_server()
                if (!!server) {
                    server = StorageService.addServer(server)
                    RenderService.render_side_nav()
                    RenderService.nav_page('server', server.id)
                }
            }

        }
    }

    function render_setting_page() {
        var conf = StorageService.getConf()
        var env_col_e = document.querySelector('.env-collection')
        var save_button_e = env_col_e.querySelector('.save-button')
        save_button_e.onclick = () => {
            UtilService.addClass(save_button_e, 'disabled')
            var envs = []
            var envs_e = env_col_e.querySelectorAll('.global-env')
            for (let index = 0; index < envs_e.length; index++) {
                const env_e = envs_e[index];
                var env_key = env_e.querySelector('.env-key')
                var env_value = env_e.querySelector('.env-value')
                envs.push({
                    id: env_key.value.replace(/\s/g, ''),
                    key: env_key.value,
                    command: env_value.value
                })
            }
            env_col_e.querySelector('.save_button')
            StorageService.saveGlobalEnvs(envs)
            UtilService.removeClass(save_button_e, 'disabled')
            M.toast({ html: 'Saved!' })
        }

        var temp_e = env_col_e.querySelector('#add_env_row_tem')
        var add_button = env_col_e.querySelector('.add-button')
        add_button.onclick = () => {
            var env = {
                // id: new Date().getTime(),
                key: '',
                command: ''
            }
            temp_e.parentElement.append(createEnvEle(env))
        }

        function createEnvEle(env) {
            var env_e = temp_e.cloneNode(true)
            env_e.id = ''
            UtilService.addClass(env_e, 'global-env')
            UtilService.removeClass(env_e, 'hide')
            var env_key = env_e.querySelector('.env-key')
            env_key.value = env.key
            var env_value = env_e.querySelector('.env-value')
            env_value.value = env.command

            var remove_button = env_e.querySelector('.remove-button')
            remove_button.onclick = () => {
                // StorageService.removeGlobalEnv(env.id)
                env_e.remove()
            }
            return env_e
        }
        conf.env.forEach(env => temp_e.parentElement.append(createEnvEle(env)));
    }

    return {
        render: render,
        nav_page: nav_page,
        render_server_list: render_server_list,
        render_server_page_datails: render_server_page_datails,
        render_side_nav: render_side_nav,
        render_add_page: render_add_page,
        render_setting_page: render_setting_page
    }
}())

var UtilService = (function() {
    function validateIPaddress(ipaddress) {
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
            return true
        }
        return false
    }

    function validatePort(port) {
        if (/^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/.test(port)) {
            return true
        }
        return false
    }

    function validateInputElement(element, valid) {
        if (element) {
            element.onblur = () => {
                if (valid(element.value)) {
                    removeClass(element, 'invalid')
                    addClass(element, 'valid')
                } else {
                    removeClass(element, 'valid')
                    addClass(element, 'invalid')
                }
            }
        }
    }

    function removeClass(element, clazz) {
        if (element.classList.contains(clazz)) {
            element.classList.remove(clazz);
        }
    }

    function addClass(element, clazz) {
        if (!element.classList.contains(clazz)) {
            element.classList.add(clazz)
        }
    }

    function removeAllChildrenExceptionfirst(element, n) {
        for (let index = 0; index < element.children.length; index++) {
            const e = element.children[index];
            if (n <= 0) {
                e.remove()
                index--
            } else {
                n--
            }
        }
    }

    return {
        validateIPaddress: validateIPaddress,
        validatePort: validatePort,
        validateInputElement: validateInputElement,
        addClass: addClass,
        removeClass: removeClass,
        removeAllChildrenExceptionfirst: removeAllChildrenExceptionfirst
    }
}())