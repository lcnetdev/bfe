define(function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-2";

    exports.source = function(query, process) {

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/iso639-2/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/iso639-2");
                console.log(u);
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processATOM(data, query);
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
    }

});
