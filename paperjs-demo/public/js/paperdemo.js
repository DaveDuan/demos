paperjsDemo = function () {
    var inputBoxWidth = 100, inputBoxHeight = 40, padding = 4, fontSize = 16, minWidth = 20, CollapseReduis = 5;
    var horiDistance = 100, vertDistance = 16;
    var lineColor = new Color('rgb(55, 182, 189)');
    var creating = false, inputting = false, editAbort = false, squLine=true;
    var activeItem, showingActions;
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

    function createItem(parent, brother, text, link) {
        var textBox = createTextBox(parent, view.center.x, view.center.y, !!text ? text : 'input text', fontSize);
        if(!!parent && !parent.children['collapse']) {
            var center = parent.children['textBox'].bounds.rightCenter + [CollapseReduis, 0];
            new Collapse(center, CollapseReduis).addTo(parent);
        }
        var subNodes = new Group();
        subNodes.name = 'subNodes';
        var item = new Group([textBox, subNodes]);
        if (!!parent) {
            var line = createLine(parent, item);
            item.addChild(line);
            item.data.depth = parent.data.depth + 1;
            item.addTo(parent.children['subNodes']);
        } else if (!!brother) {
            var line = createLine(brother.parent.parent, item);
            item.addChild(line);
            item.data.depth = brother.parent.parent.data.depth + 1;
            item.insertAbove(brother);
        } else {
            rootGroup = item;
            rootGroup.data.depth = 0;
        }
        if (!!link) {
            new Actions(link).toggleVisible(true).addTo(item);
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
        var textBox = item.children['textBox'];
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
                    var parent = item.parent.parent;
                    item.remove();
                    if (!parent.children['subNodes'].hasChildren()) {
                        parent.children['collapse'].remove();
                    }
                } else {
                    textBox.visible = true;
                }
                reDraw(rootGroup);
            }
            creating = false;
        });

    }

    function editLink(item) {
        var textBox = item.children['textBox'];
        var bounds = textBox.bounds;
        var textarea = $("<textarea id='input_text' class='dynamic-textarea' " +
            "style='padding:0; margin:0; font-size:" + fontSize + "px; position:absolute; left:" + bounds.x +
            "px; top:" + bounds.y + "px; width: " + inputBoxWidth +
            "px; height: " + inputBoxHeight +
            "px; resize;' placeholder='https://'></textarea>");
        var actions = item.children['actions'];
        var link;
        if (!!actions) {
            link = item.children['actions'].children['linkAction'];
        }
        if (!!link && !!link.data && !!link.data.link) {
            textarea.val(link.data.link);
        }
        $("#parent-div").append(textarea);
        textarea.focus();
        inputting = true;
        editAbort = false;
        textarea.focusout(function () {
            inputting = false;
            textarea.remove();
            var linkVal = textarea.val();
            // if (!linkVal.startsWith('http')) {
            //     linkVal = 'http://' + linkVal;
            // }
            if (!editAbort) {
                if (!!link && !!link.data && !!link.data.link) {
                    link.data.link = linkVal;
                } else {
                    // var point = [ textBox.bounds.right + 4, textBox.bounds.y];
                    new Actions(linkVal).toggleVisible(true).addTo(item);
                }
            }
        });
    }

    function rightJoint(item) {
        return item.children['collapse'].bounds.center;
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
        activeItem.children['textBox'].firstChild.strokeWidth = 2;
        activeItem.children['textBox'].firstChild.shadowColor = new Color(0, 0, 0);
        activeItem.children['textBox'].firstChild.shadowBlur = 12;
        activeItem.children['textBox'].firstChild.shadowOffset = new Point(5, 5);
        scrollToItem(item.children['textBox']);
    }

    function disselectItem(activeItem) {
        if (!!activeItem) {
            activeItem.children['textBox'].firstChild.strokeWidth = 1;
            activeItem.children['textBox'].firstChild.shadowBlur = 0;
            activeItem.children['textBox'].firstChild.shadowOffset = 0;
        }
    }

    function findPreviousSiblingForUpdowning(item) {
        var previousSibling = findPreviousSibling(item);
        if (previousSibling != null) {
            var tem = previousSibling;
            for (var i = previousSibling.data.depth; i < updowningBeginDepth; i++) {
                if (tem.children['subNodes'].hasChildren() && tem.children['subNodes'].visible) {
                    tem = tem.children['subNodes'].lastChild;
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
                if (tem.children['subNodes'].hasChildren() && tem.children['subNodes'].visible) {
                    tem = tem.children['subNodes'].firstChild;
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
        var textBox = new Group([around, pointText]);
        textBox.name='textBox';
        textBox.on('mousedown', textBoxOnClick);
        textBox.on('doubleclick', textBoxOnDoubleClick);
        textBox.onMouseEnter = function() {
            var actions = this.parent.children['actions'];
            if (!actions) {
                return;
            }
            actions.visible = true;
            if (!!showingActions && showingActions != actions) {
                showingActions.visible = false;
            }
            showingActions = actions;
        };
        return textBox;
    }

    function Collapse(center, reduis) {
        var collapse = new Path.Circle({
            center: center,
            radius: reduis,
            fillColor: lineColor
        });
        collapse.name = 'collapse';
        var center = new Path.Circle({
            center: center,
            radius: reduis - 2,
            fillColor: 'white'
        });
        center.name = 'center';
        this.collapseG = new Group([collapse,center]);
        this.collapseG.name='collapse';
        this.collapseG.obj=this;
        this.collapseG.onClick = this.toggle;
    }

    Collapse.prototype.toggle = function() {
        if (this.parent.children['subNodes'].visible) {
            this.children['center'].fillColor = lineColor;
        } else {
            this.children['center'].fillColor = 'white';
        }
        selectItem(this.parent);
        this.parent.children['subNodes'].visible = !this.parent.children['subNodes'].visible;
        reDraw(rootGroup);
        centerActiveItem();
    }

    Collapse.prototype.getCollapse = function() {
        return this.collapseG;
    }

    Collapse.prototype.addTo = function(parent) {
        parent.addChild(this.collapseG);
    }

    function Actions(link) {
        var topLeft = new Point(0 , 0);
        var toolRect = new Path.Rectangle(topLeft, new Size(16, 16));
        toolRect.fillColor = 'grey';
        toolRect.fillColor.alpha = 0.2;
        toolRect.name='backbroundRect';
        var redirectLine = new Path();
        redirectLine.strokeColor = lineColor;
        redirectLine.strokeWidth = 2;
        redirectLine.add(topLeft + [4, 12]);
        redirectLine.add(topLeft + [12, 4]);
        redirectLine.add(topLeft + [6, 4]);
        redirectLine.add(topLeft + [12, 4]);
        redirectLine.add(topLeft + [12, 10]);

        var linkAction = new Group([toolRect, redirectLine]);
        linkAction.name='linkAction';
        linkAction.data.link = link;
        
        linkAction.onClick = function() {
            window.open(this.data.link, '_blank');
        };

        linkAction.onMouseEnter = function() {
            this.children['backbroundRect'].shadowColor = new Color(0, 0, 0);
            this.children['backbroundRect'].shadowBlur = 3;
        };

        linkAction.onMouseLeave = function() {
            this.children['backbroundRect'].shadowBlur = 0;
        };

        this.actionsG = new Group([linkAction]);
        this.actionsG.name='actions';
        this.actionsG.obj=this;
    }

    Actions.prototype.getActionsG = function() {
        return this.actionsG;
    }

    Actions.prototype.addTo = function(parent) {
        parent.addChild(this.actionsG);
        var textBox = parent.children['textBox'];
        this.actionsG.bounds.x = textBox.bounds.right + 4;
        this.actionsG.bounds.y = textBox.bounds.y;
    }

    Actions.prototype.toggleVisible = function(visible) {
        if (visible != undefined) {
            this.actionsG.visible = !!visible;
        } else {
            this.actionsG.visible = !this.actionsG.visible;
        }
        return this;
    }

    function removeActiveItem() {
        removeItem(activeItem);
    }

    function removeItem(item) {
        if (item != rootGroup) {
            var parent = item.parent.parent;
            item.remove();
            if (!parent.children['subNodes'].hasChildren()) {
                parent.children['collapse'].remove();
            }
            selectItem(parent);
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
            adjustUnderlineWidth(item.children['textBox']);
        } else {
            adjustBorderSize(item.children['textBox']);
        }
        if (item == activeItem) {
            selectItem(item);
        }
    }

    function createLine(fromGroup, toGroup) {
        if (!fromGroup || !toGroup || toGroup == rootGroup) {
            return;
        }
        var rj = rightJoint(fromGroup);
        var lj = leftJoint(toGroup.children['textBox']);
        var path = new Path();
        path.strokeColor = lineColor;
        path.add(rj);
        if(squLine) {
            path.add(new Point((lj.x+rj.x)/2, rj.y));
            path.add(new Point((lj.x+rj.x)/2, lj.y));
        }
        path.add(lj);
        // path.smooth({ type: 'geometric' });
        path.name='line';
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
        if (!!element.children['subNodes'].hasChildren() && element.children['subNodes'].visible) {
            for (var i = 0, l = element.children['subNodes'].children.length; i < l; i++) {
                var child = element.children['subNodes'].children[i];
                child.children['line'].remove();
            }

            var childX = element.children['textBox'].bounds.x + element.children['textBox'].bounds.width + horiDistance;
            for (var i = 0, l = element.children['subNodes'].children.length; i < l; i++) {
                var child = element.children['subNodes'].children[i];
                reDraw(child);
                child.bounds.y = i == 0 ? element.bounds.y : element.children['subNodes'].children[i - 1].bounds.y + element.children['subNodes'].children[i - 1].bounds.height + vertDistance;
                child.bounds.x = childX;
            }

            // textbox vertical center
            if (!!element.children['textBox']) {
                element.children['textBox'].bounds.y = (element.children['subNodes'].firstChild.children['textBox'].bounds.y + element.children['subNodes'].lastChild.children['textBox'].bounds.y + element.children['subNodes'].lastChild.children['textBox'].bounds.height) / 2 - element.children['textBox'].bounds.height / 2;
            }
            if(!!element.children['collapse']) {
                if (element.children['textBox'].firstChild.data.name == 'underline') {
                    element.children['collapse'].position = element.children['textBox'].firstChild.bounds.rightCenter + [CollapseReduis, 0];
                } else {
                    // var path = Path.Rectangle(element.children['textBox'].firstChild.bounds);
                    // path.strokeColor='red';
                    element.children['collapse'].position = element.children['textBox'].firstChild.bounds.rightCenter + [CollapseReduis, 0];
                }
            }

            for (var i = 0, l = element.children['subNodes'].children.length; i < l; i++) {
                var child = element.children['subNodes'].children[i];
                //child.children[1].remove();
                child.addChild(createLine(element, child));
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
        data.text = item.children['textBox'].lastChild.content;
        var actions = item.children['actions'];
        var link;
        if (!!actions) {
            link = item.children['actions'].children['linkAction'];
        }
        if (!!link && !!link.data && !!link.data.link) {
            data.link = link.data.link;
        }
        
        data.children = [];
        if (!item.children['subNodes'].hasChildren) {
            return data;
        }
        for (var i = 0, l = item.children['subNodes'].children.length; i < l; i++) {
            data.children.push(exportItemData(item.children['subNodes'].children[i]));
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
        var item = createItem(parentItem, null, itemData.text, itemData.link);
        for (var i = 0, l = itemData.children.length; i < l; i++) {
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
        var position = activeItem.children['textBox'].bounds;
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
                if (!!activeItem.children['subNodes'].firstChild && activeItem.children['subNodes'].visible) {
                    selectItem(activeItem.children['subNodes'].firstChild);
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
                creating = true;
                if (controlHolding) {
                    if (!!activeItem.children['actions'].children['linkAction']) {
                        activeItem.children['actions'].children['linkAction'].emit('click');
                    }
                } else if (shiftHolding) {
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
            case 'l':
                editLink(activeItem);
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
            case 's':
                squLine = !squLine;
                reDraw(rootGroup);
                break;
            case 'space':
                if (shiftHolding) {
                    activeItem.children['collapse'].emit('click', activeItem.children['collapse']);
                } else {
                    editItem(activeItem);
                }
                break;
            default:
                return true;
        }
        return false;
    };

    return {
        clear: function () {
            removeItem(rootGroup);
        },
        importJSONData: importJSONData
    };
}();