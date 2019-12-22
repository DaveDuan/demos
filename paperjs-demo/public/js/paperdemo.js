(function () {
    var inputBoxWidth = 100, inputBoxHeight = 40, padding = 4, fontSize = 18, minWidth = 20;
    var horiDistance = 100, vertDistance = 20;
    var creating = false, inputting = false, editAbort = false;
    var activeItem;
    var KeyIndex = {
        TEXT_BOX: 0,
        LINE: 1,
        CHILDREN: 2
    };
    var rootGroup;
    var clipboardData;
    // console.info('Start.........');

    function createChild() {
        var item = createItem(activeItem);
        reDraw(rootGroup);
        editItem(item);
    }

    function createSibling() {
        var item;
        if (activeItem != rootGroup) {
            item = createItem(null, activeItem);
        } else {
            item = createItem(rootGroup);
        }
        reDraw(rootGroup);
        editItem(item);
    }

    function createItem(parent, brother, text) {
        creating = true;
        var textBox = createTextBox(parent, view.center.x, view.center.y, !!text ? text : 'input text', fontSize);
        textBox.on('mousedown', textBoxOnClick);
        textBox.on('doubleclick', textBoxOnDoubleClick);
        var item = new Group([textBox, new Group()]);
        if (!!parent) {
            var line = createLine(parent, item);
            item.insertChild(1, line);
            item.data.depth = parent.data.depth + 1;
            item.addTo(parent.lastChild);
        } else if (!!brother) {
            var line = createLine(brother.parent.parent, item);
            item.insertChild(1, line);
            item.data.depth = brother.parent.parent.data.depth + 1;
            item.insertAbove(brother);
        } else {
            rootGroup = item;
            rootGroup.data.depth = 0;
        }
        return item;
    }

    function textBoxOnClick(event) {
        selectItem(this.parent);
    }

    function textBoxOnDoubleClick(event) {
        editItem(this.parent);
    }

    function editItem(item) {
        var textBox = item.firstChild;
        var bounds = textBox.bounds;
        var textarea = $("<textarea id='input_text' class='dynamic-textarea' " +
            "style='padding:0; margin:0; font-size:" + fontSize + "px; position:absolute; left:" + bounds.x +
            "px; top:" + bounds.y + "px; width: " + inputBoxWidth +
            "px; height: " + inputBoxHeight +
            "px; resize;' placeholder='Enter text'></textarea>");
        if (textBox.lastChild.content != 'input text') {
            textarea.val(textBox.lastChild.content);
        }

        $("#parent-div").append(textarea);
        textBox.visible = false;
        textarea.focus();
        inputting = true;
        editAbort = false;
        textarea.focusout(function () {
            inputting = false;
            textarea.remove();
            if (!editAbort) {
                if (!textarea.val()) {
                    textBox.lastChild.content = 'input text';
                } else {
                    textBox.lastChild.content = textarea.val();
                }
                textBox.visible = true;
                reDraw(rootGroup);
                selectItem(item);
            } else {
                if (creating) {
                    item.remove();
                } else {
                    textBox.visible = true;
                }
                reDraw(rootGroup);
            }
            creating = false;
        });

    }

    function rightJoint(textbox) {
        if (textbox.firstChild.data.name == 'underline') {
            return textbox.bounds.bottomRight;
        } else {
            return textbox.bounds.rightCenter;
        }
    }

    function leftJoint(textbox) {
        if (textbox.firstChild.data.name == 'underline') {
            return textbox.bounds.bottomLeft;
        } else {
            return textbox.bounds.leftCenter;
        }
    }

    function selectItem(item) {
        disselectItem(activeItem);
        activeItem = item;
        activeItem.firstChild.firstChild.strokeWidth = 2;
        activeItem.firstChild.firstChild.shadowColor = new Color(0, 0, 0);
        activeItem.firstChild.firstChild.shadowBlur = 12;
        activeItem.firstChild.firstChild.shadowOffset = new Point(5, 5);
        scrollToItem(item.firstChild);
    }

    function disselectItem(activeItem) {
        if (!!activeItem) {
            activeItem.firstChild.firstChild.strokeWidth = 1;
            activeItem.firstChild.firstChild.shadowBlur = 0;
            activeItem.firstChild.firstChild.shadowOffset = 0;
        }
    }

    function findPreviousSiblingForUpdowning(item) {
        var previousSibling = findPreviousSibling(item);
        if (previousSibling != null) {
            var tem = previousSibling;
            for (var i = previousSibling.data.depth; i < updowningBeginDepth; i++) {
                if (tem.lastChild.hasChildren()) {
                    tem = tem.lastChild.lastChild;
                } else {
                    return tem;
                }
            }
            return tem;
        }
        return null;
    }
    function findPreviousSibling(item) {
        if (item == rootGroup) {
            return null;
        }
        if (!!item.previousSibling) {
            return item.previousSibling;
        } else {
            return findPreviousSibling(item.parent.parent);
        }
    }

    function findNextSiblingForUpdowning(item) {
        var nextSibling = findNextSibling(item);
        if (nextSibling != null) {
            var tem = nextSibling;
            for (var i = nextSibling.data.depth; i < updowningBeginDepth; i++) {
                if (tem.lastChild.hasChildren()) {
                    tem = tem.lastChild.firstChild;
                } else {
                    return tem;
                }
            }
            return tem;
        }
        return null;
    }

    function findNextSibling(item) {
        if (item == rootGroup) {
            return null;
        }
        if (!!item.nextSibling) {
            return item.nextSibling;
        } else {
            return findNextSibling(item.parent.parent);
        }
    }

    function createTextBox(parentItem, x, y, text, fontSize) {
        //create pointText
        var pointText = new PointText({
            point: [x + padding, y + fontSize + padding],
            content: text,
            fillColor: 'black',
            fontSize: fontSize
        });
        var around;
        if (!!parentItem && parentItem.data.depth + 1 > 1) {
            around = createUnderline(pointText);
        } else {
            around = createBorderRect(pointText);
        }
        return new Group([around, pointText]);;
    }

    function removeActiveItem() {
        removeItem(activeItem);
    }

    function removeItem(item) {
        if (item != rootGroup) {
            var tem = item.parent.parent;
            item.remove();
            selectItem(tem);
        } else {
            if (!!item) {
                item.remove();
            }
            activeItem = null;
            rootGroup = null;
        }
    }

    function createBorderRect(pointText) {
        var left = pointText.bounds.x - padding;
        var top = pointText.bounds.y - padding;
        var topLeftBorderRectPosition = new Point(left, top);
        var borderRect = new Path.Rectangle(topLeftBorderRectPosition, calBorderSize(pointText));
        borderRect.strokeColor = 'black';
        borderRect.fillColor = 'white';
        borderRect.data.name = 'borderRect';
        return borderRect;
    }

    function createUnderline(pointText) {
        var underLine = new Path();
        underLine.add(pointText.bounds.bottomLeft);
        underLine.add(new Point(pointText.bounds.bottomLeft.x + Math.max(minWidth, pointText.bounds.bottomRight.x - pointText.bounds.bottomLeft.x), pointText.bounds.bottomRight.y));
        underLine.strokeColor = 'black';
        underLine.data.name = 'underline';
        return underLine;
    }

    function calBorderSize(pointText) {
        var width = pointText.bounds.width + 2 * padding;
        return new Size(Math.max(width, minWidth), pointText.bounds.height + 2 * padding);
    }

    function adjustUnderlineWidth(textBox) {
        textBox.firstChild.remove();
        textBox.insertChild(0, createUnderline(textBox.lastChild));
    }

    function adjustBorderSize(textBox) {
        textBox.firstChild.remove();
        textBox.insertChild(0, createBorderRect(textBox.lastChild));
    }

    function reDrawItem(item) {
        if (item.data.depth > 1) {
            adjustUnderlineWidth(item.firstChild);
        } else {
            adjustBorderSize(item.firstChild);
        }
        if (item == activeItem) {
            selectItem(item);
        }
    }

    function createLine(fromGroup, toGroup) {
        if (!fromGroup || !toGroup || toGroup == rootGroup) {
            return;
        }
        var rj = rightJoint(fromGroup.firstChild);
        var lj = leftJoint(toGroup.firstChild);
        var path = new Path();
        path.strokeColor = new Color('rgb(55, 182, 189)');
        path.add(rj);
        // path.add(new Point(rj.x + 4, rj.y));
        // path.add(new Point(lj.x - 10, lj.y));
        path.add(lj);
        // path.smooth({ type: 'geometric' });
        return path;
    }

    function resizeCanvas() {
        view.viewSize = new Size(rootGroup.bounds.width + 100, rootGroup.bounds.height + 100);
        view.draw();
    }

    function centerItemInCanvas(item) {
        item.bounds.x = view.center.x - item.bounds.width / 2;
        item.bounds.y = view.center.y - item.bounds.height / 2;
    }

    function reDraw(element) {
        if (!element) {
            return;
        }
        reDrawItem(element);
        if (!!element.lastChild.hasChildren()) {
            for (var i = 0; i < element.lastChild.children.length; i++) {
                var child = element.lastChild.children[i];
                child.children[KeyIndex.LINE].remove();
            }


            var childX = element.firstChild.bounds.x + element.firstChild.bounds.width + horiDistance;
            for (var i = 0; i < element.lastChild.children.length; i++) {
                var child = element.lastChild.children[i];
                reDraw(child);
                child.bounds.y = i == 0 ? element.bounds.y : element.lastChild.children[i - 1].bounds.y + element.lastChild.children[i - 1].bounds.height + vertDistance;
                child.bounds.x = childX;
            }

            //父节点在孙\子节点块的中间
            //element.firstChild.bounds.y = element.lastChild.bounds.y + element.lastChild.bounds.height/2 - element.firstChild.bounds.height/2;
            //父节点在子节点块的中间
            element.firstChild.bounds.y = (element.lastChild.firstChild.firstChild.bounds.y + element.lastChild.lastChild.firstChild.bounds.y + element.lastChild.lastChild.firstChild.bounds.height) / 2 - element.firstChild.bounds.height / 2;

            for (var i = 0; i < element.lastChild.children.length; i++) {
                var child = element.lastChild.children[i];
                //child.children[1].remove();
                child.insertChild(1, createLine(element, child));
            }
        }

        if (element == rootGroup) {
            resizeCanvas();
            centerItemInCanvas(rootGroup);
        }
    }

    function moveUp(item) {
        if (item == rootGroup) {
            return;
        }
        if (!!item.previousSibling) {
            var tem = item.previousSibling;
            item.previousSibling.remove();
            tem.insertAbove(item);
            reDraw(rootGroup);
        }
    }

    function moveDown(item) {
        if (item == rootGroup) {
            return;
        }
        if (!!item.nextSibling) {
            var tem = item.nextSibling;
            item.nextSibling.remove();
            tem.insertBelow(item);
            reDraw(rootGroup);
        }
    }

    function exportCanvasAsPNG(id, fileName) {

        var canvasElement = document.getElementById(id);
        var MIME_TYPE = "image/png";

        var imgURL = canvasElement.toDataURL(MIME_TYPE);

        var dlLink = document.createElement('a');
        dlLink.download = fileName;
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
    }

    function downloadObjectAsJson(exportObj, exportName) {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function copyAsJSONData() {
        var data = exportItemData(activeItem);
        clipboardData = JSON.stringify(data);
    }

    function cutAsJSONData() {
        var data = exportItemData(activeItem);
        removeActiveItem();
        clipboardData = JSON.stringify(data);
    }

    function exportItemData(item) {
        if (!item) {
            return {};
        }
        var data = {};
        data.text = item.firstChild.lastChild.content;
        data.children = [];
        if (!item.lastChild.hasChildren) {
            return data;
        }
        for (var i = 0; i < item.lastChild.children.length; i++) {
            data.children.push(exportItemData(item.lastChild.children[i]));
        }
        return data;
    }

    function pasteJSONDate() {
        if (!!clipboardData) {
            importJSONData(clipboardData);
        }
    }

    function importJSONData(json) {
        if (!json) {
            return;
        }
        var data = JSON.parse(json);

        var item = importItemData(data, activeItem);
        if (!rootGroup) {
            rootGroup = item;
        }
        reDraw(rootGroup);
        selectItem(item);
    }

    function importItemData(itemData, parentItem) {
        if (!itemData) {
            return {};
        }
        var item = createItem(parentItem, null, itemData.text);
        for (var i = 0; i < itemData.children.length; i++) {
            importItemData(itemData.children[i], item);
        }
        return item;
    }

    function copyStr(value) {
        var textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        var succeed = document.execCommand("Copy");
        textArea.remove();
        return succeed;
    }

    function centerActiveItem() {
        var position = activeItem.firstChild.bounds;
        var center = new Point(position.x + position.width / 2, + position.y + position.height / 2);
        $('#chart_wrapper').scrollTop(center.y - $('#chart_wrapper').height() / 2);
        $('#chart_wrapper').scrollLeft(center.x - $('#chart_wrapper').width() / 2);
    }

    function scrollToItem(item) {
        if (item.bounds.y <= $('#chart_wrapper').scrollTop()) {
            $('#chart_wrapper').scrollTop(item.bounds.y - 16);
        }
        if (item.bounds.y + item.bounds.height >= $('#chart_wrapper').scrollTop() + $('#chart_wrapper').height()) {
            $('#chart_wrapper').scrollTop(item.bounds.y + item.bounds.height + 16 - $('#chart_wrapper').height());
        }
        if (item.bounds.x <= $('#chart_wrapper').scrollLeft()) {
            $('#chart_wrapper').scrollLeft(item.bounds.x - 16);
        }
        if (item.bounds.x + item.bounds.width >= $('#chart_wrapper').scrollLeft() + $('#chart_wrapper').width()) {
            $('#chart_wrapper').scrollLeft(item.bounds.x + item.bounds.width + 16 - $('#chart_wrapper').width());
        }
    }

    function onChange(event) {
        if (event.target.files.length <= 0) {
            return;
        }
        var reader = new FileReader();
        reader.onload = onReaderLoad;
        reader.readAsText(event.target.files[0]);
        $('#file').val('');
    }
    function onReaderLoad(event) {
        importJSONData(event.target.result);
    }

    document.getElementById('file').addEventListener('change', onChange);

    tool.onMouseDown = function (event) {
        $('#input_text').focusout();
    };
    tool.onMouseUp = function (event) {
    };

    var shiftHolding = false, controlHolding = false;
    tool.onKeyUp = function (event) {
        switch (event.key) {
            case 'shift':
                shiftHolding = false;
                break;
            case 'control':
                controlHolding = false;
                break;
            default:
                break;
        };
    };

    var updowning = false;
    var updowningBeginDepth = 0;
    tool.onKeyDown = function (event) {
        // console.info(event);
        if (inputting && event.key == 'escape') {
            editAbort = true;
            $('#input_text').focusout();
            return false;
        }
        if (inputting && event.key == 'enter') {
            $('#input_text').focusout();
            return false;
        }
        if (inputting) {
            return true;
        }
        if (event.key != 'up' && event.key != 'down') {
            updowning = false;
            updowningBeginDepth = 0;
        }
        switch (event.key) {
            case 'left':
                if (activeItem != rootGroup) {
                    selectItem(activeItem.parent.parent);
                }
                break;
            case 'right':
                if (!!activeItem.lastChild.firstChild) {
                    selectItem(activeItem.lastChild.firstChild);
                }
                break;
            case 'up':
                if (shiftHolding) {
                    moveUp(activeItem);
                } else {
                    if (!updowning) {
                        updowning = true;
                        updowningBeginDepth = activeItem.data.depth;
                    }
                    var previousSibling = findPreviousSiblingForUpdowning(activeItem);
                    if (!!previousSibling) {
                        selectItem(previousSibling);
                    }
                }
                break;
            case 'down':
                if (shiftHolding) {
                    moveDown(activeItem);
                } else {
                    if (!updowning) {
                        updowning = true;
                        updowningBeginDepth = activeItem.data.depth;
                    }
                    var nextSibling = findNextSiblingForUpdowning(activeItem);
                    if (!!nextSibling) {
                        selectItem(nextSibling);
                    }
                }
                break;
            case 'delete':
            case 'backspace':
                if (inputting) {
                    return true;
                }
                removeActiveItem();
                reDraw(rootGroup);
                break;
            case 'enter':
                if (shiftHolding) {
                    createChild();
                } else {
                    createSibling();
                }
                break;
            case 'f':
                reDraw(rootGroup);
                break;
            case 'c':
                if (controlHolding) {
                    copyAsJSONData();
                } else {
                    if (inputting) {
                        return true;
                    } else {
                        centerActiveItem();
                    }
                }
                break;
            case 'x':
                if (controlHolding) {
                    if (inputting) {
                        return true;
                    } else {
                        cutAsJSONData();
                    }
                }
                break;
            case 'v':
                if (controlHolding) {
                    if (inputting) {
                        return true;
                    } else {
                        pasteJSONDate();
                    }
                }
                break;
            case 'e':
                exportCanvasAsPNG('paperjsdemocanvas', 'davesmemo-mindmap.png');
                break;
            case 'i':
                $('#file').click();
                break;
            case 'j':
                var data = exportItemData(rootGroup);
                downloadObjectAsJson(data, 'davesmemo-mindmap');
                break;
            case 'shift':
                shiftHolding = true;
                break;
            case 'control':
                controlHolding = true;
                break;
            case 'space':
                editItem(activeItem);
                break;
            default:
                return true;
        }
        return false;
    };
})();
