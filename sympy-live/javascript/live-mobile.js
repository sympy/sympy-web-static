utilities.namespace("SymPy");
SymPy.HISTORY_TEMPLATE = '<div id="sympy-live-toolbar-history">' +
    '<button id="button-history-prev">↑</button>' +
    '<button id="button-history-next">↓</button>' +
    '</div>';
SymPy.MobileShell = SymPy.Shell.$extend({
    __init__: function(config) {
        config = $.extend({}, config);
        this.$super(config);
    },
    render: function(el) {
        this.$super(el);
        this.renderSearches();
    },
    handleKey: function(event) {
        if (event.which == SymPy.Keys.ENTER) {
            var enterSubmits = (this.submitEl.val() ==
                                "enter");
            if (enterSubmits) {
                event.stopPropagation();
                event.preventDefault();
                this.evaluate();
                return true;
            }
            else if (this.supportsSelection){

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
        }
        this.$super(event);
    },

    focus: function() {
        this.setSelection(this.getValue().length);
    }
});
