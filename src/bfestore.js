bfe.define('src/bfestore', ['require', 'exports'], function (require, exports) {
    exports.n3store = N3.Store();
  
    exports.store = [];
  
    exports.rdfxml2store = function (rdf, loadtemplates, recid, callback) {
      //var url = 'http://rdf-translator.appspot.com/convert/xml/json-ld/content';
      var url = config.url + "/profile-edit/server/rdfxml/jsonld";
      var bfestore = this;
  
      var input = {};
      input.rdf = rdf;    

      $.ajax({
        contentType: 'application/json',
        processData: false,
        type: "POST",
        async: false,
        data: JSON.stringify(input),
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
  
    exports.addAdminMetadata = function (resourceURI, procInfo) {
      // add name, id triples
      var mintedId = 'e' + window.ShortUUID('0123456789').fromUUID(bfeditor.bfestore.name);
      var mintedUri = config.url + '/resources/' + mintedId;
      var useguid = guid();
      var bnode = '_:bnode' + useguid;
      
      var adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = resourceURI;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/adminMetadata';
      adminTriple.o = bnode;
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      adminTriple.o = 'http://id.loc.gov/ontologies/bibframe/AdminMetadata';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/creationDate';
      var d = new Date(bfeditor.bfestore.created);
      adminTriple.o = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);
            
      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/descriptionAuthentication';
      adminTriple.o =  'http://id.loc.gov/vocabulary/marcauthen/pcc';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = 'http://id.loc.gov/vocabulary/marcauthen/pcc';
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      adminTriple.o =  'http://id.loc.gov/ontologies/bibframe/DescriptionAuthentication';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/descriptionConventions';
      adminTriple.o =  'http://id.loc.gov/vocabulary/descriptionConventions/rda';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = 'http://id.loc.gov/vocabulary/descriptionConventions/rda';
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      adminTriple.o =  'http://id.loc.gov/ontologies/bibframe/DescriptionConventions';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/descriptionLanguage';
      adminTriple.o =  'http://id.loc.gov/vocabulary/languages/eng';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = 'http://id.loc.gov/vocabulary/languages/eng';
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      adminTriple.o =  'http://id.loc.gov/ontologies/bibframe/Language';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/descriptionModifier';
      adminTriple.o =  'http://id.loc.gov/vocabulary/organizations/dlc';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = 'http://id.loc.gov/vocabulary/organizations/dlc';
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      adminTriple.o =  'http://id.loc.gov/ontologies/bibframe/DescriptionModifier';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.s = 'http://id.loc.gov/vocabulary/marcauthen/pcc';
      adminTriple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      adminTriple.o =  'pcc';
      adminTriple.otype = 'Literal';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.s = 'http://id.loc.gov/vocabulary/descriptionConventions/rda';
      adminTriple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      adminTriple.o =  'RDA';
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.s = 'http://id.loc.gov/vocabulary/languages/eng';
      adminTriple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      adminTriple.o =  'English';
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.s = 'http://id.loc.gov/vocabulary/organizations/dlc';
      adminTriple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      adminTriple.o =  'DLC';
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.guid = useguid;
      adminTriple.s = bnode;
      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/identifiedBy';
      adminTriple.o = mintedUri;
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.s = mintedUri;
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      adminTriple.o = 'http://id.loc.gov/ontologies/bibframe/Local';
      adminTriple.otype = 'uri';
      bfeditor.bfestore.store.push(adminTriple);

      adminTriple = {};
      adminTriple.s = mintedUri;
      adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value';
      adminTriple.o = mintedId;
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);
    
      this.addProcInfo(bnode, procInfo);
      this.addProfile(bnode, bfeditor.bfestore.profile);

    }

    exports.addProcInfo = function (resourceURI, procInfo) {
      //remove old procInfos
      bfeditor.bfestore.store = _.without(bfeditor.bfestore.store, _.findWhere(bfeditor.bfestore.store, {s: resourceURI, p: 'http://id.loc.gov/ontologies/bflc/procInfo'}));

      var adminTriple = {};
      adminTriple.s = resourceURI;
      adminTriple.p = 'http://id.loc.gov/ontologies/bflc/procInfo';
      adminTriple.o = procInfo;
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);
    }

    exports.addProfile = function (resourceURI, profile) {
      var adminTriple = {};
      adminTriple.s = resourceURI;
      adminTriple.p = 'http://id.loc.gov/ontologies/bflc/profile';
      adminTriple.o = profile;
      adminTriple.otype = 'literal';
      bfeditor.bfestore.store.push(adminTriple);
    }

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
      store.getTriples(null, null, null).forEach(function (triple) {
        writer.addTriple(triple.subject.replace('_bnode', ''), triple.predicate, triple.object.replace('_bnode', ''), graph);
      });
      writer.end(function (error, nquads) {
        jsonld.fromRDF(nquads, {
          format: 'application/nquads'
        }, function (err, result) {
          callback(exports.jsonld2store(result[0]['@graph']));
        });
      });
    };

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
            } else if (r.otype == 'list') {//prop == 'http://www.loc.gov/mads/rdf/v1#componentList'){                                                       
              // overwrite the default if it is not yet set
              if (!j[prop]['@list']){
                              j[prop] = {'@list':[]};
              }                                                              
              var o = {};
              if (r.olang !== undefined && r.olang !== '') {
                              o['@language'] = r.olang;
              }
              if (r.p == '@type') {
                              o = r.o;
              } else {
                              o['@value'] = r.o;
              }
              j[prop]['@list'].push({"@id":r.o});

            } else if (r.otype == 'uri') {
              j[prop].push({
                '@id': r.o
              });
            } else {
                o = {};
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
  
    /**
       * Generates a GUID string.
       * @returns {String} The generated GUID.
       * @example GCt1438871386
       */
      function guid () {
        var translator = window.ShortUUID();
        return translator.uuid();
      }
      
  });
