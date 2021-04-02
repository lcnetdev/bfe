bfe.define('src/lookups/lcshared_suggest2', ['require', 'exports', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    // require('https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js');
  
    /*
        subjecturi propertyuri selected.uri
        selected.uri  bf:label selected.value
    */
    var bfelog = require('src/bfelogging');
    
    var addLiteralOption = function (data, query){
      data.push({uri: "_:b1", id: "literal", value: query, display: query + "(Literal Value)"});
    };
    
    exports.processSuggestions = function (suggestions, query) {
        bfelog.addMsg(new Error(), 'DEBUG','Processing suggestions: ', suggestions);
        var typeahead_source = [];
        if (suggestions.count !== undefined) {
            for (var s = 0; s < suggestions.hits.length; s++) {
                var hit = suggestions.hits[s];
                
                var l = hit.suggestLabel;
                var al = hit.aLabel;
                var u = hit.uri;
                var id = u.replace(/.+\/(.+)/, '$1');
                var d = l + ' [' + id + ']';
                if (id.length==32){
                    d = l;
                }
                li = al;
              
                // What the heck is this?
                /*
                if (suggestions.length === 5) {
                    var i = suggestions[4][s];
                    var li = l + ' (' + i + ')';
                } else {
                    li = l;
                }
                */
  
                typeahead_source.push({
                    uri: u,
                    id: id,
                    value: li,
                    display: d
                });
            }
        }
    
        if (typeahead_source.length === 0) {
            typeahead_source[0] = {
                uri: '',
                display: '[No suggestions found for ' + query + '.]'
            };
        }
        addLiteralOption(typeahead_source, query);
        return typeahead_source;
    };
    
    exports.suggest2Query = function (query, cache, scheme, processSync, processAsync, formobject) {
        bfelog.addMsg(new Error(), 'DEBUG','Suggest2 query');
        bfelog.addMsg(new Error(), 'DEBUG','q is ' + query);

        var lcshared = require('src/lookups/lcshared');
        if (!_.isEmpty(formobject)){
            var triples = formobject.store;
    
            var type = '';
            var hits = _.where(triples, {
                'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
            });
            if (hits[0] !== undefined) {
                type = hits[0].o;
            }
    
            var rdftype = lcshared.rdfType(type);
            var q = '';
            if (scheme !== '' && rdftype !== '') {
                q = 'cs:' + scheme + ' AND ' + rdftype;
            } else if (rdftype !== '') {
                q = rdftype;
            } else if (scheme !== '') {
                q = 'cs:' + scheme;
            }

            if (q !== '') {
                q = q + ' AND ' + query.replace('?', '').normalize() + '*'; 
            } else {
                q = query.normalize();
            }
        } else {
            q = query.normalize();
        }

        if (cache[q]) {
            processSync(cache[q]);
            return;
        }
        if (typeof this.searching !== 'undefined') {
            clearTimeout(this.searching);
            processSync([]);
        }
        this.searching = setTimeout(function () {
            if (query === '' || query === ' ') {
            // If the query is empty or a simple space.
                var u = scheme + '/suggest2/?count=50&q=';
                u = u.replace(/^(http:)/,"");
                $.ajax({
                    url: encodeURI(u),
                    dataType: 'jsonp',
                    success: function (data) {
                        var parsedlist = processSuggestions(data, '');
                        return processAsync(parsedlist);
                    }
                });
            } else if (query.length > 2 && query.substr(0, 1) == '?') {
                // If the search string begins with a question mark.
                u = 'http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=' + q;
                u = u.replace(/^(http:)/,"");
                $.ajax({
                    url: encodeURI(u),
                    dataType: 'jsonp',
                    success: function (data) {
                        var parsedlist = exports.processATOM(data, query);
                        cache[q] = parsedlist;
                        return processAsync(parsedlist);
                    }
                });
            } else if (
                query.length >= 2 && 
                ( query.match(/^[A-Za-z\s]{0,3}[0-9]{3,}$/) || query.match(/^[A-Za-z]{0,2}[0-9]{2,}$/) )
                ) {
                if ( query.match(/^[0-9]{3,}$/) || query.match(/^[A-Za-z]{0,2}[0-9]{2,}$/) ) {
                    u = scheme + '/suggest/lccn/' + query.replace(/\s/g,'');
                } else {
                    u = scheme + '/suggest/token/' + query.replace(/\s/g,'');
                }
                u = u.replace(/^(http:)/,"");
                $.ajax({
                    url: encodeURI(u),
                    dataType: 'json',
                    success: function (data) {
                        var parsedlist = processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return processAsync(parsedlist);
                    },
                    fail: function (err){
                        bfelog.addMsg(new Error(), 'INFO',err);
                    }
                });
            } else if (query.length >= 1) {
                u = scheme + '/suggest2/?count=50&q=' + query;
                u = u.replace(/^(http:)/,"");
                $.ajax({
                    url: encodeURI(u),
                    dataType: 'jsonp',
                    success: function (data) {
                        var parsedlist = exports.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return processAsync(parsedlist);
                    }
                });
            }
        }, 300); // 300 ms
    }
    
});