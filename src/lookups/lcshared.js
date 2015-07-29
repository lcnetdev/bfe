define(function(require, exports, module) {

    exports.processSuggestions = function(suggestions, query) {
        var typeahead_source = [];
        if ( suggestions[1] !== undefined ) {
            for (var s=0; s < suggestions[1].length; s++) {
                var l = suggestions[1][s];
                var u = suggestions[3][s];
                typeahead_source.push({ uri: u, value: l });
            }
        }
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        return typeahead_source;
    }
    
    exports.processATOM = function(atomjson, query) {
        var typeahead_source = [];
        for (var k in atomjson) {
            if (atomjson[k][0] == "atom:entry") {
                var t = "";
                var u = "";
                var source = "";
                for (var e in atomjson[k] ) {
                    if (atomjson[k][e][0] == "atom:title") {
                        t = atomjson[k][e][2];
                    }
                    if (atomjson[k][e][0] == "atom:link") {
                        u = atomjson[k][e][1].href;
                        source = u.substr(0, u.lastIndexOf('/'));
                    }
                    if ( t !== "" && u !== "") {
                        typeahead_source.push({ uri: u, source: source, value: t });
                        break;
                    }
                }
            }
        }
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        return typeahead_source;
    }

});