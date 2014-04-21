define(function(require, exports, module) {

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/languages";

    exports.source = function(formobject, query, process) {
        console.log(JSON.stringify(formobject.store));
        
        var triples = formobject.store;

        console.log('q is ' + query);
        q = encodeURI(query);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }
        this.searching = setTimeout(function() {
            if ( query.length > 2 ) {
                u = "http://id.loc.gov/vocabulary/languages/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = processSuggestions(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "*" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/languages");
                console.log(u);
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
    }
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
        /*
        If you wanted/needed to make another call.
        */
        /*
        var u = selected.uri + ".jsonp";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                var triple = {};
                //triple.guid = guid();
                triple.s = subjecturi
                triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
                triple.o = selected.value;
                triple.otype = "literal";
                triple.olang = "en";
                triples.push(triple);
                process(triples);
            }
        });
        */
    
    }
    
    function processSuggestions(suggestions, query) {
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
    
    function processATOM(atomjson, query) {
        var typeahead_source = [];
        for (var k in atomjson) {
            if (atomjson[k][0] == "atom:entry") {
                var t = "";
                var u = "";
                var source = "";
                for (var e in atomjson[k] ) {
                    //alert(atomjson[k][e]);
                    if (atomjson[k][e][0] == "atom:title") {
                        //alert(atomjson[k][e][2]);
                        t = atomjson[k][e][2];
                    }
                    if (atomjson[k][e][0] == "atom:link") {
                        //alert(atomjson[k][e][2]);
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
        //alert(suggestions);
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        return typeahead_source;
    }

});