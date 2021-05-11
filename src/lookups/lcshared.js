bfe.define('src/lookups/lcshared', ['require', 'exports', 'src/bfelogging'], function (require, exports) {
    // require('https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js');
  
    /*
          subjecturi propertyuri selected.uri
          selected.uri  bf:label selected.value
      */
    var bfelog = require('src/bfelogging');

    exports.getResource = function (subjecturi, property, selected, process) {
      var triples = [];
      var triple = {};
      if (selected.id == 'literalLookup'){
        triple.s = subjecturi;
        triple.p = property.propertyURI;
        triple.o = selected.value;
        triple.otype = 'literal';
        triples.push(triple);
      } else if (selected.id == 'literal'){
        triple.s = subjecturi;
        triple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
        triple.o = selected.value;
        triple.otype = 'literal';
        triples.push(triple);
      } else {
        triple.s = subjecturi;
        triple.p = property.propertyURI;
        triple.o = selected.uri;
        triple.otype = 'uri';
        triples.push(triple);
    
        triple = {};
        triple.s = selected.uri;
        triple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
        triple.o = selected.value;
        triple.otype = 'literal';
        //triple.olang = 'en';
        triples.push(triple);
      }
  
      return process(triples, property);
    };
  
    exports.getResourceLabelLookup = function (subjecturi, propertyuri, selected, process) {
      var triples = [];
  
      var triple = {};
      triple.s = subjecturi;
      triple.p = propertyuri;
      triple.o = selected.uri;
      triple.otype = 'uri';
      triples.push(triple);
      // add label
      var url = selected.uri.replace(/^(http:)/,"");
      $.ajax({
        url: url + '.jsonp',
        dataType: 'jsonp',
        success: function (data) {
          data.forEach(function (resource) {
            if (resource['@id'] === selected.uri) {
              var label = {};
              label.s = selected.uri;
              label.otype = 'literal';
              label.p = 'http://www.w3.org/2000/01/rdf-schema#label';
              label.o = resource['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
              triples.push(label);
              return process(triples);
            }
          });
        }
      });
    };


    exports.extractContextData = function(data){
      var results = { source: [], variant : [], uri: data.uri, title: null, contributor:[], date:null, genreForm: null, nodeMap:{}};
      
      // if it is in jsonld format
      if (data['@graph']){
        data = data['@graph'];
      }
      
      var nodeMap = {};
      
      data.forEach(function(n){
        if (n['http://www.loc.gov/mads/rdf/v1#birthDate']){
          nodeMap.birthDate = n['http://www.loc.gov/mads/rdf/v1#birthDate'].map(function(d){ return d['@id']})
        }        
        if (n['http://www.loc.gov/mads/rdf/v1#birthPlace']){
          nodeMap.birthPlace = n['http://www.loc.gov/mads/rdf/v1#birthPlace'].map(function(d){ return d['@id']})
        }  

        if (n['http://www.loc.gov/mads/rdf/v1#associatedLocale']){
          nodeMap.associatedLocale = n['http://www.loc.gov/mads/rdf/v1#associatedLocale'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#fieldOfActivity']){
          nodeMap.fieldOfActivity = n['http://www.loc.gov/mads/rdf/v1#fieldOfActivity'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#gender']){
          nodeMap.gender = n['http://www.loc.gov/mads/rdf/v1#gender'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#occupation']){
          nodeMap.occupation = n['http://www.loc.gov/mads/rdf/v1#occupation'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#associatedLanguage']){
          nodeMap.associatedLanguage = n['http://www.loc.gov/mads/rdf/v1#associatedLanguage'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#deathDate']){
          nodeMap.deathDate = n['http://www.loc.gov/mads/rdf/v1#deathDate'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#hasBroaderAuthority']){
          nodeMap.hasBroaderAuthority = n['http://www.loc.gov/mads/rdf/v1#hasBroaderAuthority'].map(function(d){ return d['@id']})
        } 
        if (n['http://www.loc.gov/mads/rdf/v1#hasNarrowerAuthority']){
          nodeMap.hasNarrowerAuthority = n['http://www.loc.gov/mads/rdf/v1#hasNarrowerAuthority'].map(function(d){ return d['@id']})
        }
        if (n['http://www.loc.gov/mads/rdf/v1#see']){
          nodeMap.see = n['http://www.loc.gov/mads/rdf/v1#see'].map(function(d){ return d['@id']})
        }
        if (n['http://www.loc.gov/mads/rdf/v1#hasRelatedAuthority']){
          nodeMap.hasRelatedAuthority = n['http://www.loc.gov/mads/rdf/v1#hasRelatedAuthority'].map(function(d){ return d['@id']})
        } 

      })
      // pull out the labels
      data.forEach(function(n){
        
        // loop through all the possible types of row
        Object.keys(nodeMap).forEach(function(k){
          if (!results.nodeMap[k]) { results.nodeMap[k] = [] }
          // loop through each uri we have for this type
          nodeMap[k].forEach(function(uri){
            if (n['@id'] && n['@id'] == uri){
             
              if (n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']){
                n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].forEach(function(val){ 
                  if (val['@value']){
                    results.nodeMap[k].push(val['@value']);
                  }
                })
              }
              if (n['http://www.w3.org/2000/01/rdf-schema#label']){
                n['http://www.w3.org/2000/01/rdf-schema#label'].forEach(function(val){ 
                  if (val['@value']){
                    results.nodeMap[k].push(val['@value']);
                  }
                })
              }
            }
          })        
        })
      })

      data.forEach(function(n){
        
        var citation = '';
        var variant = '';
        
        if (n['http://www.loc.gov/mads/rdf/v1#citation-source']) {
          citation = citation + n['http://www.loc.gov/mads/rdf/v1#citation-source'].map(function (v) { return v['@value'] + ' '; })
        }
        if (n['http://www.loc.gov/mads/rdf/v1#citation-note']) {
          citation = citation + n['http://www.loc.gov/mads/rdf/v1#citation-note'].map(function (v) { return v['@value'] + ' '; })
        }
        if (n['http://www.loc.gov/mads/rdf/v1#citation-status']) {
          citation = citation + n['http://www.loc.gov/mads/rdf/v1#citation-status'].map(function (v) { return v['@value'] + ' '; })
        }
        if (n['http://www.loc.gov/mads/rdf/v1#variantLabel']) {
          variant = variant + n['http://www.loc.gov/mads/rdf/v1#variantLabel'].map(function (v) { return v['@value'] + ' '; })
        }
        citation = citation.trim()
        variant = variant.trim()
        if (variant != ''){ results.variant.push(variant)}
        if (citation != ''){ results.source.push(citation)}
        
        
        if (n['@type'] && n['@type'] == 'http://id.loc.gov/ontologies/bibframe/Title'){
          if (n['bibframe:mainTitle']){
            results.title = n['bibframe:mainTitle']
          }
        }
        if (n['@type'] && (n['@type'] == 'http://id.loc.gov/ontologies/bibframe/Agent' || n['@type'].indexOf('http://id.loc.gov/ontologies/bibframe/Agent') > -1 )){
          if (n['bflc:name00MatchKey']){
            results.contributor.push(n['bflc:name00MatchKey']);
          }
        }
        if (n['bibframe:creationDate'] && n['bibframe:creationDate']['@value']){
          results.date = n['bibframe:creationDate']['@value'];
        }       
        if (n['@type'] && n['@type'] == 'http://id.loc.gov/ontologies/bibframe/GenreForm'){
          if (n['bibframe:mainTitle']){
            results.genreForm = n['rdf-schema:label'];
          }
        }
        
        if (n['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSCollection']) { 
            results.nodeMap.collections = [];
            n['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSCollection'].forEach(function(val){ 
                if (val['@id']) {
                    var coll_label_parts = val['@id'].split("_");
                    var coll_label = coll_label_parts[1];
                    if (coll_label_parts.length > 2) {
                        coll_label = coll_label_parts.slice(1).join(' ');
                    }
                    if (coll_label != "LCNAF" && coll_label.match(/[A-Z]{4}|[A-Z][a-z]+/g)) {
                        coll_label = coll_label.match(/[A-Z]{4}|[A-Z][a-z]+/g).join(" ");
                    }
                    results.nodeMap.collections.push(coll_label);
                }
            })
        }

      });    
      return results;
    }

    exports.fetchContextData = function(uri,callback){

        if (uri.indexOf('id.loc.gov/') > -1 && uri.match(/(authorities|vocabulary)/)) {
            var jsonuri = uri + '.madsrdf_raw.jsonld';
        } else {
            jsonuri = uri + '.jsonld';
        }
      
        if (uri.indexOf('id.loc.gov') > -1) {
            jsonuri = jsonuri.replace(/^(http:)/,"https:");
        }
      
        $.ajax({
            url: jsonuri,
            dataType: 'json',
            success: function (data) {    
              
                var id = uri.split('/')[uri.split('/').length-1];
                data.uri = uri;
          
                var d = JSON.stringify(exports.extractContextData(data));
                sessionStorage.setItem(id, d);
                if (callback){
                    callback(d)
                }
            }
        });   
    };
  
    exports.processATOM = function (atomjson, query) {
      var typeahead_source = [];
      for (var k in atomjson) {
        if (atomjson[k][0] == 'atom:entry') {
          var t = '';
          var u = '';
          var source = '';
          var d = '';
          for (var e in atomjson[k]) {
            if (atomjson[k][e][0] == 'atom:title') {
              t = atomjson[k][e][2];
            }
            if (atomjson[k][e][0] == 'atom:link') {
              u = atomjson[k][e][1].href;
              source = u.substr(0, u.lastIndexOf('/'));
              var id = u.replace(/.+\/(.+)/, '$1');
              d = t + ' (' + id + ')';
            }
            if (t !== '' && u !== '') {
              typeahead_source.push({
                uri: u,
                source: source,
                value: t, 
                display: d
              });
              break;
            }
            bfelog.addMsg(new Error(), 'INFO', typeahead_source);
          }
        }
      }
      if (typeahead_source.length === 0) {
        typeahead_source[0] = {
          uri: '',
          display: '[No suggestions found for ' + query + '.]'
        };
      }
      // console.log(typeahead_source);
      return typeahead_source;
    };
    
    exports.rdfType = function(type){
      var rdftype = '';
      if (type == 'http://www.loc.gov/mads/rdf/v1#PersonalName' || type == 'http://id.loc.gov/ontologies/bibframe/Person') {
        rdftype = 'rdftype:PersonalName';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/Topic') {
        rdftype = '(rdftype:Topic OR rdftype:ComplexSubject)';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Place' || type == 'http://id.loc.gov/ontologies/bibframe/Place' || type == 'http://www.loc.gov/mads/rdf/v1#Geographic') {
        rdftype = 'rdftype:Geographic';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Temporal'){
        rdftype= 'rdftype:Temporal'; 
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Organization' || type == 'http://id.loc.gov/ontologies/bibframe/Organization') {
        rdftype = 'rdftype:CorporateName';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Family' || type == 'http://id.loc.gov/ontologies/bibframe/Family') {
        rdftype = "rdftype:FamilyName";
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Meeting' || type == 'http://id.loc.gov/ontologies/bibframe/Meeting') {
        rdftype = 'rdftype:ConferenceName';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Jurisdiction' || type == 'http://id.loc.gov/ontologies/bibframe/Jurisdiction') {
        rdftype = 'rdftype:Geographic';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/GenreForm' || type == 'http://www.loc.gov/mads/rdf/v1#GenreForm') {
        rdftype = 'rdftype:GenreForm';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/Role') {
        rdftype = 'rdftype:Role';
      }
      return rdftype;
    }

});