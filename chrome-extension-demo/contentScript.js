chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.msg == "report") {
        sendResponse({
            link: window.location.href,
            title: getTitle(),
            progress: getScrollPercent()
        });
    } else if (request.msg == "scroll") {

        scrollToProgress(request.progress);
    }
});

function getTitle() {
    var link = window.location.href;
    if (link.startsWith('file:')) {
        var p = link.split('/');
        return decodeURI(p[p.length - 1]);
    }
    return document.title;
}

function getScrollPercent() {
    var link = window.location.href;
    if (link.startsWith('file:')) {
        return 0;
    }
    var body = document.body,
        html = document.documentElement;

    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    if (height <= window.innerHeight) {
        return 100;
    }
    return parseInt(window.scrollY / (height - window.innerHeight) * 100);
}

function scrollToProgress(progress) {
    var body = document.body,
        html = document.documentElement;

    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var y = progress / 100 * (height - window.innerHeight);
    console.info('scroll to ' + y);
    // document.body.scrollTop = y;
    window.scrollTo(0, y);
}