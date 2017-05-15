bfe.define('src/lookups/lcnames', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    
    var cache = [];
    
    // This var is required because it is used as an identifier.
    exports.scheme = "http://id.loc.gov/authorities/names";

    exports.source = function(query, process, formobject) {
        
        //console.log(JSON.stringify(formobject.store));
        
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/authorities/names";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
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
            //rdftype = "rdftype:FamilyName";
            rdftype = "rdftype:PersonalName";
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
            if ( query.length > 2 && query.substr(0,1)!='?') {
                suggestquery = query;
                if (rdftype !== "")
                    suggestquery += "&rdftype=" + rdftype.replace("rdftype:", "")

                u = exports.scheme + "/suggest/?q=" + suggestquery + "&count=50";

                //u = exports.scheme + "/suggest/?q=" + query;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if (query.length > 2) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=" + q.replace("?", "");
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
    exports.getResource = lcshared.getResourceWithAAP;    

});
bfe.define('src/lookups/lcshared', ['require', 'exports', 'module' ], function(require, exports, module) {

    require('https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js');

    /*
        subjecturi propertyuri selected.uri
        selected.uri  bf:label selected.value
    */
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];

        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        selected.uri = selected.uri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);

        triple = {};
        triple.s = selected.uri;
        triple.p = "http://bibframe.org/vocab/label";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);

        return process(triples);
     }
    
    exports.getResourceWithAAP = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi;
        triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi;
        triple.p = "http://bibframe.org/vocab/label";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);

        process(triples);    
    }
    
    exports.getResourceLabelLookup = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
          //add label
        $.ajax({
            url: selected.uri + ".jsonp",
            dataType: "jsonp",
            success: function (data) {
                data.forEach(function(resource){
                    if (resource["@id"] === selected.uri){
                                var label = {};
                                label.s = selected.uri;
                                label.otype = "literal";
                                label.p = "http://bibframe.org/vocab/label";
                                label.o = resource["http://www.loc.gov/standards/mads/rdf/v1#authoritativeLabel"][0]["@value"];
                                triples.push(label);
                                return process(triples);
                    }
                });
            }
        });
    }

    exports.processJSONLDSuggestions = function (suggestions,query,scheme) {
        var typeahead_source = [];
        if (suggestions['@graph'] !== undefined) {
            for (var s = 0; s < suggestions['@graph'].length; s++) {
                if(suggestions['@graph'][s]['skos:inScheme'] !==undefined){
                    if (suggestions['@graph'][s]['@type'] === 'skos:Concept' && suggestions['@graph'][s]['skos:inScheme']['@id'] === scheme){
                        if (suggestions['@graph'][s]['skos:prefLabel'].length !== undefined){
                            for (var i = 0; i < suggestions['@graph'][s]['skos:prefLabel'].length; i++) {
                                if (suggestions['@graph'][s]['skos:prefLabel'][i]['@language'] === "en") {
                                    var l = suggestions['@graph'][s]['skos:prefLabel'][i]['@value'];
                                    break;
                                }
                            }
                        } else {
                            var l = suggestions['@graph'][s]['skos:prefLabel']['@value'];
                        }
                        var u = suggestions['@graph'][s]['@id'];
                        typeahead_source.push({
                            uri: u,
                            value: l
                        });
                    }
                }
            }
        }
        if (typeahead_source.length === 0) {
            typeahead_source[0] = {
                uri: "",
                value: "[No suggestions found for " + query + ".]"
            };
        }
            return typeahead_source;
    }
    
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
        //$("#dropdown-footer").text('Total Results:' + suggestions.length);
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

    exports.simpleQuery=function(query, cache, scheme, process) {
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
            
            if ( query === '' || query === ' ') {
                u = scheme + "/suggest/?count=100&q=";
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = exports.processSuggestions(data, "");
                        return process(parsedlist);
                    }
                });
            } else if ( query.length >= 1 ) {
                u = scheme + "/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = exports.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms

    }

});
bfe.define('src/lookups/lcsubjects', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
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
            //rdftype = "rdftype:FamilyName";
            rdftype="rdftype:PersonalName";
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
            if ( query.length > 2 && query.substr(0,1)!="?") {
                suggestquery = query;
                if (rdftype !== "")
                    suggestquery += "&rdftype=" + rdftype.replace("rdftype:", "")

                u = exports.scheme + "/suggest/?q=" + suggestquery;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if (query.length > 2) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q.replace("?", "");
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
    exports.getResource = lcshared.getResourceWithAAP;

});
bfe.define('src/lookups/lcgenreforms', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
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
        //lcgft
        this.searching = setTimeout(function() {
            if ( query.length > 2 ) {
                suggestquery = query;
                if (rdftype !== "")
                    suggestquery += "&rdftype=" + rdftype.replace("rdftype:", "")

                u = scheme + "/suggest/?q=" + suggestquery;

                //u = "http://id.loc.gov/authorities/genreForms/suggest/?q=" + query;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }

                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
    }
    
    exports.getResource = lcshared.getResourceWithAAP;

});
bfe.define('src/lookups/lcworks', ['require', 'exports', 'module' ], function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/resources/works";

    exports.source = function(query, process, formobject) {
        
        var pageobj =  $('#'+formobject.pageid);
        var page = pageobj.val() != undefined ? parseInt(pageobj.val()) : 1;
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
        //q = query + " " + q;
        q = q + "&q=scheme:/bibframe&q="+query;
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
        
        this.searching = setTimeout(function(formobject) {
            if ( query.length > 2 ) {
                //u = "http://id.loc.gov/ml38281/search/?format=jsonp&start="+page+"&count=50&q=" + q;
                u = "http://id.loc.gov/ml38281/search/?format=jsonp&start=1&count=50&q="+q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        pageobj.val(page+10);
                        //console.log(data);
                        //alert(data);
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        // only search if stop typing for 300ms aka fast typers
                        //console.log(parsedlist);
                        //process(parsedlist);
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
        triple.s = subjecturi;
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
        
        triple = {};
        triple.s = selected.uri;
        triple.p = "http://bibframe.org/vocab/label";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);

//        process(triples);

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
                                    } else {
                                        triple.o = o;
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

});//bfe.define("lcnames", [], function() {
bfe.define('src/lookups/lcinstances', ['require', 'exports', 'module' ], function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/resources/instances";

    exports.source = function(query, process, formobject) {

        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/ml38281/resources/instances";
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
        //q = q + " " + query
        q = q + "&q=scheme:/bibframe&q="+query;
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
                console.log(triples);
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
bfe.define('src/lookups/lcorganizations', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/organizations";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }
    
    exports.getResource = lcshared.getResourceWithAAP;

});
bfe.define('src/lookups/lccountries', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/countries";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcgacs', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/geographicAreas";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lclanguages', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/languages";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcidentifiers', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/identifiers";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lctargetaudiences', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/targetAudiences";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;
});
bfe.define('src/lookups/iso6391', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-1";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/iso6392', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-2";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/iso6395', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-5";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdacontenttypes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/contentTypes";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdamediatypes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/mediaTypes";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdacarriers', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/carriers";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }
    
    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdamodeissue', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/ml38281/vocabulary/rda/ModeIssue";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    
//"[{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1004","value":"integrating resource"},{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1002","value":"multipart monograph"},{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1003","value":"serial"},{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1001","value":"single unit"}]"
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        selected.uri = selected.uri.replace("gov/", "gov/ml38281/");
        return lcshared.getResource(subjecturi,propertyuri,selected,process);
    }

});
bfe.define('src/lookups/rdamusnotation', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];

    exports.scheme = "http://id.loc.gov/ml38281/vocabulary/rda/MusNotation";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        selected.uri = selected.uri.replace("gov/", "gov/ml38281/");
        return lcshared.getResource(subjecturi, propertyuri, selected, process);
    }

});
bfe.define('src/lookups/rdaformatnotemus', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    exports.scheme = "http://rdaregistry.info/termList/FormatNoteMus";

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
           if ( query === '' || query === ' ') {
                u = exports.scheme + ".json-ld";
                $.ajax({
                    url: u,
                    dataType: "json",
                    success: function (data) {
                        parsedlist = lcshared.processJSONLDSuggestions(data,query,exports.scheme);
                        return process(parsedlist);
                    }
                });
             } else if (query.length > 1) {
                u = exports.scheme + ".json-ld";
                console.log(u);
                $.ajax({
                    url: u,
                    dataType: "json",
                    success: function (data) {
                        parsedlist = lcshared.processJSONLDSuggestions(data,query,exports.scheme);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
    };

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcrelators', ['require', 'exports', 'module' , 'src/lookups/lcshared'],function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    exports.scheme = "http://id.loc.gov/vocabulary/relators";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcperformanceMediums', ['require', 'exports', 'module' , 'src/lookups/lcshared'],function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    exports.scheme = "http://id.loc.gov/authorities/performanceMediums";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
