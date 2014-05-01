//define("lcnames", [], function() {
define(function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/resources/works";

    exports.source = function(query, process, formobject) {
        
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/resources/works";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                scheme = hits[0].o;
            }
        //console.log("scheme is " + scheme);
        
        //var rdftype = "rdftype:Instance";
        var rdftype = "";
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + '&q=' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        q = q + " " + query
        //console.log('q is ' + q);
        q = encodeURI(q);
        
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
                u = "http://id.loc.gov/ml38281/search/?format=jsonp&start=1&count=10&q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        //console.log(data);
                        //alert(data);
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        // only search if stop typing for 300ms aka fast typers
                        //console.log(parsedlist);
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
        //return searching;
        
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
        
        /*
        If you wanted/needed to make another call.
        */
        var u = selected.uri.replace(/gov\/resources/, 'gov/ml38281/resources') + ".bibframe_raw.jsonp";
        var primaryuri = "<" + selected.uri + ">";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                data.forEach(function(resource){
                    var s = resource["@id"];
                    for (var p in resource) {
                        if (p !== "@id") {
                            resource[p].forEach(function(o) {
                                //if ( s !== selected.uri && p !== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                                    var triple = {};
                                    triple.s = s;
                                    triple.p = p;
                                    if (o["@id"] !== undefined) {
                                        triple.o = o["@id"];
                                        triple.otype = "uri";
                                    } else if (o["@value"] !== undefined) {
                                        triple.o = o["@value"];
                                        triple.otype = "literal";
                                        if (o["@language"] !== undefined) {
                                            triple.olang = o["@language"];
                                        }
                                    }
                                    triples.push(triple);
                                //}
                            });
                        }
                    }
                });
                //console.log(triples);
                process(triples);
            }
        });
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