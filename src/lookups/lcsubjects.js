//define("lcnames", [], function() {
define(function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var store = [];
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/authorities/subjects";

    exports.source = function(formobject, query, process) {
        console.log(JSON.stringify(formobject.store));
        
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                type = hits[0].o;
            }
        console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/authorities/subjects";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                scheme = hits[0].o;
            }
        console.log("scheme is " + scheme);
        
        var rdftype = "";
        if ( type == "http://bibframe.org/vocab/Person") {
            rdftype = "rdftype:PersonalName";
        } else if ( type == "http://bibframe.org/vocab/Topic") {
            rdftype = "(rdftype:Topic OR rdftype:ComplexSubject)";
        } else if ( type == "http://bibframe.org/vocab/Place") {
            rdftype = "rdftype:Geographic";
        } else if ( type == "http://bibframe.org/vocab/Organization") {
            rdftype = "rdftype:CorporateName";
        } else if ( type == "http://bibframe.org/vocab/Family") {
            rdftype = "rdftype:FamilyName";
        } else if ( type == "http://bibframe.org/vocab/Meeting") {
            rdftype = "rdftype:ConferenceName";
        } else if ( type == "http://bibframe.org/vocab/Jurisdiction") {
            rdftype = "rdftype:CorporateName";
        } else if ( type == "http://bibframe.org/vocab/GenreForm") {
            rdftype = "rdftype:GenreForm";
        }
                
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
                //alert(q)
                //u = "http://localhost:8281/search/?format=jsonp&start=1&count=10&q=" + q;
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q;
                //alert(u);
                /*
                list = $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        //console.log(data);
                        //alert(data);
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        // only search if stop typing for 300ms aka fast typers
                        console.log(parsedlist);
                        //return process(['John Smith','Jane Smith']);
                        return process(parsedlist);
                    }
                    //jsonpCallback: "processATOM"
                });
                return list;
                */
                console.log("lcsubjects ajax call");
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        console.log(data);
                        //alert(data);
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        // only search if stop typing for 300ms aka fast typers
                        console.log(parsedlist);
                        //console.log(this);
                        //return process(['John Smith','Jane Smith']);
                        return process(parsedlist);
                    }
                    //jsonpCallback: "processATOM"
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
    
    function processATOM(atomjson, query) {
        var typeahead_source = [];
        c = 0;
        for (var k in atomjson) {
            if (atomjson[k][0] == "atom:entry") {
                t = "";
                u = "";
                for (var e in atomjson[k] ) {
                    //alert(atomjson[k][e]);
                    if (atomjson[k][e][0] == "atom:title") {
                        //alert(atomjson[k][e][2]);
                        t = atomjson[k][e][2];
                    }
                    if (atomjson[k][e][0] == "atom:link") {
                        //alert(atomjson[k][e][2]);
                        u = atomjson[k][e][1].href;
                    }
                    if ( t !== "" && u !== "") {
                        store[t] = {}
                        store[t].label = t;
                        store[t].uri = u;
                        typeahead_source[c] = { uri: u, value: t };
                        c++;
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