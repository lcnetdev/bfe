define(function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    
    var cache = [];

    exports.scheme = "http://id.loc.gov/authorities/subjects";

    exports.source = function(query, process, formobject) {
        //console.log(JSON.stringify(formobject.store));
        
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/authorities/subjects";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                //console.log(hits[0]);
                scheme = hits[0].o;
            }
        //console.log("scheme is " + scheme);
        
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
        
        if (propertyuri.indexOf("http://bibframe.org/vocab/") > -1 || propertyuri.indexOf("http://id.loc.gov/vocabulary/relators/") > -1) {
            triple = {};
            triple.s = subjecturi
            triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
            triple.o = selected.value;
            triple.otype = "literal";
            triple.olang = "en";
            triples.push(triple);
        }
        
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
