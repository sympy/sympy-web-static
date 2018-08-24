// Copyright 2007 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Taken directly from jQuery source (MIT) - needed because Sphinx uses an
// old jQuery. Remove if using Sphinx >= 1.2
if (!jQuery.isNumeric) {
    jQuery.isNumeric = function( obj ) {
        return !isNaN( parseFloat(obj) ) && isFinite( obj );
    };
}
if (!jQuery.fn.on) {
    jQuery.fn.on = jQuery.fn.bind;
}
if (!jQuery.fn.prop) {
    jQuery.fn.prop = jQuery.fn.attr;
}

utilities.namespace("SymPy");

SymPy.Keys = {
    BACKSPACE: 8,  DEL:       46,
    TAB:       9,  SPACE:     32,
    ENTER:     13, ESC:       27,
    PAGE_UP:   33, PAGE_DOWN: 34,
    END:       35, HOME:      36,
    LEFT:      37, UP:        38,
    RIGHT:     39, DOWN:      40,
    CTRL:      17,
    A: 65, B: 66, C: 67, D: 68,
    E: 69, F: 70, G: 71, H: 72,
    I: 73, J: 74, K: 75, L: 76,
    M: 77, N: 78, O: 79, P: 80,
    Q: 81, R: 82, S: 83, T: 84,
    U: 85, V: 86, W: 87, X: 88,
    Y: 89, Z: 90,
    ZERO:  48, ONE:   49,
    TWO:   50, THREE: 51,
    FOUR:  52, FIVE:  53,
    SIX:   54, SEVEN: 55,
    EIGHT: 56, NINE:  57,
    ';':  59, ':':  59,
    '=':  61, '+':  61,
    '-': 109, '_': 109,
    ',': 188, '<': 188,
    '.': 190, '>': 190,
    '/': 191, '?': 191,
    '`': 192, '~': 192,
    '[': 219, '{': 219,
    ']': 221, '}': 221,
    "'": 222, '"': 222
};

SymPy.escapeHTML = function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

SymPy.unescapeHTML = function(str) {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
};

SymPy.lstrip = function(str) {
    return str.replace(/^\s+/, "");
};

SymPy.rstrip = function(str) {
    return str.replace(/\s+$/, "");
};

SymPy.strip = function(str) {
    return str.lstrip().rstrip();
};

SymPy.getDOMText = function(node) {
    // This is needed for cross-browser compatibility. Most browsers support
    // ``innerText`` but, for example, Firefox implements ``textContent``.
    return node.innerText || node.textContent;
};

SymPy.isTextNode = function(node) {
    return node.nodeType === 3;
};

SymPy.getBasePath = function(baseName) {
    if (baseName) {
        var scripts = document.getElementsByTagName('script');

        var reStart = RegExp("^(https?://[^/]+)/");
        var reEnd = RegExp("/" + baseName + "(\\?|$)");

        for (var i = scripts.length - 1; i >= 0; --i) {
            var src = scripts[i].src;

            if (src.match(reEnd) && src.match(reStart)) {
                return RegExp.$1;
            }
        }
    }

    return null;
};

SymPy.HISTORY_TEMPLATE = '<div id="sympy-live-toolbar-history">' +
    '<button id="button-history-prev">↑</button>' +
    '<button id="button-history-next">↓</button>' +
    '</div>';

SymPy.SHELL_INSTANCE = null;

SymPy.Shell = Class.$extend({
    banner: null,
    history: [''],
    historyCursor: 0,
    previousValue: "",
    evaluating: false,
    evaluatingCallbacks: [],
    supportsSelection: false,
    fullscreenMode: false,
    leftHeight: $('#left').height(),

    printerTypes: ['repr', 'str', 'ascii', 'unicode', 'latex'],
    submitTypes: ['enter', 'shift-enter'],
    recordTypes: ['on', 'off'],
    autocompleteTypes: ['tab', 'ctrl-space'],
    printer: null,
    submit: null,
    tabWidth: 4,
    basePath: null,
    defaultBasePath: 'https://live.sympy.org',
    autocompleter: null,

    __init__: function(config) {
        config = $.extend({}, config);

        if (config.basePath) {
            this.basePath = config.basePath;
        } else {
            this.basePath = SymPy.getBasePath(config.baseName);
        }

        if (config.banner) {
            this.banner = config.banner;
            delete config.banner;
        } else {
            var elem = $('#banner');

            if (elem) {
                this.banner = elem.html();
            }
        }

        if (this.banner) {
            this.banner = SymPy.rstrip(this.banner) + '\n\n';
        }

        this.queuedStatements = [];

        this.isPhone = window.matchMedia("screen and (max-device-width: 767px)").matches;
        this.isMobile = window.matchMedia("screen and (max-device-width: 1280px)").matches;

        var index;

        index = this.printerTypes.indexOf(config.printer);
        this.printer = (index == -1) ? this.getCookie('sympy-printer', 'latex') : config.printer;

        index = this.submitTypes.indexOf(config.submit);
        this.submit = (index == -1) ? this.getCookie('sympy-submit', 'enter') : config.submit;

        index = this.recordTypes.indexOf(config.record);
        this.record = (index == -1) ? this.getCookie('sympy-privacy', 'on') : config.record;

        index = this.autocompleteTypes.indexOf(config.autocomplete);
        this.autocomplete = (index == -1) ?
            this.getCookie('sympy-autocomplete', 'tab') : config.autocomplete;

        delete config.printer;
        delete config.submit;

        if ($.isNumeric(config.tabWidth)) {
            this.tabWidth = config.tabWidth;
            delete config.tabWidth;
        }

        SymPy.SHELL_INSTANCE = this;
    },

    render: function(el) {
        el = $(el) || $(document.body);

        this.outputEl = $('<div class="sympy-live-output" />').appendTo(el);

        if (this.banner) {
            this.outputEl.append($('<div>'+this.banner+'</div>'));
        }

        this.caretEl = $('<textarea/>').
            addClass('sympy-live-caret').
            attr({
                rows: '4',
                readonly: 'readonly'
            }).
            html('&gt;&gt;&gt;').
            appendTo(el);

        this.promptEl = $('<textarea/>').
            addClass('sympy-live-prompt').
            attr({
                rows: '4',
                spellcheck: 'false',
                autocorrect: 'off',
                autocapitalize: 'off'
            }).
            appendTo(el);

        this.completionsEl = $('<div/>').
            addClass('sympy-live-autocompletions-container').
            appendTo(el);

        this.completer = new SymPy.Completer({
            input: this.promptEl,
            container: this.completionsEl,
            basePath: this.basePath
        }, this);
        this.completer.setup();

        this.renderButtons(el);
        var settings = $('#settings .content');
        this.renderToolbar(settings);

        this.caretEl.on("focus", function(event) {
            this.focus();
        }, this);

        var keyEvent = this.getKeyEvent();

        this.promptEl.on(keyEvent, $.proxy(function(event) {
            this.preHandleKey(event);

            if (!this.handleKey(event)) {
                this.postHandleKey(event);
            }
        }, this));

        this.promptEl.keydown($.proxy(function(event) {
            if(event.ctrlKey || event.which === SymPy.Keys.CTRL) {
                if (this.completer.showingNumbers === false){
                    this.completer.showNumbers();
                }
            }
        }, this));

        this.promptEl.keyup($.proxy(function(event) {
            if(event.ctrlKey && event.which !== SymPy.Keys.CTRL) {
                if (this.completer.showingNumbers === false){
                    this.completer.showNumbers();
                }
            }
            else {
                this.completer.hideNumbers();
            }
        }, this));

        this.evaluateEl.click($.proxy( function(event) {
            this.evaluate();
            this.focus();
        }, this));

        this.makeOneOffEl.click($.proxy(function(event) {
            this.makeOneOffURL();
        }, this));

        this.clearEl.click($.proxy(function(event) {
            this.clear();
            this.focus();
        }, this));

        this.printerEl.change($.proxy(function(event) {
            this.updateSettings();
            this.focus();
        }, this));

        this.submitEl.change($.proxy(function(event) {
            this.updateSettings();
            this.focus();
        }, this));

        this.recordEl.change($.proxy(function(event) {
            this.updateSettings();
            this.focus();
        }, this));

        if (!this.isPhone) {
            this.autocompleteEl.change($.proxy(function(event) {
                this.updateSettings();
                this.focus();
            }, this));

            this.fullscreenEl.click($.proxy(function(event) {
                this.fullscreen();
            }, this));
        }
        else {
            this.promptEl.attr({autocorrect: 'off', autocapitalize: 'off'});
            $("#sympy-live-toolbar-main").
                appendTo(".sympy-live-completions-toolbar");
            this.completeButtonEl = $("<button>Complete</button>").
                insertAfter(this.evaluateEl);
            this.historyPrevEl.click($.proxy(function(event){
                this.promptEl.focus(1000);
                this.prevInHistory();
            }, this));
            this.historyNextEl.click($.proxy(function(event){
                this.promptEl.focus(1000);
                this.nextInHistory();
            }, this));
            this.completeButtonEl.click($.proxy(function(event){
                this.completer.complete(
                    this.getStatement(),
                    this.getSelection());
            }, this));
            $("#footer").appendTo($("#wrapper"));

            this.completer.expandCompletions = true;

            // Move login to top of page
            var container = $('<div id="mobile-login" class="mobile-header-item"/>').appendTo($('header'));
            var link = $("#user a");
            if (link.parent().is('h3')) {
                // Not logged in
                link.html('Log In');
            }
            else {
                link.html('Log Out');
            }
            link.appendTo(container);
            $("#user").remove();
        }

        setInterval($.proxy(this.updatePrompt, this), 100);

        this.renderSearches();
    },

    renderToolbar: function(settings) {
        this.toolbarEl = $('<p/>').
            append(
                $('<div/>').append(
                    $('<label for="output-format">Output Format</label>'),
                    $('<select id="output-format"/>').append(
                        $('<option value="repr">Repr</option>'),
                        $('<option value="str">Str</option>'),
                        $('<option value="ascii">ASCII</option>'),
                        $('<option value="unicode">Unicode</option>'),
                        $('<option value="latex">LaTeX</option>')
                    )
                ),
                $('<div/>').append(
                    $('<label for="submit-behavior">Submit with</label>'),
                    $('<select id="submit-behavior"/>').append(
                        $('<option value="enter">Enter</option>'),
                        $('<option value="shift-enter">Shift-Enter</option>')
                    )
                ),
                $('<div/>').append(
                    $('<label for="privacy">Privacy</label>'),
                    $('<select id="privacy"/>').append(
                        $('<option value="on">On</option>'),
                        $('<option value="off">Off</option>')
                    )
                )
            );
        this.toolbarEl.appendTo(settings);
        this.supportsSelection = 'selectionStart' in this.promptEl.get(0);
        this.printerEl = this.toolbarEl.find('select:nth(0)');
        this.submitEl = this.toolbarEl.find('select:nth(1)');
        this.recordEl = this.toolbarEl.find('select:nth(2)');
        var index;

        index = this.printerTypes.indexOf(this.printer);
        this.printerEl.children('option')[index].selected = true;

        index = this.submitTypes.indexOf(this.submit);
        this.submitEl.children('option')[index].selected = true;

        index = this.recordTypes.indexOf(this.record);
        this.recordEl.children('option')[index].selected = true;

        if (!this.isPhone) {
            this.toolbarEl.append(
                $('<div/>').append(
                    $('<label for="autocomplete">Complete with</label>'),
                    $('<select id="autocomplete"/>').append(
                        $('<option value="tab">Tab</option>'),
                        $('<option value="ctrl-space">Ctrl-Space</option>')
                    )
                ),
                $('<div/>').append(
                    $('<span>Ctrl-Up/Down for history</span>')
                )
            );
            this.autocompleteEl = this.toolbarEl.find('select:nth(3)');
            index = this.autocompleteTypes.indexOf(this.autocomplete);
            this.autocompleteEl.children('option')[index].selected = true;
        }
        else {
            this.promptEl.after($(SymPy.HISTORY_TEMPLATE));
            this.submitEl.children('option[value="enter"]').
                html("submits");
            this.submitEl.children('option[value="shift-enter"]').
                html("inserts newline");
            this.submitEl.prev().html('Enter');
            this.historyPrevEl = $("#button-history-prev");
            this.historyNextEl = $("#button-history-next");
        }
    },

    renderButtons: function(el) {
        this.buttonsEl = $('<p/>').
            addClass('sympy-live-toolbar').
            attr('id', 'sympy-live-toolbar-main').
            appendTo(el);
        this.evaluateEl = $('<button>Evaluate</button>').
            appendTo(this.buttonsEl);
        this.clearEl = $('<button>Clear</button>').
            appendTo(this.buttonsEl);

        if (!this.isPhone) {
            this.fullscreenEl = $('<button>Fullscreen</button>').
                attr('id', 'fullscreen-button').
                appendTo(this.buttonsEl);
        }

        this.makeOneOffEl = $('<button></button>').
            attr('id', 'make-one-off-button').
            appendTo(this.buttonsEl).
            attr('title', 'Make a URL that evaluates the session history');
    },

    renderSearches: function(){
        this.savedSearches = $("#saved_searches");
        this.recentSearches = $("#recent_searches");
        var setupEval = (function(el){
            var nodes = el.find("button");
            var shell = this;  // closure
            el.find("a").each(function(index, node){
                node = $(node);
                node.click(function(event){
                    // We don't want the query to show up twice
                    var origPrivacy = shell.recordEl.val();
                    shell.recordEl.val("on");
                    // And we're going to scroll to the output
                    var scrollY = shell.outputEl.offset().top;

                    shell.setValue(node.children("pre").html());
                    shell.evaluate();

                    $(document.body).scrollTop(scrollY);
                    shell.recordEl.val(origPrivacy);
                });
            });
        });
        setupEval.call(this, this.recentSearches);
        setupEval.call(this, this.savedSearches);
    },

    getKeyEvent: function() {
        return "keydown";
    },

    disablePrompt: function() {
        this.promptEl.blur();
        this.promptEl.prop('readonly', true);
    },

    enablePrompt: function() {
        this.promptEl.prop('readonly', false);
    },

    setValue: function(value) {
        this.promptEl.val(value);
    },

    clearValue: function() {
        this.setValue("");
    },

    getValue: function() {
        return this.promptEl.val();
    },

    isEmpty: function() {
        return this.getValue().length == 0;
    },

    isLaTeX: function() {
        return this.printerEl.val() == 'latex';
    },

    setSelection: function(sel) {
        var start, end;

        if ($.isNumeric(sel)) {
            start = sel;
            end = sel;
        } else {
            start = sel.start;
            end = sel.end;
        }

        this.promptEl[0].selectionStart = start;
        this.promptEl[0].selectionEnd = end;
    },

    getSelection: function() {
        return {
            start: this.promptEl[0].selectionStart,
            end: this.promptEl[0].selectionEnd
        };
    },

    setCursor: function(cur) {
        this.setSelection(cur);
    },

    getCursor: function() {
        var sel = this.getSelection();

        if (sel.start == sel.end) {
            return sel.start;
        } else {
            return null;
        }
    },

    onFirstLine: function() {
        if (this.supportsSelection) {
            var cursor = this.getCursor();

            if (cursor !== null) {
                return this.getValue().lastIndexOf('\n', cursor-1) === -1;
            }
        }

        return false;
    },

    onLastLine: function() {
        if (this.supportsSelection) {
            var cursor = this.getCursor();

            if (cursor !== null) {
                return this.getValue().indexOf('\n', cursor) === -1;
            }
        }

        return false;
    },

    prevInHistory: function() {
        if (this.historyCursor > 0) {
            this.setValue(this.history[--this.historyCursor]);
        }
    },

    nextInHistory: function() {
        if (this.historyCursor < this.history.length - 1) {
            this.setValue(this.history[++this.historyCursor]);
        }
    },

    handleKey: function(event) {
        if (event.ctrlKey && this.completer.isNumberKey(event.which)) {
            this.completer.doNumberComplete(event.which);
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        switch (event.which) {
        case SymPy.Keys.UP:
            if ((event.ctrlKey && !event.altKey) || this.onFirstLine()) {
                event.stopPropagation();
                event.preventDefault();
                this.prevInHistory();
            }

            return true;
        case SymPy.Keys.DOWN:
            if ((event.ctrlKey && !event.altKey) || this.onLastLine()) {
                event.stopPropagation();
                event.preventDefault();
                this.nextInHistory();
            }

            return true;
        case SymPy.Keys.K:
            if (event.altKey && !event.ctrlKey) {
                event.stopPropagation();
                event.preventDefault();
                this.prevInHistory();
                return true;
            }

            break;
        case SymPy.Keys.J:
            if (event.altKey && !event.ctrlKey) {
                event.stopPropagation();
                event.preventDefault();
                this.nextInHistory();
                return true;
            }

            break;
        case SymPy.Keys.LEFT:
            if (event.ctrlKey) {
                this.completer.showPrevGroup();
                event.stopPropagation();
                event.preventDefault();
                break;
            }
            else {
                return true;
            }
        case SymPy.Keys.RIGHT:
            if (event.ctrlKey) {
                this.completer.showNextGroup();
                event.stopPropagation();
                event.preventDefault();
                break;
            }
            else {
                return true;
            }
        case SymPy.Keys.DEL:
            this.completer.finishComplete();
            break;
        case SymPy.Keys.BACKSPACE:
            this.completer.finishComplete();
            if (this.supportsSelection) {
                var cursor = this.getCursor();

                if (cursor !== null) {
                    var value = this.getValue();
                    var spaces = 0;

                    for (var i = cursor; i > 0; i--) {
                        var ch = value[i-1];

                        if (ch === '\n') {
                            break;
                        } else if (ch === ' ') {
                            spaces++;
                        } else {
                            spaces = 0;
                            break;
                        }
                    }

                    if (spaces > 0) {
                        var cutoff = cursor - this.tabWidth;

                        if (cutoff >= i) {
                            var start = value.slice(0, cutoff);
                            var end = value.slice(cursor);

                            this.setValue(start + end);

                            event.stopPropagation();
                            event.preventDefault();
                            return true;
                        }
                    }
                }
            }

            break;
        case SymPy.Keys.ENTER:
            this.completer.finishComplete();
            var shiftEnter = (this.submitEl.val() == "shift-enter");
            if (event.shiftKey == shiftEnter) {
                event.stopPropagation();
                event.preventDefault();
                this.evaluate();
                return true;
            } else if (this.supportsSelection) {
                var cursor = this.getCursor();

                if (cursor !== null) {
                    var value = this.getValue();
                    var index = value.lastIndexOf('\n', cursor) + 1;
                    var spaces = "";

                    while (value[index++] == ' ') {
                        spaces += " ";
                    }

                    if (value[cursor-1] == ':') {
                        for (var i = 0; i < this.tabWidth; i++) {
                            spaces += " ";
                        }
                    }

                    var start = value.slice(0, cursor);
                    var end = value.slice(cursor);

                    this.setValue(start + '\n' + spaces + end);
                    this.setCursor(cursor + 1 + spaces.length);

                    event.stopPropagation();
                    event.preventDefault();
                    return true;
                }
            }

            break;
        case SymPy.Keys.E:
            if (event.altKey && (!event.ctrlKey || event.shiftKey)) {
                event.stopPropagation();
                event.preventDefault();
                this.evaluate();
                return true;
            }

            break;

        case SymPy.Keys.TAB:
            if (this.autocompleteEl.val() === "tab") {
                this.completer.complete(
                    this.getStatement(),
                    this.getSelection());
                event.stopPropagation();
                event.preventDefault();
            }
            break;

        case SymPy.Keys.SPACE:
            if (event.ctrlKey &&
                this.autocompleteEl.val() === "ctrl-space") {
                this.completer.complete(
                    this.getStatement(),
                    this.getSelection());
                event.stopPropagation();
                event.preventDefault();
            }
            break;
        }
        return false;
    },

    preHandleKey: function(event) {
        if (this.historyCursor == this.history.length-1) {
            this.history[this.historyCursor] = this.getValue();
        }
    },

    postHandleKey: function(event) {
        this.updateHistory(this.getValue());
    },

    updateHistory: function(value) {
        // TODO: is this function written incorrectly?
        this.historyCursor = this.history.length - 1;
        this.history[this.historyCursor] = value;
    },

    updatePrompt: function() {
        var value = this.getValue();

        if (this.previousValue != value) {
            var prompt = ">>>",
                lines = value.split('\n');

            var i = 1,
                n = lines.length;

            for (; i < n; i++) {
                prompt += "\n...";
            }

            this.caretEl.val(prompt);

            var rows = Math.max(4, n);

            this.caretEl.attr('rows', rows);
            this.promptEl.attr('rows', rows);

            this.previousValue = value;
        }
    },

    prefixStatement: function(statement) {
        if (typeof statement === "undefined") {
            statement = this.getValue();
        }
        var lines = statement.split('\n');

        lines[0] = ">>> " + lines[0];

        var i = 1,
            n = lines.length;

        for (; i < n; i++) {
            lines[i] = "... " + lines[i];
        }

        return lines.join("\n");
    },

    scrollToBottom: function() {
        this.outputEl[0].scrollTop = this.outputEl[0].scrollHeight;
    },

    scrollToLeft: function() {
        this.outputEl[0].scrollLeft = 0;
    },

    scrollToDefault: function() {
        this.scrollToBottom();
        this.scrollToLeft();
    },

    setEvaluating: function(state) {
      if (state) {
          this.evaluating = true;
          this.promptEl.addClass('sympy-live-processing');
          this.evaluateEl.attr({'disabled': 'disabled'});
          this.evaluateEl.addClass('sympy-live-evaluate-disabled');
          this.completer.finishComplete();
      } else {
          this.evaluating = false;
          this.promptEl.removeClass('sympy-live-processing');
          this.evaluateEl.attr({disabled: null});
          this.evaluateEl.removeClass('sympy-live-evaluate-disabled');
          $.each(this.evaluatingCallbacks, function() {
              this();
          });
      }
    },

    addCallback: function(callback) {
        this.evaluatingCallbacks.push(callback);
    },

    getStatement: function() {
        // gets and sanitizes the current statement
        var statement = this.getValue();
        if (!statement.match(/^\s*$/)) {
            return statement;
        }
        return null;
    },

    evaluate: function() {
        var statement = this.getValue();
        this.updateHistory(statement);
        // make sure the statement is not only whitespace
        // use statement != "" if pure whitespace should be evaluated
        if (!this.evaluating && !statement.match(/^\s*$/)) {
            this.setEvaluating(true);

            var data = {
                print_statement: this.getValue().split('\n'),
                statement: statement,
                printer: this.printerEl.val(),
                session: this.session || null,
                privacy: this.recordEl.val()
            };

            var value = this.prefixStatement();

            this.clearValue();
            this.updatePrompt();

            this.history.push('');
            this.historyCursor = this.history.length - 1;

            $('<div/>').html(SymPy.escapeHTML(value)).appendTo(this.outputEl);

            this.scrollToDefault();

            if (navigator.userAgent.match(/like Mac OS X/i)) {
                timeout = 58; // On an iOS Device
                } else {
            timeout = 61; // Not iOS based
                }

            $.ajax({
                type: 'POST',
                url: (this.basePath || '') + '/evaluate',
                dataType: 'json',
                timeout: (timeout * 1000),
                data: JSON.stringify(data),
                success: $.proxy(function(response, status) {
                    this.done(response);
                    this.focus();
                }, this),
                error: $.proxy(this.error, this),
            });
            this.focus();
        }
    },

    queueStatement: function(statement) {
        this.queuedStatements.push(statement);
    },

    dequeueStatement: function() {
        if (this.queuedStatements.length !== 0) {
            this.setValue(this.queuedStatements.shift());
        }
    },

    done: function(response) {
        this.session = response.session;

        var result = response.output.replace(/^(\s*\n)+/, '');

        if (result.length) {
            var element = $("<div/>").html(SymPy.escapeHTML(result));
            if (this.isLaTeX()) {
                element.addClass('sympy-live-hidden');
            }
            element.appendTo(this.outputEl);

            this.scrollToDefault();

            if (this.printerEl.val() == 'latex') {
                function postprocessLaTeX() {
                    element.removeClass('sympy-live-hidden');
                    this.scrollToDefault();
                }

                MathJax.Hub.Queue(['Typeset', MathJax.Hub, element.get(0)],
                                  [$.proxy(postprocessLaTeX, this)]);
            }
        }

        this.setEvaluating(false);

        if (this.queuedStatements.length !== 0) {
            this.dequeueStatement();
            this.evaluate();
        }
    },

    error: function(xhr, status, error) {
        console.log("Error:", xhr, status, error);

        var errorMessage = "Unspecified error.";

        if (status == "timeout") {
            errorMessage = "Error: Time limit exceeded.";
        }
        else if (status == "error") {
            errorMessage = "Error: " + error + ".";
        }

        $('<div/>').html(errorMessage).appendTo(this.outputEl);

        this.scrollToDefault();
        this.clearValue();
        this.updatePrompt();
        this.setEvaluating(false);
        this.queuedStatements = [];
    },

    clear: function() {
        var elements = this.outputEl.find('div').remove();

        if (this.banner) {
            $("<div/>").html(this.banner).appendTo(this.outputEl);
        }

        this.clearValue();
        this.historyCursor = this.history.length-1;
        delete this.session;

        this.completer.finishComplete();
    },

    updateSettings: function() {
        this.setCookie('sympy-printer', this.printerEl.val());
        this.setCookie('sympy-submit', this.submitEl.val());
        this.setCookie('sympy-privacy', this.recordEl.val());

        if (!this.isMobile) {
            this.setCookie('sympy-autocomplete', this.autocompleteEl.val());
        }
    },

    setCookie: function(name, value) {
        var expiration = new Date();
        expiration.setYear(expiration.getFullYear() + 1);
        value = escape(value) + "; expires=" + expiration.toUTCString();
        document.cookie = name + "=" + value;
    },

    getCookie: function(name, default_value) {
        var result = null;
        var i, x, y, cookies = document.cookie.split(";");
        for (i = 0; i < cookies.length; i++) {
            x = cookies[i].substr(0, cookies[i].indexOf("="));
            y = cookies[i].substr(cookies[i].indexOf("=")+1);
            x = x.replace(/^\s+|\s+$/g,"");
            if (x == name) {
                result = unescape(y);
                break;
            }
        }

        return (result) ? result : default_value;
    },

    eraseCookie: function(name) {
        var expiration = new Date();
        expiration.setTime(date.getTime() - 24 * 60 * 60 * 1000);
        value = "; expires=" + expiration.toUTCString();
        document.cookie = name + "=" + value;
    },

    fullscreen: function() {
        if (!this.fullscreenMode) {
            this.fullscreenEl.html('Exit Fullscreen');
            var popup = $('<div class="sympy-live-fullscreen-popup">Escape to close fullscreen mode.</div>');
            popup.prependTo($(document.body)).css({
                'font-size': 20,
                'color' : '#fff',
                'z-index' : 10000,
                'position' : 'absolute',
                left: $(window).width() / 2,
                top: ($(window).height() - popup.height()) / 2
            });
            popup.delay(1000).fadeOut(300);

            $("#sympy-live-toolbar-main").appendTo(".sympy-live-completions-toolbar");

            this.fullscreenMode = true;

            var main = $("#main");
            main.addClass('fullscreen');
            main.find('#sidebar').hide();
            main.find('#footer').hide();

            var overlay = $("<div />").appendTo($(document.body));
            overlay.css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                left: 0,
                top: 0,
                background: '#DDD',
                zIndex: 9999
            }).attr('id', 'overlay').fadeOut(500);

            $(document.body).css({
                width: $(window).width(),
                height: $(window).height(),
                overflow: 'hidden'
            });

            var resize = function() {
                var height = $("#shell").height() -
                    2 * $('.sympy-live-prompt').outerHeight() -
                    5 * $('.sympy-live-autocompletions-container').outerHeight() -
                    $("#main h1").outerHeight();
                if (height < 20 * 16) {
                    // 20em * (16px / 1em), at least at 96dpi?
                    height = 20 * 16;
                }
                $('.sympy-live-output').height(height);
            };

            $(window).resize(resize).resize();

            // enabling escape key to close fullscreen mode
            var keyEvent = this.getKeyEvent();
            $(document).on(keyEvent, $.proxy(function(event) {
                if(event.which == SymPy.Keys.ESC){
                    this.closeFullscreen();
                }
            }, this));
        }
        else {
            this.closeFullscreen();
        }
    },

    closeFullscreen : function() {
        if (this.fullscreenMode) {
            this.fullscreenEl.html('Fullscreen');
            var main = $("#main");
            main.removeClass('fullscreen');
            main.find('#sidebar').show();
            main.find('#footer').show();
            $("#sympy-live-toolbar-main").appendTo("#shell");

            $("#overlay").show().fadeOut(500, function() { this.remove(); });
            $(document.body).css({
                width: 'auto',
                height: 'auto',
                overflow: 'auto'
            });

            $(window).off('resize');
            $('.sympy-live-output').css('height', '');
        }
        this.fullscreenMode = false;
    },

    makeURL: function(statements) {
        var component = encodeURIComponent(this.getValue());
        var url = window.location.origin + window.location.pathname + '?evaluate=';

        return url + encodeURIComponent(statements);
    },

    makeOneOffURL: function() {
        $('.sympy-live-dialog').remove();
        var offset = this.makeOneOffEl.offset();
        var outerHeight = this.makeOneOffEl.outerHeight();
        var dialog = $('<div/>')
            .appendTo($('body'))
            .addClass('sympy-live-dialog');
        var output = $('<div/>');
        dialog.append(output);
        dialog.css('opacity', 0);

        var close = function() {
            dialog.css('opacity', 0);
            setTimeout(function() { dialog.remove() }, 300);
        };

        output.append($('<button><i class="icon-collapse-top"></i> Close</button>').click(function() {
            close();
        }));

        output.append($('<p> This is your history. The #-- comments separate individual statements to be executed and will be removed from the output.</p>'));
        var history = $('<textarea/>');
        var contents = this.history.join('\n#--\n');
        history.val(contents);
        output.append(history);

        var makeButton = $('<button><i class="icon-ok"></i> Make URL</button>');
        makeButton.click($.proxy(function() {
            close();
            window.open(this.makeURL(history.val()));
        }, this));
        output.append(makeButton);

        $('body').keydown(function(e) {
            if (e.which == SymPy.Keys.ESC) {
                close();
            }
        });

        if (this.isMobile) {
            $('body').scrollTop(0);
        }

        // show the dialog
        // we're using CSS to animate
        setTimeout(function() { dialog.css('opacity', 1); }, 100);
    },

    evaluateInitial: function(statements) {
        var statements = statements
            .replace('\r\n', '\n')
            .replace('\r', '\n')
            .split(/#--[^\n]*/);
        var current = 1;
        this.addCallback($.proxy(function() {
            this.setValue(statements[current].trim());
            this.evaluate();
            current += 1;
        }, this));
        this.setValue(statements[0].trim());
        this.evaluate();
    },

    focus: function() {
        this.promptEl.focus();
    }
});
