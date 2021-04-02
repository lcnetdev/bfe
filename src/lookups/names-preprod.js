bfe.define('src/lookups/lcnames-preprod', ['require', 'exports', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var bfelog = require('src/bfelogging');
    var cache = {};
  
    // This var is required because it is used as an identifier.
    exports.scheme = 'http://preprod.id.loc.gov/authorities/names';
  
    exports.source = function (query, processSync, processAsync, formobject) {
        var triples = formobject.store;
  
        var type = '';
        var hits = _.where(triples, {
            's': formobject.defaulturi,
            'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        });
        if (hits[0] !== undefined) {
            type = hits[0].o;
        }
    
        var scheme = exports.scheme;
  
        var rdftype = lcshared.rdfType(type);
  
        var q = '';
        if (scheme !== '' && rdftype !== '') {
            q = '&cs:' + scheme + '&rdftype=' + rdftype;
        } else if (rdftype !== '') {
            q = '&rdftype=' + rdftype;
        } else if (scheme !== '') {
            q = '&cs:' + scheme;
        }
        if (q !== '') {
            q = '(' + query + ' OR ' + query + '* OR *' + query + '*)' + q;
        } else {
            q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
        }
        // console.log('q is ' + q);
        q = encodeURI(q);
  
        if (cache[q]) {
            processSync(cache[q]);
            return;
        }
        if (typeof this.searching !== 'undefined') {
            clearTimeout(this.searching);
            processSync([]);
        }
      
        var schemeBaseURL = exports.scheme.split('/').slice(0,3).join('/');
  
        this.searching = setTimeout(function () {
            if (query.length > 2 && query.substr(0, 1) != '?' && !query.match(/^[Nn][A-z\s]{0,1}\d/)) {
                var suggestquery = query.normalize();
                bfelog.addMsg(new Error(), 'INFO',query);
                if (rdftype !== '') { suggestquery += '&rdftype=' + rdftype.replace('rdftype:', ''); }
  
                var u = exports.scheme + '/suggest/?q=' + suggestquery + '&count=50';
                u = u.replace(/^(http:)/,"");
                $.ajax({
                    url: u,
                    dataType: 'jsonp',
                    success: function (data) {
                        var parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return processAsync(parsedlist);
                    }
                });
            } else if (query.length > 2) {
                if (query.match(/^[Nn][A-z\s]{0,1}\d/)){
                    q = query.replace(/\s+/g,'').normalize();
                }          
                u = schemeBaseURL + '/search/?format=jsonp&start=1&count=50&q=' + q.replace('?', '');
                u = u.replace(/^(http:)/,"");
                $.ajax({
                    url: u,
                    dataType: 'jsonp',
                    success: function (data) {
                        var parsedlist = lcshared.processATOM(data, query);
                        cache[q] = parsedlist;
                        return processAsync(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
    };

    exports.getResource = lcshared.getResource;
  });