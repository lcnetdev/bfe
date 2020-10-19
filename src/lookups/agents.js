bfe.define('src/lookups/agents', ['require', 'exports', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    //var bfelog = require('src/bfelogging');
    var cache = {};
  
    // This var is required because it is used as an identifier.
    exports.scheme = 'http://id.loc.gov/rwo/agents';
  
    exports.source = function (query, processSync, processAsync) {
      // console.log(JSON.stringify(formobject.store));

      var scheme = 'http://id.loc.gov/authorities/names';
      var rdftype = '(rdftype:PersonalName OR rdftype:CorporateName OR rdftype:ConferenceName)';
  
      var q = 'cs:' + scheme + ' AND ' + rdftype;
      q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';

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
  
      this.searching = setTimeout(function () {
        if (query.length > 2) {
          //if (query.match(/^[Nn][A-z\s]{0,1}\d/)){
            //q = query.replace(/\s+/g,'').normalize();
          //}          
          var u = 'http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=' + q;
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
  
    exports.getResource = function (subjecturi, property, selected, process) {
      // Unfortunately, we do not know the type at this stage.
      
      var triples = [];
      
      var agenturi = selected.uri.replace('authorities/names', 'rwo/agents');
  
      var triple = {};
      triple.s = subjecturi;
      triple.p = property.propertyURI;
      triple.o = agenturi;
      triple.otype = 'uri';
      triples.push(triple);
  
      triple = {};
      triple.s = agenturi;
      triple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      triple.o = selected.value;
      triple.otype = 'literal';
      triples.push(triple);
      
      triple = {};
      triple.s = agenturi;
      triple.p = 'http://www.loc.gov/mads/rdf/v1#isIdentifiedByAuthority';
      triple.o = selected.uri;
      triple.otype = 'uri';
      triples.push(triple);
  
      return process(triples, property);
    };
  });