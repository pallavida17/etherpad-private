/**
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// requires: top
// requires: plugins
// requires: undefined

// Frontend 

Ace2Editor.registry = {
    nextId: 0
};

function Ace2Editor() {
    var thisFunctionsName = "Ace2Editor";
    var ace2 = Ace2Editor;

    var editor = {};
    var info = {
        editor: editor,
        id: (ace2.registry.nextId++)
    };
    var loaded = false;

    var actionsPendingInit = [];

    function pendingInit(func, optDoNow) {
        return function () {
            var that = this;
            var args = arguments;

            function action() {
                func.apply(that, args);
            }
            if (optDoNow) {
                optDoNow.apply(that, args);
            }
            if (loaded) {
                action();
            }
            else {
                actionsPendingInit.push(action);
            }
        };
    }

    function doActionsPendingInit() {
        for (var i = 0; i < actionsPendingInit.length; i++) {
            actionsPendingInit[i]();
        }
        actionsPendingInit = [];
    }

    ace2.registry[info.id] = info;

    editor.importText = pendingInit(function (newCode, undoable) {
        info.ace_importText(newCode, undoable);
    });
    editor.importAText = pendingInit(function (newCode, apoolJsonObj, undoable) {
        info.ace_importAText(newCode, apoolJsonObj, undoable);
    });
    editor.exportText = function () {
        if (!loaded) return "(awaiting init)\n";
        return info.ace_exportText();
    };
    editor.getFrame = function () {
        return info.frame || null;
    };
    editor.focus = pendingInit(function () {
        info.ace_focus();
    });
    editor.setEditable = pendingInit(function (newVal) {
        info.ace_setEditable(newVal);
    });
    editor.getFormattedCode = function () {
        return info.ace_getFormattedCode();
    };
    editor.setOnKeyPress = pendingInit(function (handler) {
        info.ace_setOnKeyPress(handler);
    });
    editor.setOnKeyDown = pendingInit(function (handler) {
        info.ace_setOnKeyDown(handler);
    });
    editor.setNotifyDirty = pendingInit(function (handler) {
        info.ace_setNotifyDirty(handler);
    });

    editor.setProperty = pendingInit(function (key, value) {
        info.ace_setProperty(key, value);
    });
    editor.getDebugProperty = function (prop) {
        return info.ace_getDebugProperty(prop);
    };

    editor.setBaseText = pendingInit(function (txt) {
        info.ace_setBaseText(txt);
    });
    editor.setBaseAttributedText = pendingInit(function (atxt, apoolJsonObj) {
        info.ace_setBaseAttributedText(atxt, apoolJsonObj);
    });
    editor.applyChangesToBase = pendingInit(function (changes, optAuthor, apoolJsonObj) {
        info.ace_applyChangesToBase(changes, optAuthor, apoolJsonObj);
    });
    // prepareUserChangeset:
    // Returns null if no new changes or ACE not ready.  Otherwise, bundles up all user changes
    // to the latest base text into a Changeset, which is returned (as a string if encodeAsString).
    // If this method returns a truthy value, then applyPreparedChangesetToBase can be called
    // at some later point to consider these changes part of the base, after which prepareUserChangeset
    // must be called again before applyPreparedChangesetToBase.  Multiple consecutive calls
    // to prepareUserChangeset will return an updated changeset that takes into account the
    // latest user changes, and modify the changeset to be applied by applyPreparedChangesetToBase
    // accordingly.
    editor.prepareUserChangeset = function () {
        if (!loaded) return null;
        return info.ace_prepareUserChangeset();
    };
    
    editor.applyPreparedChangesetToBase = pendingInit(

    function () {
        info.ace_applyPreparedChangesetToBase();
    });
    editor.setUserChangeNotificationCallback = pendingInit(function (callback) {
        info.ace_setUserChangeNotificationCallback(callback);
    });
    editor.setAuthorInfo = pendingInit(function (author, authorInfo) {
        info.ace_setAuthorInfo(author, authorInfo);
    });
    editor.setAuthorSelectionRange = pendingInit(function (author, start, end) {
        info.ace_setAuthorSelectionRange(author, start, end);
    });

    editor.getUnhandledErrors = function () {
        if (!loaded) return [];
        // returns array of {error: <browser Error object>, time: +new Date()}
        return info.ace_getUnhandledErrors();
    };

    editor.callWithAce = pendingInit(function (fn, callStack, normalize) {
        return info.ace_callWithAce(fn, callStack, normalize);
    });

    editor.execCommand = pendingInit(function (cmd, arg1) {
        info.ace_execCommand(cmd, arg1);
    });
    editor.replaceRange = pendingInit(function (start, end, text) {
        info.ace_replaceRange(start, end, text);
    });


    // calls to these functions ($$INCLUDE_...)  are replaced when this file is processed
    // and compressed, putting the compressed code from the named file directly into the
    // source here.
    var $$INCLUDE_CSS = function (fileName) {
        return '<link rel="stylesheet" type="text/css" href="' + fileName + '"/>';
    };
    var $$INCLUDE_JS = function (fileName) {
        return '\x3cscript type="text/javascript" src="' + fileName + '">\x3c/script>';
    };
    var $$INCLUDE_JS_DEV = $$INCLUDE_JS;
    var $$INCLUDE_CSS_DEV = $$INCLUDE_CSS;

    var $$INCLUDE_CSS_Q = function (fileName) {
        return '\'<link rel="stylesheet" type="text/css" href="' + fileName + '"/>\'';
    };
    var $$INCLUDE_JS_Q = function (fileName) {
        return '\'\\x3cscript type="text/javascript" src="' + fileName + '">\\x3c/script>\'';
    };
    var $$INCLUDE_JS_Q_DEV = $$INCLUDE_JS_Q;
    var $$INCLUDE_CSS_Q_DEV = $$INCLUDE_CSS_Q;

    editor.destroy = pendingInit(function () {
        info.ace_dispose();
        info.frame.parentNode.removeChild(info.frame);
        delete ace2.registry[info.id];
        info = null; // prevent IE 6 closure memory leaks
    });

    editor.init = function (containerId, initialCode, doneFunc) {

        // init editor
        OUTER(this);

        editor.importText(initialCode);

        info.onEditorReady = function () {
            loaded = true;
            doActionsPendingInit();
            doneFunc();
        };

        Ace2Editor.registry[0].onEditorReady();

    };

    return editor;
}
