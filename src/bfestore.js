bfe.define('src/bfestore', ['require', 'exports'], function (require, exports) {
    exports.n3store = N3.Store();
  
    exports.store = [];
  
    exports.rdfxml2store = function (rdf, loadtemplates, recid, callback) {
      var url = 'http://rdf-translator.appspot.com/convert/xml/json-ld/content';
      var bfestore = this;
  
      $.ajax({
        contentType: 'application/x-www-form-urlencoded',
        type: "POST",
        async: false,
        data: { content: rdf},
        url: url,
        success: function (data) {
          bfestore.store = bfestore.jsonldcompacted2store(data, function(expanded) {
            bfestore.store = [];
            var tempstore = bfestore.jsonld2store(expanded);
            tempstore.forEach(function (nnode) {
              nnode.s = nnode.s.replace(/^_:N/, '_:bnode');
              nnode.s = nnode.s.replace(/bibframe.example.org\/.+#(Work).*/, 'id.loc.gov/resources/works/c' + recid);
              nnode.s = nnode.s.replace(/bibframe.example.org\/.+#Instance.*/, 'id.loc.gov/resources/instances/c' + recid + '0001');
              nnode.s = nnode.s.replace(/bibframe.example.org\/.+#Item.*/, 'id.loc.gov/resources/items/c' + recid + '0001');
              if (nnode.o !== undefined) {
                nnode.o = nnode.o.replace(/^_:N/, '_:bnode');
                nnode.o = nnode.o.replace(/bibframe.example.org\/.+#(Work).*/, 'id.loc.gov/resources/works/c' + recid);
                nnode.o = nnode.o.replace(/bibframe.example.org\/.+#Instance.*/, 'id.loc.gov/resources/instances/c' + recid + '0001');
                nnode.o = nnode.o.replace(/bibframe.example.org\/.+#Item.*/, 'id.loc.gov/resources/items/c' + recid + '0001');
              } 
              bfeditor.bfelog.addMsg(new Error(), "INFO", nnode);
            });
            callback(loadtemplates);
          });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
          bfeditor.bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + url);
          bfeditor.bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
        }
      });
    }
  
    exports.addTriple = function (triple) {
      exports.store.push(triple);
      if (triple.rtid !== undefined) { exports.n3store.addTriple(triple.s, triple.p, triple.o, triple.rtID); } else { exports.n3store.addTriple(triple.s, triple.p, triple.o); }
    };
  
    exports.storeDedup = function () {
      exports.store = _.uniq(exports.store, function (t) {
        if (t.olang !== undefined) {
          return t.s + t.p + t.o + t.otype + t.olang;
        } else if (t.odatatype !== undefined) {
          return t.s + t.p + t.o + t.otype + t.odatatype;
        } else if (t.rtID !== undefined) {
          return t.s + t.p + t.o + t.otype + t.rtID + t.guid;
        } else {
          return t.s + t.p + t.o + t.otype;
        }
      });
      return exports.store;
    };
  
    exports.store2rdfxml = function (jsonld, callback) {
      exports.store2jsonldnormalized(jsonld, function (expanded) {
        /*$.ajax({
          url: config.url + '/profile-edit/server/n3/rdfxml',
          type: 'POST',
          data: JSON.stringify(expanded),
          processData: false,
          contentType: 'application/json',
          success: function (rdfxml) {
            data = new XMLSerializer().serializeToString(rdfxml);
            callback(data);
          },
          error: function (XMLHttpRequest, status, err) {
            console.log(err);
          }
        });*/
        jsonld.toRDF(expanded, {
          format: 'application/nquads'
        }, function(err, nquads) {
          //json2turtle(nquads, callback);
          var parser = N3.Parser();
          var turtlestore = N3.Store();
          parser.parse(nquads, function(error, triple, theprefixes) {
              if (triple) {
                  turtlestore.addTriple(triple);
              } else {
                  turtlestore.addPrefixes(theprefixes);                
                  var turtleWriter = N3.Writer({
                      prefixes: {
                          bf: 'http://id.loc.gov/ontologies/bibframe/',
                          bflc: 'http://id.loc.gov/ontologies/bflc/',
                          madsrdf: "http://www.loc.gov/mads/rdf/v1#",
                          pmo: 'http://performedmusicontology.org/ontology/',
                          rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                          rdfs: "http://www.w3.org/2000/01/rdf-schema#",
                          xsd: "http://www.w3.org/2001/XMLSchema#"
                      }
                  });
                  turtleWriter.addTriples(turtlestore.getTriples(null, null, null));
                  //turtleWriter.addTriples(exports.n3store.getTriples(null, null, null));
                  turtleWriter.end(function(error, result) {                    
                  var input = {};
                  input.n3 = result;
                  $.ajax({
                      url: config.url + "/profile-edit/server/n3/rdfxml",
                      type: "POST",
                      data: JSON.stringify(input),
                      processData: false,
                      contentType: "application/json",
                      success: function(rdfxml) {
                          var data = new XMLSerializer().serializeToString(rdfxml);
                          $("#rdfxml .panel-body pre").text(data);
                      },
                      error: function(XMLHttpRequest, status, err) {
                        bfeditor.bfelog.addMsg(new Error(), 'ERROR', err);
                      }
                  });
                });
              }
            });
        });  
      });
      callback;
    };
  
    exports.n32store = function (n3, graph, tempstore, callback) {
      var parser = N3.Parser();
      var triples = parser.parse(n3);
      var writer = N3.Writer({
        format: 'N-Quads'
      });
      var store = N3.Store(triples);
      // writer.addTriples(store.getTriples(null, null, null, null));
      store.getTriples(null, null, null).forEach(function (triple) {
        writer.addTriple(triple.subject.replace('_bnode', ''), triple.predicate, triple.object.replace('_bnode', ''), graph);
      });
      // writer.addTriple("<http://one.example/subject1> <http://one.example/predicate1> <http://one.example/object1> <http://example.org/graph3>");
      writer.end(function (error, nquads) {
        jsonld.fromRDF(nquads, {
          format: 'application/nquads'
        }, function (err, result) {
          callback(exports.jsonld2store(result[0]['@graph']));
        });
      });
    };
    //
    //    exports.nquads2jsonld = function(nquads){
    //	jsonld.fromRDF(nquads, {format:'application/nquads'}, function(err, data) {
    //	 	try {
    //			return exports.jsonld2store(data);
    //		} catch (err){
    //			console.log(err);
    //		}
    //        });
    //    }
  
    exports.jsonld2store = function (jsonld) {
      jsonld.forEach(function (resource) {
        var s = typeof resource['@id'] !== 'undefined' ? resource['@id'] : '_:b' + guid();
        for (var p in resource) {
          if (p !== '@id') {
            if (p === '@type' && !_.isArray(resource[p])) {
              var tguid = guid();
              var triple = {};
              triple.guid = tguid;
              triple.s = s;
              triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
              triple.o = resource['@type'];
              triple.otype = 'uri';
              exports.store.push(triple);
            } else {
              resource[p].forEach(function (o) {
                var tguid = guid();
                var triple = {};
                triple.guid = tguid;
                if (p === '@type') {
                  triple.s = s;
                  triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
                  if (o.indexOf('.html') > -1) {
                    triple.o = o.replace('.html', '');
                  } else {
                    triple.o = o;
                  }
                  triple.otype = 'uri';
                } else {
                  triple.s = s;
                  if (p.indexOf('.html') > -1) {
                    triple.p = p.replace('.html', '');
                  } else {
                    triple.p = p;
                  }
                  if (o['@id'] !== undefined) {
                    triple.o = o['@id'];
                    triple.otype = 'uri';
                  } else if (o['@value'] !== undefined) {
                    triple.o = o['@value'];
                    triple.otype = 'literal';
                    if (o['@language'] !== undefined) {
                      triple.olang = o['@language'];
                    }
                  }
                }
                exports.store.push(triple);
              });
            }
          }
        }
        // If a resource does not have a defined type, do we care?
      });
      return exports.store;
    };
  
    exports.store2jsonldExpanded = function () {
      var json = [];
      exports.storeDedup();
      var groupedResources = _.groupBy(exports.store, function (t) {
        return t.s;
      });
      for (var resourceURI in groupedResources) {
        var j = {};
        j['@id'] = resourceURI;
        var groupedProperties = _.groupBy(groupedResources[resourceURI], function (t) {
          return t.p;
        });
        for (var propertyURI in groupedProperties) {
          var prop = propertyURI;
          if (propertyURI == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            prop = '@type';
          }
          j[prop] = [];
          groupedProperties[propertyURI].forEach(function (r) {
            if (prop == '@type' && r.otype == 'uri') {
              j[prop].push(r.o);
            } else if (r.otype == 'uri') {
              j[prop].push({
                '@id': r.o
              });
            } else {
              var o = {};
              if (r.olang !== undefined && r.olang !== '') {
                o['@language'] = r.olang;
              }
              if (r.p == '@type') {
                o = r.o;
              } else {
                o['@value'] = r.o;
              }
              j[prop].push(o);
            }
          });
        }
        // skip blank bnodes
        if (!((j['@id'].startsWith('_:b') || j['@id'].includes('loc.natlib')) && _.keys(j).length < 3)) { json.push(j); }
      }
      return json;
    };
  
    exports.store2turtle = function (jsonstr, callback) {
      jsonld.toRDF(jsonstr, {
        format: 'application/nquads'
      }, function(err, nquads) {
        //json2turtle(nquads, callback);
        var parser = N3.Parser();
        var turtlestore = N3.Store();
        parser.parse(nquads, function(error, triple, theprefixes) {
            if (triple) {
                turtlestore.addTriple(triple);
            } else {
                turtlestore.addPrefixes(theprefixes);                
                var turtleWriter = N3.Writer({
                    prefixes: {
                        bf: 'http://id.loc.gov/ontologies/bibframe/',
                        bflc: 'http://id.loc.gov/ontologies/bflc/',
                        madsrdf: "http://www.loc.gov/mads/rdf/v1#",
                        pmo: 'http://performedmusicontology.org/ontology/',
                        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
                        xsd: "http://www.w3.org/2001/XMLSchema#"
                    }
                });
                turtleWriter.addTriples(turtlestore.getTriples(null, null, null));
                //turtleWriter.addTriples(exports.n3store.getTriples(null, null, null));
                turtleWriter.end(function(error, result) {
                    callback(result);
                });
                var input = {};
                input.n3 = $("#humanized .panel-body pre").text();
                $.ajax({
                    url: config.url + "/profile-edit/server/n3/rdfxml",
                    type: "POST",
                    data: JSON.stringify(input),
                    processData: false,
                    contentType: "application/json",
                    success: function(rdfxml) {
                        var data = new XMLSerializer().serializeToString(rdfxml);
                        $("#rdfxml .panel-body pre").text(data);
                    },
                    error: function(XMLHttpRequest, status, err) {
                      bfeditor.bfelog.addMsg(new Error(), "ERROR", err);
                    }
                });
            }
        });
      });
    };

    exports.store2jsonldcompacted = function (jsonstr, callback) {
      var context = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#',
        'bf': 'http://id.loc.gov/ontologies/bibframe/',
        'bflc': 'http://id.loc.gov/ontologies/bflc/',
        'madsrdf': 'http://www.loc.gov/mads/rdf/v1#',
        'pmo': 'http://performedmusicontology.org/ontology/',
      };

      jsonld.compact(jsonstr, context, function (err, compacted) {
        callback(compacted);
      });
    };
  
    exports.store2jsonldnormalized = function (jsonstr, callback) {
      var context = {
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#',
        'bf': 'http://id.loc.gov/ontologies/bibframe/',
        'bflc': 'http://id.loc.gov/ontologies/bflc/',
        'madsrdf': 'http://www.loc.gov/mads/rdf/v1#',
        'pmo': 'http://performedmusicontology.org/ontology/',
      };

      jsonld.expand(jsonstr, context, function (err, jsonld) {
        callback(jsonld);
      });
    };
  
    exports.jsonldcompacted2store = function (json, callback) {
      jsonld.expand(json, function (err, expanded) {
        callback(expanded);
      });
    };
  
    exports.store2text = function () {
      var nl = '\n';
      var nlindent = nl + '\t';
      var nlindentindent = nl + '\t\t';
      var predata = '';
      var json = exports.store2jsonldExpanded();
      json.forEach(function (resource) {
        predata += nl + 'ID: ' + resource['@id'];
        if (resource['@type'] !== undefined) {
          predata += nlindent + 'Type(s)';
          resource['@type'].forEach(function (t) {
            // predata += nlindentindent + t["@id"];
            if (t['@value'] !== undefined) {
              predata += nlindentindent + t['@value'];
            } else {
              predata += nlindentindent + t;
            }
          });
        }
        for (var t in resource) {
          if (t !== '@type' && t !== '@id') {
            var prop = t.replace('http://id.loc.gov/ontologies/bibframe/', 'bf:');
            prop = prop.replace('http://id.loc.gov/vocabulary/relators/', 'relators:');
            prop = prop.replace('http://id.loc.gov/ontologies/bibframe-lc/', 'bflc:');
            prop = prop.replace('http://rdaregistry.info/termList/', 'rda');
            predata += nlindent + prop;
            resource[t].forEach(function (o) {
              if (o['@id'] !== undefined) {
                predata += nlindentindent + o['@id'];
              } else {
                predata += nlindentindent + o['@value'];
              }
            });
          }
        }
        predata += nl + nl;
      });
      return predata;
    };
  
    /**
       * Generates a GUID string.
       * @returns {String} The generated GUID.
       * @example GCt1438871386
       */
    function guid () {
      function _randomChoice () {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        for (var i = 0; i < 1; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
        return text;
      }
      return _randomChoice() + _randomChoice() + _randomChoice() + parseInt(Date.now() / 1000);
    }
  });
