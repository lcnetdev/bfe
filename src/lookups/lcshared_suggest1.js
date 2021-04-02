bfe.define('src/lookups/lcshared_suggest1', ['require', 'exports', 'src/bfelogging'], function (require, exports) {
    // require('https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js');
  
    /*
          subjecturi propertyuri selected.uri
          selected.uri  bf:label selected.value
      */
    var bfelog = require('src/bfelogging');
    
    var addLiteralOption = function (data, query){
      data.push({uri: "_:b1", id: "literal", value: query, display: query + "(Literal Value)"});
    };
  
    processJSONLDSuggestions = function (suggestions, query, scheme) {
      var typeahead_source = [];
      if (suggestions['@graph'] !== undefined) {
        for (var s = 0; s < suggestions['@graph'].length; s++) {
          if (suggestions['@graph'][s].inScheme !== undefined) {
            if (suggestions['@graph'][s]['@type'] === 'Concept' && suggestions['@graph'][s].inScheme === scheme) {
              if (suggestions['@graph'][s].prefLabel.en.length !== undefined) {
                var l = suggestions['@graph'][s].prefLabel.en;
                // break;
                // var l = suggestions['@graph'][s]['prefLabel']['@value'];
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
          uri: '',
          value: '[No suggestions found for ' + query + '.]'
        };
      }
      addLiteralOption(typeahead_source, query);
      return typeahead_source;
    };

    processQASuggestions = function (suggestions, query) {
      var typeahead_source = [];
      if (suggestions[1] !== undefined) {
        for (var s = 0; s < suggestions.length; s++) {
          var l = suggestions[s]["label"];
          var u = suggestions[s]["uri"];
          var id = suggestions[s]["id"];
          var d = l + ' (' + id + ')';
  
          typeahead_source.push({
            uri: u,
            id: id,
            value: l,
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

    processNoteTypeSuggestions = function (suggestions, query) {
      var typeahead_source = [];
      var substrMatch = new RegExp('^' + query, 'i');
      if (suggestions[0].json !== undefined) {
        for (var s = 0; s < suggestions[0].json.length; s++) {
          var l = suggestions[0].json[s];
  
          if(substrMatch.test(l) || _.isEmpty(query)){
            typeahead_source.push({
              uri: "",
              id: 'literalLookup',
              value: l,
              display: l
            });
          }
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

    processSuggestions = function (suggestions, query) {
      var typeahead_source = [];
      if (suggestions[1] !== undefined) {
        for (var s = 0; s < suggestions[1].length; s++) {
          var l = suggestions[1][s];
          var u = suggestions[3][s];
          var id = u.replace(/.+\/(.+)/, '$1');
          if (id.length==32){
            var d = l;
          }else{
            d = l + ' (' + id + ')';
          }
          
          if (suggestions.length === 5) {
            var i = suggestions[4][s];
            var li = l + ' (' + i + ')';
          } else {
            li = l;
          }
  
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

    exports.suggest1Query = function (query, cache, scheme, resultType, processSync, processAsync, formobject) {
      bfelog.addMsg(new Error(), 'INFO','q is ' + query);

      if (!_.isEmpty(formobject)){
        var triples = formobject.store;
    
        var type = '';
        var hits = _.where(triples, {
          'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        });
        if (hits[0] !== undefined) {
          type = hits[0].o;
        }
    
        var rdftype = exports.rdfType(type);
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
        if (resultType == "NoteType") {
          u = config.url + "/profile-edit/server/whichrt?uri=" + scheme;
          $.ajax({
            url: encodeURI(u),
            dataType: 'json',
            success: function (data) {
              var parsedlist = processNoteTypeSuggestions(data, query);
              cache[q] = parsedlist;
              return processAsync(parsedlist);
            }
          });
        } else if ((query === '' || query === ' ') && resultType == "ID" && !(scheme.match(/resources\/[works|instances]/) || scheme.match(/authorities/) || scheme.match(/entities/))) {
          var u = scheme + '/suggest/?count=100&q=';
          u = u.replace(/^(http:)/,"");
          $.ajax({
            url: encodeURI(u),
            dataType: 'jsonp',
            success: function (data) {
              var parsedlist = processSuggestions(data, '');
              return processAsync(parsedlist);
            }
          });
        } else if (query.length > 2 && query.substr(0, 1) == '?' && resultType == "ID") {          
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
        } else if (query.length >= 2 && resultType == "ID" && query.match(/^[A-Za-z\s]{0,3}[0-9]{3,}$/)) {
          if (query.match(/^[0-9]{3,}$/)) {
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
        } else if (query.length >= 1 && !query.match(/^[A-Za-z]{0,2}[0-9]{2,}$/)) {
          if (resultType == "ID"){
            u = scheme + '/suggest/?count=50&q=' + query;
            u = u.replace(/^(http:)/,"");
            $.ajax({
              url: encodeURI(u),
              dataType: 'jsonp',
              success: function (data) {
                var parsedlist;

                if (resultType == "QA"){
                  parsedlist = processQASuggestions(data, query);
                } else if (resultType == "RDA") {
                  parsedlist = processJSONLDSuggestions(data, query);
                } else {
                  parsedlist = processSuggestions(data, query);
                }

                cache[q] = parsedlist;
                return processAsync(parsedlist);
              }
            });
          } else {
            u = "/profile-edit/server/whichrt?uri=" + scheme + '?q=' + query;
            $.ajax({
              url: encodeURI(u),
              dataType: 'json',
              success: function (data) {
              var parsedlist;

              if (resultType == "QA"){
                parsedlist = processQASuggestions(data, query);
              } else if (resultType == "RDA") {
                parsedlist = processJSONLDSuggestions(data, query);
              } else {
                return [];
              }
              cache[q] = parsedlist;
              return processAsync(parsedlist);
            }
          });
        }
        }
      }, 300); // 300 ms
    };
  });