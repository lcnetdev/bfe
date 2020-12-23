bfe.define('src/lookups/madsrdfTypes', ['require', 'exports', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    //var bfelog = require('src/bfelogging');
    
    var listitems = [];

    // This var is required because it is used as an identifier.
    exports.scheme = 'http://id.loc.gov/vocabulary/madsrdfTypes';
  
    exports.source = function (query, processSync, processAsync) {
        // console.log(JSON.stringify(formobject.store));

        var scheme = 'http://id.loc.gov/vocabulary/madsrdfTypes';
        
        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(query, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        if (listitems.length > 0) {
            var matches = lcshared.listitemsMatch(listitems, substrRegex);
            processSync(matches);
            return;
        } else {
            setTimeout(
                function () {
                    var url = 'https://id.loc.gov/ontologies/madsrdf/v1.json';
                    $.ajax({
                        url: url,
                        dataType: 'json',
                        success: function (data) {
                            for (var d of data) {
                                if (d["@type"] !== undefined) {
                                    if (d["@type"].includes("http://www.w3.org/2002/07/owl#Class")) {
                                        if (d["http://www.w3.org/2000/01/rdf-schema#label"] !== undefined) {
                                            var u = d["@id"]
                                            var s = u.substr(u.lastIndexOf('#') + 1);
                                            var v = d["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
                                            var d = v + ' (madsrdf:' + s + ')';
                                            var item = {
                                                uri: u,
                                                source: s,
                                                value: v, 
                                                display: d
                                            }
                                            listitems.push(item);
                                        }
                                    }
                                }
                            }
                            listitems.sort(lcshared.sortListItems);
                            var matches = lcshared.listitemsMatch(listitems, substrRegex);
                            return processAsync(matches);
                        }
                    });
                }, 
                300
            ); // 300 ms
        }
    };
  
    exports.getResource = function (subjecturi, property, selected, process) {
        // Unfortunately, we do not know the type at this stage.
      
        var triples = [];

        var triple = {};
        triple.s = subjecturi;
        triple.p = property.propertyURI;
        triple.o = selected.uri;
        triple.otype = 'uri';
        triples.push(triple);

        return process(triples, property);
    };
  });