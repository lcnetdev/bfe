var copy = require('dryice').copy;
var CleanCSS = require('clean-css');

var BFEHOME = __dirname;

var bfe = copy.createDataObject();

var project = copy.createCommonJsProject({
    roots: [ BFEHOME ]
});

var version = "0.1.0";

copy({
        source: ["build_support/mini_require.js"],
        dest: bfe
    });

copy({
    source: [{
        project: project,
        require: ["src/bfe", "src/lookups/lcshared", "src/lib/text"]
    }],
    filter: [copy.filter.moduleDefines],
    dest: bfe
});

copy({
    source: bfe,
    filter: [copy.filter.moduleDefines, namespace("bfe"), exportAce("bfe", "src/bfe", "bfe")],
    dest: 'builds/bfe.js'
});

copy({
    source: bfe,
    filter: [copy.filter.moduleDefines, namespace("bfe"), copy.filter.uglifyjs, exportAce("bfe", "src/bfe", "bfe")],
    dest: 'builds/bfe.min.js'
});


var css = copy.createDataObject();

copy({
    source: ["src/css/bootstrap.css", "src/css/typeahead.css"],
    dest: css
});

copy({
    source: css,
    dest: 'builds/bfe.css'
});

copy({
    source: css,
    filter: [
        function(data) {
            return new CleanCSS().minify(data);
        }],
    dest: 'builds/bfe.min.css'
});


/*
    The two functions below copied from: 
    https://github.com/ajaxorg/ace/blob/master/Makefile.dryice.js
    
    'exportAce' has been slighlty modified.
    
    They are under the BSD license, which is found at the above link.
*/

function namespace(ns) {
    return function(text) {
        text = text
            .toString()
            .replace('var ACE_NAMESPACE = "";', 'var ACE_NAMESPACE = "' + ns +'";')
            .replace(/(\.define)|\bdefine\(/g, function(_, a) {
                return a || ns + ".define("
            });

        return text;
    };
}


function exportAce(ns, module, requireBase) {
    requireBase = requireBase || "window";
    module = module || "src/bfe";
    return function(text) {

        var template = function() {
            (function() {
                REQUIRE_NS.require(["MODULE"], function(a) {
                    console.log(a);
                    a && a.aceconfig.init();
                    if (!window.NS)
                        window.NS = {};
                    for (var key in a) if (a.hasOwnProperty(key))
                        NS[key] = a[key];
                });
            })();
        };

        return (text + ";" + template
            .toString()
            .replace(/MODULE/g, module)
            .replace(/REQUIRE_NS/g, requireBase)
            .replace(/NS/g, ns)
            .slice(13, -1)
        );
    };
}
