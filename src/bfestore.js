bfe.define('src/bfestore', ['require', 'exports'], function (require, exports) {
  exports.n3store = N3.Store();

  exports.store = [];

  exports.rdfxml2store = function (rdf, loadtemplates, recid, callback) {
    //var url = 'http://rdf-translator.appspot.com/convert/xml/json-ld/content';
    var url = config.url + "/profile-edit/server/rdfxml/jsonld";
    var bfestore = this;

    var input = {};
    input.rdf = rdf;

    if(_.isEmpty(recid)){
      recid = mintResource(guid());
    } else {
      recid = 'c'+recid;
    }

    $.ajax({
      contentType: 'application/json',
      processData: false,
      type: "POST",
      data: JSON.stringify(input),
      url: url,
      success: function (data) {
        //bfestore.store = 
        bfestore.jsonldcompacted2store(data, function (expanded) {
          bfestore.store = [];
          var tempstore = bfestore.jsonld2store(expanded);
          var i = 0;
          tempstore.forEach(function (nnode, index, array) {
            i++;
            nnode.s = nnode.s.replace(/^_:N/, '_:bnode');
            nnode.s = nnode.s.replace(/^_:b/, '_:bnode');
            nnode.s = nnode.s.replace(/bibframe.example.org\/.+#(Work)/, 'id.loc.gov/resources/works/' + recid);
            nnode.s = nnode.s.replace(/bibframe.example.org\/.+#Instance/, 'id.loc.gov/resources/instances/' + recid + '0001');
            nnode.s = nnode.s.replace(/bibframe.example.org\/.+#Item/, 'id.loc.gov/resources/items/' + recid + '0001');
            //nnode.s = nnode.s.replace(/example.org\/.+#(Work)/, 'id.loc.gov/resources/works/' + recid);
            //nnode.s = nnode.s.replace(/example.org\/.+#Instance/, 'id.loc.gov/resources/instances/' + recid + '0001');
            //nnode.s = nnode.s.replace(/example.org\/.+#Item/, 'id.loc.gov/resources/items/' + recid + '0001');
            if (nnode.o !== undefined) {
              nnode.o = nnode.o.replace(/^_:N/, '_:bnode');
              nnode.o = nnode.o.replace(/^_:b/, '_:bnode');
              nnode.o = nnode.o.replace(/bibframe.example.org\/.+#(Work)/, 'id.loc.gov/resources/works/' + recid);
              nnode.o = nnode.o.replace(/bibframe.example.org\/.+#Instance/, 'id.loc.gov/resources/instances/' + recid + '0001');
              nnode.o = nnode.o.replace(/bibframe.example.org\/.+#Item/, 'id.loc.gov/resources/items/' + recid + '0001');
              //nnode.o = nnode.o.replace(/example.org\/.+#(Work)/, 'id.loc.gov/resources/works/' + recid);
              //nnode.o = nnode.o.replace(/example.org\/.+#Instance/, 'id.loc.gov/resources/instances/' + recid + '0001');
            }
            bfeditor.bfelog.addMsg(new Error(), "INFO", nnode.s + ' ' + nnode.p + ' ' + nnode.o);
            if (i == array.length)
              callback(loadtemplates);
          });
          
        });
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        bfeditor.bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + url);
        bfeditor.bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
        callback(new Error("ERROR: FAILED to load external source: " + url));
      }
    });
  }

  exports.addTriple = function (triple) {
    exports.store.push(triple);
    if (triple.rtid !== undefined) { exports.n3store.addTriple(triple.s, triple.p, triple.o, triple.rtID); } else { exports.n3store.addTriple(triple.s, triple.p, triple.o); }
  };

  exports.addModalAdminMetadata = function (resourceURI, rtID) {
    var catalogerId, encodingLevel,procInfo;

    if (_.some(bfeditor.bfestore.store, {"p": "http://id.loc.gov/ontologies/bflc/catalogerId"})){
      catalogerId = _.find(bfeditor.bfestore.store, {"p": "http://id.loc.gov/ontologies/bflc/catalogerId"}).o
    }

    if (_.some(bfeditor.bfestore.store, {"p": "http://id.loc.gov/ontologies/bflc/encodingLevel"})){
      encodingLevel = _.find(bfeditor.bfestore.store, {"p": "http://id.loc.gov/ontologies/bflc/encodingLevel"}).o
    }

    if (_.some(bfeditor.bfestore.store, {"p": "http://id.loc.gov/ontologies/bflc/profile"})){
      procInfo = _.find(bfeditor.bfestore.store, {"p": "http://id.loc.gov/ontologies/bflc/procInfo"}).o
    }

    bfeditor.bfestore.addAdminMetadata(resourceURI, procInfo, rtID, encodingLevel, catalogerId);
  }

  exports.addAdminMetadata = function (resourceURI, procInfo, rtID, encodingLevel, catalogerId) {
    // add name, id triples
    var mintedId = 'e' + window.ShortUUID('0123456789').fromUUID(bfeditor.bfestore.name);
    var mintedUri = config.url + '/resources/' + mintedId;

    var bnode = '_:bnode' +  shortUUID(guid());
    
    var resourceType = "bibframe";
    var amProp = "http://id.loc.gov/ontologies/bibframe/adminMetadata";
    var amType = "http://id.loc.gov/ontologies/bibframe/AdminMetadata";
    if ( resourceURI.indexOf("/resources/") === -1 ) {
        // This is not a bibframe resource....
        resourceType = "Authority";
        amProp = "http://www.loc.gov/mads/rdf/v1#adminMetadata";
        amType = "http://id.loc.gov/ontologies/RecordInfo#RecordInfo";
    } else if ( resourceURI.indexOf("/resources/hubs/") > -1 ) {
        // This is a Hub.
        resourceType = "Hub";
    }

    var adminTriple = {};
    adminTriple = _createURITriple(resourceURI, amProp, bnode);
    bfeditor.bfestore.store.push(adminTriple);

    adminTriple = _createURITriple(bnode, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", amType);
    bfeditor.bfestore.store.push(adminTriple);

    if (!_.isEmpty(catalogerId)){
        adminTriple = _createLiteralTriple(bnode, "http://id.loc.gov/ontologies/bflc/catalogerId", catalogerId);
        bfeditor.bfestore.store.push(adminTriple); 
    }

    if (!_.isEmpty(encodingLevel)){
        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/bflc/encodingLevel", encodingLevel);
        bfeditor.bfestore.store.push(adminTriple);
    }
    
    if (resourceType == "bibframe") {
        
        var cdate = new Date(bfeditor.bfestore.created);
        var cdate_value = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        var cdate_triple = _createLiteralTriple(bnode, "http://id.loc.gov/ontologies/bibframe/creationDate", cdate_value, "http://www.w3.org/2001/XMLSchema#date");
        bfeditor.bfestore.store.push(cdate_triple);

        //var mdate = new Date().toUTCString();
        var mdate_value = new Date().toJSON().split(/\./)[0];
        var mdate_triple = _createLiteralTriple(bnode, "http://id.loc.gov/ontologies/bibframe/changeDate", mdate_triple, "http://www.w3.org/2001/XMLSchema#dateTime");
        bfeditor.bfestore.store.push(mdate_triple);


        // description authentication
        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/bibframe/descriptionAuthentication", "http://id.loc.gov/vocabulary/marcauthen/pcc");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createURITriple("http://id.loc.gov/vocabulary/marcauthen/pcc", "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://id.loc.gov/ontologies/bibframe/DescriptionAuthentication");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createLiteralTriple("http://id.loc.gov/vocabulary/marcauthen/pcc", "http://www.w3.org/2000/01/rdf-schema#label", "pcc");
        bfeditor.bfestore.store.push(adminTriple);
        // description authentication
        
        
        // description descriptionConvention
        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/bibframe/descriptionConventions", "http://id.loc.gov/vocabulary/descriptionConventions/rda");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createURITriple("http://id.loc.gov/vocabulary/descriptionConventions/rda", "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://id.loc.gov/ontologies/bibframe/DescriptionConventions");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createLiteralTriple("http://id.loc.gov/vocabulary/descriptionConventions/rda", "http://www.w3.org/2000/01/rdf-schema#label", "RDA");
        bfeditor.bfestore.store.push(adminTriple);
        // description descriptionConvention
        
        
        // description language
        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/bibframe/descriptionLanguage", "http://id.loc.gov/vocabulary/descriptionConventions/rda");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createURITriple("http://id.loc.gov/vocabulary/languages/eng", "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://id.loc.gov/ontologies/bibframe/Language");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createLiteralTriple("http://id.loc.gov/vocabulary/languages/eng", "http://www.w3.org/2000/01/rdf-schema#label", "English");
        bfeditor.bfestore.store.push(adminTriple);
        // description language


        // description modifier
        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/bibframe/descriptionModifier", "http://id.loc.gov/vocabulary/organizations/dlc");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createURITriple("http://id.loc.gov/vocabulary/organizations/dlc", "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://id.loc.gov/ontologies/bibframe/DescriptionModifier");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createLiteralTriple("http://id.loc.gov/vocabulary/organizations/dlc", "http://www.w3.org/2000/01/rdf-schema#label", "DLC");
        bfeditor.bfestore.store.push(adminTriple);
        // description modifier


        // Note sure what's going on here, but OK.
        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/bibframe/identifiedBy", mintedUri);
        bfeditor.bfestore.store.push(adminTriple);

        adminTriple = _createURITriple(mintedUri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://id.loc.gov/ontologies/bibframe/Local");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createLiteralTriple(mintedUri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#value", mintedId);
        bfeditor.bfestore.store.push(adminTriple);
        
    } else {
        // Stopped here.  Must do admin metadata for Authorities and Hubs.
        var cdate = new Date(bfeditor.bfestore.created);
        adminTriple = _createLiteralTriple(bnode, "http://id.loc.gov/ontologies/RecordInfo#recordChangeDate", cdate.toISOString(), "http://www.w3.org/2001/XMLSchema#dateTime");
        bfeditor.bfestore.store.push(adminTriple);
        
        adminTriple = _createLiteralTriple(bnode, "http://id.loc.gov/ontologies/RecordInfo#recordStatus", "new");
        bfeditor.bfestore.store.push(adminTriple);

        adminTriple = _createURITriple(bnode, "http://id.loc.gov/ontologies/RecordInfo#recordContentSource", "http://id.loc.gov/vocabulary/organizations/dlc");
        bfeditor.bfestore.store.push(adminTriple);
    }
    
    this.addProcInfo(bnode, procInfo);
    this.addProfile(bnode, rtID);

  }

    exports.addProcInfo = function (resourceURI, procInfo) {
        //remove old procInfos
        bfeditor.bfestore.store = _.without(bfeditor.bfestore.store, _.findWhere(bfeditor.bfestore.store, { s: resourceURI, p: 'http://id.loc.gov/ontologies/bflc/procInfo' }));

        adminTriple = _createLiteralTriple(resourceURI, "http://id.loc.gov/ontologies/bflc/procInfo", procInfo);
        bfeditor.bfestore.store.push(adminTriple);
    }

    exports.addProfile = function (resourceURI, profile) {
        bfeditor.bfestore.store = _.without(bfeditor.bfestore.store, _.findWhere(bfeditor.bfestore.store, { s: resourceURI, p: 'http://id.loc.gov/ontologies/bflc/profile' }));

        adminTriple = _createLiteralTriple(resourceURI, "http://id.loc.gov/ontologies/bflc/profile", profile);
        bfeditor.bfestore.store.push(adminTriple);
    }

  exports.removeOrphans = function (defaultURI) {
    _.forEach(exports.store, function(t) {
      if(!_.some(exports.store, {o:t.s}) && t.s !== defaultURI ){
        exports.store = _.without(exports.store, t);
      }
    })
  }

  exports.removeInstanceOfs = function () {
    var duplicateInstance = _.filter(
      _.where(exports.store, {"p":"http://id.loc.gov/ontologies/bibframe/instanceOf"}), function(bnode)
        { if (bnode.o.startsWith("_:b"))
          { return bnode} 
      });

      if (!_.isEmpty(duplicateInstance)) { 
        if (duplicateInstance.length == 1) {
           _.where(exports.store, {s: duplicateInstance[0].o}); 
           exports.store = _.reject(exports.store, duplicateInstance[0])
        } else {
          bfeditor.bfelog.addMsg(new Error(), "DEBUG", "More than one duplicate instance found.");
        }
      } else { 
        bfeditor.bfelog.addMsg(new Error(), "DEBUG", "No duplicate instance found ");
      }
  }

  exports.addSerialTypes = function () {
    var serialInstance = _.find(exports.store, {"o":"http://id.loc.gov/vocabulary/issuance/serl"});

      if (!_.isEmpty(serialInstance)) {
        var serialWork = _.find(exports.store, {"s": serialInstance.s, "p":"http://id.loc.gov/ontologies/bibframe/instanceOf"});
        var serialType = _.where(exports.store, {"s": serialInstance.s, "p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" })
        if (serialType.length == 1 ) {
          if (serialType[0].o == "http://id.loc.gov/ontologies/bibframe/Instance") {
            if (_.some(bfeditor.bfestore.store, {"s": serialInstance.s, "p": "http://id.loc.gov/ontologies/bibframe/carrier" })){
              //var carrier = _.find(bfeditor.bfestore.store, {"s": serialInstance, "p": "http://id.loc.gov/ontologies/bibframe/carrier" });
              _.forEach(_.where(exports.store, {"s": serialInstance.s, "p": "http://id.loc.gov/ontologies/bibframe/media" }), function(mediaType){
                var serlType;
                var serlElectronic = "http://id.loc.gov/ontologies/bibframe/Electronic";
                var serlPrint = "http://id.loc.gov/ontologies/bibframe/Print";
                if (mediaType.o == "http://id.loc.gov/vocabulary/mediaTypes/h") {
                  serlType = serlPrint;
                } else if (mediaType.o == "http://id.loc.gov/vocabulary/mediaTypes/c") {
                  serlType =serlElectronic;
                } else if (mediaType.o == "http://id.loc.gov/vocabulary/mediaTypes/n") {
                  serlType = serlPrint;
                } else {
                  return;
                }

                if (!_.isEmpty(serlType)){
                  //add a triple for the type
                  var tguid = shortUUID(guid());
                  var triple = {};
                  triple.guid = tguid;
                  triple.s = serialInstance.s;
                  triple.p = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
                  triple.otype = 'uri';
                  triple.o = serlType
                  exports.store.push(triple);

                  if (!_.isEmpty(serialWork)){
                    //add a Text triple
                    tguid = shortUUID(guid());
                    triple = {};
                    triple.guid = tguid;
                    triple.s = serialWork.o;
                    triple.p = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
                    triple.otype = 'uri';
                    triple.o = "http://id.loc.gov/ontologies/bibframe/Text";
                    exports.store.push(triple);
                  }
                } else {
                  bfeditor.bfelog.addMsg(new Error(), "DEBUG", "No type added.");
                }
              })
            }
          }
        } else {
          bfeditor.bfelog.addMsg(new Error(), "DEBUG", "More than one serial issuance found.");
        }
      } else { 
        bfeditor.bfelog.addMsg(new Error(), "DEBUG", "No serial issuance found ");
      }
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

  exports.store2rdfxml = function (expanded, callback) {
    jsonld.toRDF(expanded, {
      format: 'application/nquads'
    }, function (err, nquads) {
      //json2turtle(nquads, callback);
      var parser = N3.Parser();
      var turtlestore = N3.Store();
      parser.parse(nquads, function (error, triple, theprefixes) {
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
              xsd: "http://www.w3.org/2001/XMLSchema#",
              datatypes: "http://id.loc.gov/datatypes/",
              lclocal: "http://id.loc.gov/ontologies/lclocal/"
            }
          });
          turtleWriter.addTriples(turtlestore.getTriples(null, null, null));
          turtleWriter.end(function (error, result) {
            var input = {};
            input.n3 = result.normalize("NFC");
            $.ajax({
              url: config.url + "/profile-edit/server/n3/rdfxml",
              type: "POST",
              data: JSON.stringify(input),
              processData: false,
              contentType: "application/json",
              success: function (rdfxml) {
                var data = new XMLSerializer().serializeToString(rdfxml);
                callback(data);
              },
              error: function (XMLHttpRequest, status, err) {
                bfeditor.bfelog.addMsg(new Error(), 'ERROR', err);
              }
            });
          });
        }
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

  exports.jsonld2store = function (jsonld_data) {
    jsonld_data.forEach(function (resource) {
      var s = typeof resource['@id'] !== 'undefined' ? resource['@id'] : '_:b' + shortUUID(guid());
      for (var p in resource) {
        if (p !== '@id') {
          if (p === 'http://www.loc.gov/mads/rdf/v1#componentList'){
            var list;
            if (_.isArray(resource[p])){
              list = resource[p][0]['@list'];
              if (_.isEmpty(list)){
                list = resource[p];
              }
            } else if (_.isArray(resource[p]['@list'])) {
              list = resource[p]['@list'];
            }

            list.forEach(function (l) {
              var tguid = shortUUID(guid());
              var triple = {};
              triple.guid = tguid;
              triple.s = s;
              triple.p = 'http://www.loc.gov/mads/rdf/v1#componentList';
              triple.otype = 'list';
              triple.o = l["@id"]
              exports.store.push(triple);
            });
            
          } else if (p === '@type' && !_.isArray(resource[p])) {
            var tguid = shortUUID(guid());
            var triple = {};
            triple.guid = tguid;
            triple.s = s;
            triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
            triple.o = resource['@type'];
            triple.otype = 'uri';
            exports.store.push(triple);
          } else {
            resource[p].forEach(function (o) {
              var tguid = shortUUID(guid());
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
                  if(o['@type'] !== undefined){
                    triple.odatatype = o['@type'];
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
            if (!j[prop]['@list']) {
              j[prop] = { '@list': [] };
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
            j[prop]['@list'].push({ "@id": r.o });

          } else if (r.otype == 'uri') {
            j[prop].push({
              '@id': r.o
            });
          } else {
            o = {};
            if (!_.isEmpty(r.olang)) {
              o['@language'] = r.olang;
            }
            if (!_.isEmpty(r.odatatype)) {
              o['@type'] = r.odatatype;
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
    }, function (err, nquads) {
      //json2turtle(nquads, callback);
      var parser = N3.Parser();
      var turtlestore = N3.Store();
      parser.parse(nquads, function (error, triple, theprefixes) {
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
              xsd: "http://www.w3.org/2001/XMLSchema#",
              datatypes: "http://id.loc.gov/datatypes/",
              lclocal: "http://id.loc.gov/ontologies/lclocal/",
            }
          });
          turtleWriter.addTriples(turtlestore.getTriples(null, null, null));
          //turtleWriter.addTriples(exports.n3store.getTriples(null, null, null));
          turtleWriter.end(function (error, result) {
            callback(result);
          });
          var input = {};
          input.n3 = $("#humanized pre").text().normalize("NFC");
          $.ajax({
            url: "/profile-edit/server/n3/rdfxml",
            type: "POST",
            data: JSON.stringify(input),
            processData: false,
            contentType: "application/json",
            success: function (rdfxml) {
              var data = new XMLSerializer().serializeToString(rdfxml);
              $("#rdfxml pre").text(data);
            },
            error: function (XMLHttpRequest, status, err) {
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
      'datatypes': 'http://id.loc.gov/datatypes/',
      'lclocal': 'http://id.loc.gov/ontologies/lclocal/'
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
      'datatypes': 'http://id.loc.gov/datatypes/',
      'lclocal': 'http://id.loc.gov/ontologies/lclocal/'
    };

    jsonld.expand(jsonstr, context, function (err, jsonld_data) {
      callback(jsonld_data);
    });
  };

  exports.jsonldcompacted2store = function (json, callback) {
    jsonld.expand(json, function (err, expanded) {
      callback(expanded);
    });
  };

  exports.cleanJSONLD = function (procInfoLabel) {
    // converter uses bf:person intead of personal name
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Person' }), function (triple) {
      triple.o = 'http://www.loc.gov/mads/rdf/v1#PersonalName';
    });
    // converter uses bf:organization intead of corporate name
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Organization' }), function (triple) {
      triple.o = 'http://www.loc.gov/mads/rdf/v1#CorporateName';
    });
    // eliminate duplicate type bf:Contributor
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bflc/PrimaryContribution' }), function (triple) {
      var duplicateContext = { 's': triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Contribution' };
      bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, duplicateContext);
    });
    // ItemOfs
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/itemOf'}), function (triple) {
      bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, triple);
    });
    // Variant Titles
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/VariantTitle' }), function (triple) {
      var duplicateContext = { s: triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: "http://id.loc.gov/ontologies/bibframe/Title"};
      bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, duplicateContext);
    });
    /*// Text to Work
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Text' }), function (triple) {
      bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, { 's': triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Text' });
      triple.o = 'http://id.loc.gov/ontologies/bibframe/Work';
      bfeditor.bfestore.store.push(triple);
    });*/          
    //complex subject http://www.loc.gov/mads/rdf/v1#ComplexSubject
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Topic' }), function (triple) {
      var complexContext = {s: triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: "http://www.loc.gov/mads/rdf/v1#ComplexSubject"};
      var topicContext = {s: triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: "http://www.loc.gov/mads/rdf/v1#Topic"};
      bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, complexContext);
      bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, topicContext);
    });
    // converter uses madsrdf:genreForm intead of bf:genreForm
    /*_.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/GenreForm' }), function (triple) {
      var bfgenre = {s: triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: 'http://www.loc.gov/mads/rdf/v1#GenreForm'};
      bfeditor.bfestore.store.push(bfgenre);
    });*/
    //add profile
    _.each(_.where(bfeditor.bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/AdminMetadata' }), function (am) {
      bfeditor.bfestore.addProfile(am.s, bfeditor.bfestore.profile);
      bfeditor.bfestore.addProcInfo(am.s, procInfoLabel);
    });

    bfeditor.bfestore.loadtemplates.data = bfeditor.bfestore.store;
  }

    /**
     * turi = URI or bnode
     * tprop = URI, e.g. http://www.w3.org/1999/02/22-rdf-syntax-ns#type
     * tvalue = string
     * tdatatype = URI, e.g. http://www.w3.org/2001/XMLSchema#dateTime
     */ 
    function _createLiteralTriple(turi, tprop, tvalue, tdatatype) {
        var triple = {};
        triple.guid = shortUUID(guid());
        triple.s = turi;
        triple.p = tprop;
        triple.o = tvalue;
        triple.otype = 'literal';
        if (tdatatype != undefined) {
            triple.odatatype = tdatatype;
        }
        return triple
    }
    
    /**
     * turi = URI or bnode
     * tprop = URI, e.g. http://www.w3.org/1999/02/22-rdf-syntax-ns#type
     * tvalue = string
     * tdatatype = URI, e.g. http://www.w3.org/2001/XMLSchema#dateTime
     */ 
    function _createURITriple(turi, tprop, tvalue_uri) {
        var triple = {};
        triple.guid = shortUUID(guid());
        triple.s = turi;
        triple.p = tprop;
        triple.o = tvalue_uri;
        triple.otype = 'uri';
        return triple
    }

  /**
   * Generates a GUID string.
   * @returns {String} The generated GUID.
   * @example GCt1438871386
   */
  function guid() {
    var translator = window.ShortUUID();
    return translator.uuid();
  }

  function shortUUID(uuid) {
    var translator = window.ShortUUID();
    return translator.fromUUID(uuid);
  }

  function mintResource(uuid) {
    var decimaltranslator = window.ShortUUID('0123456789');
    return 'e' + decimaltranslator.fromUUID(uuid);
  }

});
