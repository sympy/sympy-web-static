utilities.namespace("SymPy");
SymPy.DEFAULT_ANIMATION_DURATION = 500;
SymPy.SphinxShell = SymPy.Shell.$extend({
    evalModeTypes: ['eval', 'copy'],
    evalMode: 'eval',

    __init__: function(config) {
        this.$super(config);
        this.visible = false;

        var index = this.evalModeTypes.indexOf(config.evalMode);
        this.evalMode = (index == -1) ? this.getCookie('sympy-evalMode', 'eval') : config.evalMode;
        index = this.evalModeTypes.indexOf(config.dockMode);
        this.dockMode = (index == -1) ? this.getCookie('sympy-dockMode', true) : config.dockMode;
        if (this.dockMode === 'false') {
            this.dockMode = false;
        }
        this.banner = config.banner ? config.banner : '';
        this.session = this.getCookie('sympy-session', null);
    },

    render: function(el) {
        this.$super(el);

        this.shellEl = $(el);

        var headerLink =
            $('<a href="http://live.sympy.org">SymPy Live Shell</a>');
        var header = $("<h2/>").append(headerLink);
        this.shellEl.prepend(header);

        this.toggleShellEl = $('<button/>').
            html("<span>Show SymPy Live Shell</span>").
            attr("id", "toggleShell");
        this.toggleShellEl.prepend($('<div class="arrow" />'));

        this.toggleShellEl.appendTo(document.body);
        this.toggleShellEl.click($.proxy(function() {
            this.toggle();
        }, this));

        // Add a link to Python code that will evaluate it in SymPy Live
        this.processCodeBlocks();

        // Don't expand the list of tab completions (saves space)
        this.completer.expandCompletions = false;

        // Change Fullscreen to go to main website
        $("#fullscreen-button").html("Go to SymPy Live");

        this.evalModeEl.change($.proxy(function(event) {
            this.updateSettings();
        }, this));

        this.dockModeEl.change($.proxy(function(event) {
            this.updateSettings();
        }, this));
    },

    renderToolbar: function(settings) {
        this.$super(settings);

        $('<h3 class="shown">Settings</h3>').
            prependTo($("#settings")).
            click($.proxy(this.toggleSettings, this));
        $("#settings h3").prepend($('<div class="arrow"/>'));

        this.toolbarEl.append(
            $("<div/>").append(
                $('<label for="evalMode">Evaluation Mode:</label>'),
                $('<select id="evalMode"/>').append(
                    $('<option value="eval">Evaluate</option>'),
                    $('<option value="copy">Copy</option>')
                )
            ),
            $("<div/>").append(
                $('<label for="dockMode">Dock to Right</label>'),
                $('<input id="dockMode" type="checkbox"/>')
            )
        );
        this.evalModeEl = $('#evalMode');
        this.dockModeEl = $('#dockMode');

        var index = this.evalModeTypes.indexOf(this.evalMode);
        this.evalModeEl.children('option')[index].selected = true;

        if (this.dockMode) {
            this.dockModeEl.prop('checked', true);
        }

        // Make enter the default submission button
        $("#submit-behavior").val("enter");
    },

    done: function(response) {
        this.$super(response);
        this.setCookie('sympy-session', this.session);
    },

    processCodeBlocks: function() {
        $('.highlight-python').each($.proxy(function(index, el) {
            var el = $(el);
            var promptsFound = this.processIndividualCodeBlocks(el.find('pre'));

            if (promptsFound) {
                // Add the toolbar
                var container = $("<div/>").addClass('sympy-live-eval-toolbar');
                var evaluate = $("<button>Run code block in SymPy Live</button>").
                    addClass('sympy-live-eval-button').
                    appendTo(container);
                el.prepend(container);

                evaluate.click($.proxy(function() {
                    this.show();
                    var statementBlocks = el.find('div.live-statement');
                    var codeBlocks = [];
                    for (var i = 0; i < statementBlocks.length; i++) {
                        codeBlocks.push(
                            this.stripCode($(statementBlocks[i]).text())
                        );
                    }
                    if (this.evalModeEl.val() === "eval") {
                        this.queuedStatements = codeBlocks;
                        this.dequeueStatement();
                        this.evaluate();
                    }
                    else {
                        this.setValue(codeBlocks.join("\n"));
                        this.focus();
                    }
                }, this));
            }
        }, this));
    },

    /**
     * Processes a <pre> block, wrapping each line in a <div>. Additionally,
     * if the line is a Python prompt, it will be made executable-on-click.
     *
     * @return {Boolean} true if prompts were found
     */
    processIndividualCodeBlocks: function(codeEl) {
        // childNodes gives text nodes which we want for whitespace
        var childNodes = codeEl.get(0).childNodes;
        var currentLine = [];
        var lines = [];

        for (var i = 0; i < childNodes.length; i++) {
            var domNode = childNodes[i];
            if (domNode.nodeType === domNode.ELEMENT_NODE) {
                currentLine.push(domNode.cloneNode(true));

                // innerText is non-standard but only Firefox does not
                // support it; textContent is standard but IE < 9
                // does not support it
                var textContent = domNode.textContent || domNode.innerText;
                if (currentLine.length === 1 &&
                    textContent.substr(0, 3) === "...") {
                    // First node on line and continuation, so continue from
                    // the previous line
                    currentLine = lines.pop();
                    currentLine.push(domNode.cloneNode(true));
                }
            }
            else if (domNode.nodeType === domNode.TEXT_NODE) {
                currentLine.push(domNode.cloneNode(true));
                if (domNode.data.substr(-1) === '\n') {
                    lines.push(currentLine);
                    currentLine = [];
                }
            }
        }

        if (lines.length !== 0) {
            var foundPrompt = false;

            codeEl.empty();
            for (var i = 0; i < lines.length; i++) {
                var line = $('<div />');
                var processingLine = lines[i];
                var firstLineContent = processingLine[0].textContent ||
                    processingLine[0].innerText;
                if (firstLineContent.substr(0, 4) === ">>> ") {
                    foundPrompt = true;

                    line.addClass('live-statement');
                    line.click($.proxy((function(line) {
                        // Save the current line
                        return function() {
                            this.setValue(this.stripCode(line.text()));
                            this.show();
                            if (this.evalModeEl.val() === "eval") {
                                this.evaluate();
                            }
                            else {
                                this.focus();
                            }
                        }
                    })(line), this));
                    line.hover(
                        function() {},
                        function() {}
                    );
                }
                line.append(processingLine);
                codeEl.append(line);
            }

            return foundPrompt;
        }

        // No code was processed so of course no prompts were found
        return false;
    },

    // Strips >>> and ... from a string
    stripCode: function(text) {
        var lines = text.split(/\n/g);
        var strippedLines = [];
        for (var i = 0; i < lines.length; i++) {
            strippedLines.push(lines[i].slice(4));
        }
        return strippedLines.join('\n').trim();
    },

    adjustOutputHeight: function(expand) {
        if (this.isDockedToRight() && !$("#settings").is('.shown')) {
            var height = $("#settings .content").css('height', 'auto').height();
            $("#settings .content").height(0);
            if (expand) {
                this.outputEl.height(this.outputEl.height() + height);
            }
            else {
                this.outputEl.height(this.outputEl.height() - height);
            }
        }
    },

    hide: function(duration) {
        this.dockTo('bottom');
        if (typeof duration === "undefined") {
            duration = SymPy.DEFAULT_ANIMATION_DURATION;
        }
        this.disablePrompt();
        this.adjustOutputHeight(false);

        this.shellDimensionsRestored = {
            width: this.shellEl.width(),
            height: this.shellEl.height(),
            opacity: 1
        };

        this.shellEl.animate({
            width: 0,
            height: 0,
            opacity: 0
        }, duration);
        this.visible = false;

        this.toggleShellEl.removeClass('shown').children('span').
            html("Show SymPy Live Shell");
    },

    show: function(duration) {
        if (this.visible) return;

        if (typeof duration === "undefined") {
            duration = SymPy.DEFAULT_ANIMATION_DURATION;
        }
        if (typeof this.shellDimensionsRestored === "undefined") {
            this.shellDimensionsRestored = {};
            // Quickly show the shell and get its height
            var shell = $(this.shellEl).css('display', 'block');
            this.shellDimensionsRestored.height = shell.height();
            this.shellDimensionsRestored.width = shell.width();
            shell.css('display', 'none');
        }
        this.enablePrompt();
        var shell = $(this.shellEl).css('display', 'block').width(0).height(0);
        $(this.shellEl).animate(
            this.shellDimensionsRestored,
            duration,
            $.proxy(function() {
                // Don't fix the height so that if the settings are
                // expanded, the shell will expand with them
                $(this.shellEl).css('height', 'auto');

                if (this.isDockedToRight()) {
                    this.dockTo('right');
                    this.adjustOutputHeight(true);
                }
            }, this));
        this.visible = true;
        this.toggleShellEl.addClass('shown').children('span').
            html("Hide SymPy Live Shell");
    },

    toggle: function(duration) {
        if (typeof duration === "undefined") {
            duration = SymPy.DEFAULT_ANIMATION_DURATION;
        }
        if (this.isVisible()) {
            this.hide(duration);
        }
        else {
            this.show(duration);
        }
    },

    toggleSettings: function() {
        $("#settings h3").toggleClass('shown');
        $("#settings").toggleClass('shown');

        var content = $("#settings .content");
        if ($("#settings").is('.shown')) {
            var height = content.css('height', 'auto').height();
            content.height(0).height(height);
            if (this.isDockedToRight()) {
                this.outputEl.height(this.outputEl.height() - height);
            }
        }
        else {
            if (this.isDockedToRight()) {
                this.outputEl.height(this.outputEl.height() + content.height());
            }
            content.height(0);
        }
    },

    dockTo: function(side) {
        if (side === "bottom") {
            $('body').removeClass('live-sphinx-dock-right');
        }
        else if (side === "right") {
            $('body').addClass('live-sphinx-dock-right');
        }
        else {
            throw {
                name: "SymPy Live Sphinx Error",
                message: "Cannot dock to " + side,
                toString: function() {
                    return this.name + ': ' + this.message;
                }
            };
        }
    },

    isVisible: function() {
        return this.visible;
    },

    isDockedToRight: function() {
        return this.dockModeEl.prop('checked');
    },

    fullscreen: function() {
        window.open("http://live.sympy.org");
    },

    makeURL: function(statements) {
        return 'http://live.sympy.org/?evaluate=' + encodeURIComponent(statements);
    },

    updateSettings: function() {
        this.$super();
        this.setCookie('sympy-evalMode', this.evalModeEl.val());
        this.setCookie('sympy-dockMode', this.isDockedToRight());
        if (this.isDockedToRight()) {
            this.dockTo('right');
        }
        else {
            this.dockTo('bottom');
        }
    }
});

$(document).ready(function() {
    var path = SymPy.getBasePath('live-sphinx.js');

    $.get(path + '/sphinxbanner', function(data) {
        var shellEl = $('<div id="shell"/>').appendTo($(document.body));
        var settingsEl = $('<div id="settings"><div class="content"></div></div>');
        settingsEl.appendTo(shellEl);  // Needed to render the shell

        var shell = new SymPy.SphinxShell({
            baseName: 'live-sphinx.js',
            banner: data
        });
        shell.render(shellEl);
        settingsEl.appendTo(shellEl); // Put it under the shell
    });
});
