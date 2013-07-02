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
    renderSearches: function(){
        this.savedSearches = $("#saved-searches");
        this.recentSearches = $("#recent-searches");
        var setupEval = (function(el){
            var nodes = el.find("button");
            var shell = this;  // closure
            el.find("button").each(function(index, node){
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
        $("#saved-searches-clear").click(function(){
            if(confirm("Delete history?") === true){
                $.ajax({
                    url: "http://" + window.location.host + "/delete",
                    type: 'GET',
                    dataType: 'text',
                    success: function(data, status, xhr){
                        $('#saved-searches-list').
                            html('<li>' + data + '</li>');
                    },
                    failure: function(xhr, status, error){
                        alert("Error: " + status + error);
                    }
                })
            }
        });
    },

    focus: function() {
        this.setSelection(this.getValue().length);
    }
});
