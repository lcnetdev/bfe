bfe.define('src/lookups/lcnames', ['require', 'exports', 'src/lookups/lcshared', 'src/lookups/lcshared_suggest2', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest2 = require('src/lookups/lcshared_suggest2');
    var bfelog = require('src/bfelogging');
    var cache = {};
  
    // This var is required because it is used as an identifier.
    exports.scheme = 'http://id.loc.gov/authorities/names';
  
    exports.source = function (query, processSync, processAsync, formobject) {
      // console.log(JSON.stringify(formobject.store));
  
      var triples = formobject.store;
  
      var type = '';
      var hits = _.where(triples, {
        's': formobject.defaulturi,
        'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
      });
      if (hits[0] !== undefined) {
        type = hits[0].o;
      }
      // console.log("type is " + type);
  
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
  
      this.searching = setTimeout(function () {
        if (query.length > 2 && query.substr(0, 1) != '?' && !query.match(/^[Nn][A-z\s]{0,1}\d/)) {
          var suggestquery = query.normalize();
          bfelog.addMsg(new Error(), 'INFO',query);
          if (rdftype !== '') { suggestquery += '&rdftype=' + rdftype.replace('rdftype:', ''); }
  
          var u = exports.scheme + '/suggest2/?q=' + suggestquery + '&count=50';
          u = u.replace(/^(http:)/,"");
          $.ajax({
            url: u,
            dataType: 'jsonp',
            success: function (data) {
              var parsedlist = suggest2.processSuggestions(data, query);
              cache[q] = parsedlist;
              return processAsync(parsedlist);
            }
          });
        } else if (query.length > 2) {
          if (query.match(/^[Nn][A-z\s]{0,1}\d/)){
            q = query.replace(/\s+/g,'').normalize();
          }          
          u = 'http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=' + q.replace('?', '');
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
  
    /*
  
          subjecturi hasAuthority selected.uri
          subjecturi  bf:label selected.value
      */
    exports.getResource = lcshared.getResource;
  });

  bfe.define('src/lookups/lcsubjects', ['require', 'exports', 'src/lookups/lcshared', 'src/lookups/lcshared_suggest2', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest2 = require('src/lookups/lcshared_suggest2');
    var bfelog = require('src/bfelogging');
    var cache = [];
  
    exports.scheme = 'http://id.loc.gov/authorities/subjects';
  
    exports.source = function (query, processSync, processAsync, formobject) {
      // console.log(JSON.stringify(formobject.store));
  
      var triples = formobject.store;
  
      var type = '';
      var hits = _.where(triples, {
        's': formobject.defaulturi,
        'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
      });
      if (hits[0] !== undefined) {
        type = hits[0].o;
      }
      // console.log("type is " + type);
  
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
        q = query.normalize() + '*' + q;
      } else {
        q = query.normalize();
      }
      // console.log('q is ' + q);
      //q = encodeURI(q);
  
      if (cache[q]) {
        processSync(cache[q]);
        return;
      }
      if (typeof this.searching !== 'undefined') {
        clearTimeout(this.searching);
        processSync([]);
      }
  
      this.searching = setTimeout(function () {
        if (query.length > 2 && query.substr(0, 1) != '?' && !query.match(/[Ss][A-z\s]{0,2}\d/)) {
          var suggestquery = query.normalize();
          if (rdftype !== '') { suggestquery += '&rdftype=' + rdftype.replace('rdftype:', ''); }
  
          var u = exports.scheme + '/suggest2/?count=20&q=' + suggestquery;
          u = u.replace(/^(http:)/,"");
          $.ajax({
            url: encodeURI(u),
            dataType: 'jsonp',
            success: function (data) {
              var parsedlist = suggest2.processSuggestions(data, query);
              cache[q] = parsedlist;
              return processAsync(parsedlist);
            }
          });
        } else if (query.length > 2) {
          if (query.match(/^[Ss][A-z\s]{0,2}\d/)){
            q = query.replace(/\s+/g,'').normalize();
          }      
          u = 'https://id.loc.gov/search/?format=jsonp&start=1&count=50&q=' + q;
          u = u.replace(/^(http:)/,"");
          $.ajax({
            url: encodeURI(u),
            dataType: 'jsonp',
            success: function (data) {
              var parsedlist = lcshared.processATOM(data, query);
              cache[q] = parsedlist;
              return processAsync(parsedlist);
            },
            fail: function (err){
              bfelog.addMsg(new Error(), 'INFO',err);
            }
          });
        } else {
          return [];
        }
      }, 300); // 300 ms
    };
  
    /*
  
          subjecturi hasAuthority selected.uri
          subjecturi  bf:label selected.value
      */
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/lcgenreforms', ['require', 'exports', 'src/lookups/lcshared_suggest2', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest2 = require('src/lookups/lcshared_suggest2');
    var bfelog = require('src/bfelogging');
    var cache = [];
  
    exports.scheme = 'http://id.loc.gov/authorities/genreForms';
  
    exports.source = function (query, processSync, processAsync, formobject) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest2.suggest2Query(query, cache, exports.scheme, processSync, processAsync, formobject);
    };
  
    exports.getResource = lcshared.getResource;
  });
  
  bfe.define('src/lookups/rdaformatnotemus', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/FormatNoteMus';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/rdamediatype', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/RDAMediaType';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/rdamodeissue', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/ModeIssue';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/rdacarriertype', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/RDACarrierType';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/rdacontenttype', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/RDAContentType';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });

  bfe.define('src/lookups/rdafrequency', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/frequency';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync);
    };
  
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/rdaaspectration', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/AspectRatio';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });
  bfe.define('src/lookups/rdageneration', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'http://rdaregistry.info/termList/RDAGeneration';
  
    exports.source = function (query, processSync, processAsync) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "RDA", processSync, processAsync, null);
    };
  
    exports.getResource = lcshared.getResource;
  });

  bfe.define('src/lookups/qagetty', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = 'https://lookup.ld4l.org/authorities/search/linked_data/getty_aat_ld4l_cache';
  
    exports.source = function (query, processSync, processAsync, formobject) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "QA", processSync, processAsync, formobject);
    };
  
    exports.getResource = lcshared.getResource;
  });

  bfe.define('src/lookups/notetype', ['require', 'exports', 'src/lookups/lcshared_suggest1', 'src/lookups/lcshared', 'src/bfelogging'], function (require, exports) {
    var lcshared = require('src/lookups/lcshared');
    var suggest1 = require('src/lookups/lcshared_suggest1');
    var bfelog = require('src/bfelogging');
    var cache = [];
    exports.scheme = '/api/listconfigs/?where=index.resourceType:noteTypes';
  
    exports.source = function (query, processSync, processAsync, formobject) {
      bfelog.addMsg(new Error(), 'INFO', query);
      return suggest1.suggest1Query(query, cache, exports.scheme, "NoteType", processSync, processAsync, formobject);
    };
  
    exports.getResource = lcshared.getResource;
  });
