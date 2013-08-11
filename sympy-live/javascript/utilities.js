if (!window.JSON) {
  window.JSON = {
    parse: function (sJSON) { return eval("(" + sJSON + ")"); },
    stringify: function (vContent) {
      if (vContent instanceof Object) {
        var sOutput = "";
        if (vContent.constructor === Array) {
          for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
          return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
        }
        if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
        for (var sProp in vContent) { sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ","; }
        return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
      }
      return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
    }
  };
}

var utilities = {
    namespace: function(_namespace) {
        var namespaces = _namespace.split(/\./g);
        var root = window;
        for(var i = 0; i < namespaces.length; i++) {
            if (typeof root[namespaces[i]] === "undefined" ||
                root[namespaces[i]] === null) {
                root[namespaces[i]] = {};
            }
            root = root[namespaces[i]];
        }
        return root;
    },

    getURLParameter: function(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
    },

    /**
     * Processes an element, looking for Python statements formatted as
     * console input. This differs from SphinxShell's functionality in that
     * it does not handle Pygments highlighting.
     *
     * @return {Array} list of statements
     */
    extractStatements: function(codeEl) {
        codeEl = codeEl.get(0);

        // innerText is non-standard but only Firefox does not
        // support it; textContent is standard but IE < 9
        // does not support it
        var text = codeEl.textContent || codeEl.innerText;
        var statements = [];
        var statement = [];
        var lines = text.split('\n');

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            if (line.substring(0, 4) === "... ") {
                statement.push(line.substring(4));
                continue;
            }
            else if (line.substring(0, 4) === ">>> ") {
                statement.push(line.substring(4));
            }

            if (statement.length) {
                statements.push(statement.join('\n'));
                statement = [];
            }
        }
        if (statement.length) {
            statements.push(statement.concat('\n'));
        }
        return statements;
    }
}
