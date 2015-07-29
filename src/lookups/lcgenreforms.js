define(function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    
    var cache = [];

    exports.scheme = "http://id.loc.gov/authorities/genreForms";

    exports.source = function(query, process) {
        var scheme = "http://id.loc.gov/authorities/genreForms";
        var rdftype = "rdftype:GenreForm";
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + ' AND ' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        if (q !== "") {
            q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
        } else {
            q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
        }
        console.log('q is ' + q);
        q = encodeURI(q);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            console.log("searching defined");
            clearTimeout(this.searching);
            process([]);
        }
                
        this.searching = setTimeout(function() {
            if ( query.length > 2 ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q;
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
    
    /*
    
        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi
        triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
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

});
