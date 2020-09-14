/*
bfe rest api calls
*/
bfe.define('src/bfeapi', ['require', 'exports', 'src/bfelogging'], function (require, exports) {

    var bfelog = require('src/bfelogging');
    var startingPoints = null;

    exports.getStoredJSONLD = function (config, id, callback){
        url = config.url + "/api/getStoredJSONLD/" + id;
        $.ajax({
            dataType: "json",
            type: "GET",
            url: url,
            async: false,
            success: function (data) {
                bfelog.addMsg(new Error(), "INFO", "Fetched stored JSONLD for " + id);
                bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
                callback(data);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) { 
                bfelog.addMsg(new Error(), "ERROR", "FAILED to fetch stored JSON: " + id);
                bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                callback([]);
            }
        });
    };
 
    exports.load = function(config, bfestore, callback) {
        if (config.toload !== undefined && config.toload.templates) {
            bfe.loadtemplatesANDlookupsCount = bfe.loadtemplatesANDlookupsCount + config.toload.templates.length;
            
            bfestore.store = [];
            bfestore.name = guid();
            bfestore.templateGUID = guid();
            bfestore.created = new Date().toUTCString();
            bfestore.url = config.versobase + '/verso/api/bfs?filter=%7B%22where%22%3A%20%7B%22name%22%3A%20%22' + bfestore.name + '%22%7D%7D';
            bfestore.state = 'create';
    
            // Turn off edit mode of templates if they were in the middle of editing one
            //bfeusertemplates.editMode = false;
            //bfeusertemplates.editModeTemplate = false;

            var loadtemplates = [];

            config.toload.templates.forEach(function(l){
                var useguid = guid();
                var loadtemplate = {};
                var tempstore = [];
                loadtemplate.templateGUID = useguid;
                loadtemplate.resourceTemplateID = l.templateID;
                loadtemplate.resourceURI = l.defaulturi;
                loadtemplate.embedType = "page";
                loadtemplate.data = tempstore;
                loadtemplates.push(loadtemplate);
            });
            bfestore.loadtemplates = loadtemplates;
            bfe.loadtemplates = loadtemplates;
            
            if (config.toload.source !== undefined && config.toload.source.location !== undefined && config.toload.source.requestType !== undefined) {
                    $.ajax({
                        url: config.toload.source.location,
                        dataType: config.toload.source.requestType,
                        success: function (data) {
                            bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + config.toload.source.location);
                            bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
                            /*
                                OK, so I would /like/ to just use rdfstore here
                                but it is treating literals identified using @value
                                within JSON objects as resources.  It gives them blank nodes.
                                This does not seem right and I don't have time to
                                investigate.
                                So, will parse the JSONLD myself, dagnabbit. 
                                NOTE: it totally expects JSONLD expanded form.
                            */
                            tempstore = bfestore.jsonld2store(data);
                            tempstore.forEach(function(t){
                                if (t.p == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && t.otype == "uri" && t.s == config.toload.defaulturi.replace('ml38281/', '')) {
                                    t.rtID = config.toload.templateID;
                                }
                            });
                            bfestore.store = tempstore;
                            callback();
                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) { 
                            bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + config.toload.source.location);
                            bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                        }
                    });
                } else {
                    callback();
                }
        }
    }

exports.retrieve = function (uri, bfestore, loadtemplates, callback){
  var url = uri.match(/OCLC/) ? uri : config.url + "/profile-edit/server/whichrt";
  var dType = (bfestore.state == 'loadmarc' || uri.endsWith('.rdf')) ? 'xml' : 'json';
  var xmlType = (uri.endsWith('.rdf')||uri.match(/OCLC/)) ? 'rdf' : 'xml';

  $.ajax({
    dataType: dType,
    type: "GET",
    data: { uri: uri},
    url: url,
    success: function (data) {
      bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI " + uri);
      bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
      
      if (dType == 'xml' && xmlType == 'xml') {
        var recCount = $('zs\\:numberOfRecords', data).text();
        if (recCount != '0') {
          var rdfrec  = $('zs\\:recordData', data).html();
          var recid = $('bf\\:Local > rdf\\:value', data).html();
          recid = recid.padStart(9, '0');
          bfestore.rdfxml2store(rdfrec, loadtemplates, recid, callback);
        } else {
          var q = uri.replace(/.+query=(.+?)&.+/, "$1");
          var $nohits = $('<div class="modal" tabindex="-1" role="dialog" id="nohits"><div class="modal-dialog" role="document"><div class="modal-content"> \
          <div class="modal-header">No Record Found!</div><div class="modal-body"><p>Query: "' + q + '"</p></div> \
          <div class="modal-footer"><button type="button" class="btn btn-primary" data-dismiss="modal">OK</button></div></div></div></div>');
          $nohits.modal('show');
        }
      } else if (xmlType == 'rdf') {
        rdfrec = $('<div>').append($('rdf\\:RDF', data).clone()).html();
        //rdfrec = $('rdf\\:RDF', data).html();
        if(!uri.match(/OCLC/))
          recid = $('bf\\:Local > rdf\\:value', data).html();
        bfestore.rdfxml2store(rdfrec, loadtemplates, recid, callback);
      } else {
        bfestore.store = bfestore.jsonldcompacted2store(data, function(expanded) {
          bfestore.store = [];
          bfestore.jsonld2store(expanded);
          bfestore.storeDedup();
          callback(loadtemplates);
        });
      }
    },
      error: function(XMLHttpRequest, textStatus, errorThrown) { 
        bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + uri);
        bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
        callback(new Error("ERROR: FAILED to load external source: " + uri));
      }
    });
  };

exports.save = function (bfestore, bfelog, callback){
  //var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});
  
  var data = createSaveJson(bfestore, "save");

  var url = config.versobase + "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+data.name+"%22%7D";
    
  $.ajax({
    url: url,
    type: "POST",
    data:JSON.stringify(data),
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  }).done(function (data) {  
        bfelog.addMsg(new Error(), "INFO", "Saved " + data.id);
        data.status = "success";
        return callback(true, data);
  }).fail(function (XMLHttpRequest, textStatus, errorThrown){
        data = { "status": "error", "errorText": textStatus, "errorThrown": errorThrown };
        bfelog.addMsg(new Error(), "ERROR", "FAILED to save");
        bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
        return callback(false, data);
  }).always(function(){                       
    // $('#table_id').DataTable().ajax.reload();
  });
};

/*
exports.save = function (data, close, bfelog, callback){
  var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});

  var url = config.url + "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+data.name+"%22%7D";

  $.ajax({
    url: url,
    type: "POST",
    data:JSON.stringify(data),
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  }).done(function (data) {  
    bfelog.addMsg(new Error(), "INFO", "Saved " + data.id);
    if (close){
      document.body.scrollTop = document.documentElement.scrollTop = 0;
      var $messagediv = $('<div>', {id: "bfeditor-messagediv", class: 'alert alert-info' });
      var decimaltranslator = window.ShortUUID("0123456789");
      var resourceName = "e" + decimaltranslator.fromUUID(data.name);
      var linkUrl = config.url + '/bfe/index.html#' + resourceName.substring(0,8);
      $messagediv.append('<strong>Description saved:</strong><a href='+linkUrl+'>'+resourceName.substring(0,8)+'</a>');
      $messagediv.append($('<button>', {onclick: "document.getElementById('bfeditor-messagediv').style.display='none'", class: 'close' }).append('<span>&times;</span>'));
      $messagediv.insertBefore('.nav-tabs');
      //$('#bfeditor-formdiv').empty();
      //$('#save-btn').remove();
      //$('#bfeditor-previewPanel').remove();
      //$('.nav-tabs a[href="#browse"]').tab('show')
      //bfeditor.bfestore.store = [];
      //window.location.hash = "";
    }
    callback(true, data.name);
  }).fail(function (XMLHttpRequest, textStatus, errorThrown){
    bfelog.addMsg(new Error(), "ERROR", "FAILED to save");
    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
    $messagediv.append('<div class="alert alert-danger"><strong>Save Failed:</strong>'+errorThrown+'</span>');
    $messagediv.insertBefore('.nav-tabs');
  }).always(function(){                       
    // $('#table_id').DataTable().ajax.reload();
  });
};
*/

exports.publish = function (bfestore, bfelog, callback) {

    bfestore.store2rdfxml(bfestore.store2jsonldExpanded(), function (rdfxml) {
        var data = createSaveJson(bfestore, "publish");
        data.rdfxml = JSON.stringify(rdfxml);
        
        var savedata = {};
        savedata.name = bfestore.name;
        savedata.profile = data.profile;
        savedata.url = data.url;
        savedata.created = data.created;
        savedata.modified = data.modified;
        savedata.status = data.status;
        savedata.rdf = data.rdf;
        
        var url = config.url + "/profile-edit/server/publish";
        var saveurl = "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+bfestore.name+"%22%7D";
        //console.log(JSON.stringify(savedata));
        $.when(
            $.ajax({
                url: saveurl,
                type: "POST",
                data:JSON.stringify(savedata),
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            }),
            $.ajax({
                url: url,
                type: "POST",
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            })
        ).done(function (saveresponse, publishresponse) {
            //console.log(JSON.stringify(publishresponse));
            pubstatus = publishresponse[0]
            if (pubstatus.publish.status === "published") {
                savedata.status = "success";
                savedata.objid = pubstatus.objid;
                $.when(
                    $.ajax({
                        url: saveurl,
                        type: "POST",
                        data:JSON.stringify(savedata),
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    })
                ).done(function (savedata) {
                    bfelog.addMsg(new Error(), "INFO", "Resource saved after successful publication to BFDB.");
                    //console.log(savedata);
                    //console.log(pubstatus);
                    callback(true, pubstatus);
                }).fail(function (XMLHttpRequest, textStatus, errorThrown){
                    data = { "status": "error", "errorText": textStatus, "errorThrown": errorThrown };
                    bfelog.addMsg(new Error(), "ERROR", "FAILED to save after publish.");
                    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                    console.log(XMLHttpRequest);
                    return callback(false, data);
                });
            } else {
                data = { "status": "error", "errorText": pubstatus.publish.status, "errorThrown": pubstatus.publish.message };
                bfelog.addMsg(new Error(), "ERROR", "FAILED to save after publish.");
                bfelog.addMsg(new Error(), "ERROR", "Request status: " + pubstatus.publish.status + "; Error msg: " + pubstatus.publish.message);
                return callback(false, data);
            }
        }).fail(function (XMLHttpRequest, textStatus, errorThrown){
            data = { "status": "error", "errorText": textStatus, "errorThrown": errorThrown };
            bfelog.addMsg(new Error(), "ERROR", "FAILED to save/publish.");
            bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
            console.log(XMLHttpRequest);
            return callback(false, data);
        }).always(function(){
            // $('#table_id').DataTable().ajax.reload();
        });
    });
};
  
  exports.retrieveLDS = function (uri, bfestore, loadtemplates, bfelog, callback){

    var url = config.url + "/profile-edit/server/retrieveLDS";
  
    $.ajax({
      dataType: "json",
      type: "GET",
      data: { uri: uri},
      url: url,
      success: function (data) {
        bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + uri);
        bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
        bfestore.store = bfestore.jsonldcompacted2store(data, function(expanded) {
          bfestore.store = [];
          bfestore.jsonld2store(expanded);
          bfestore.storeDedup();
          callback(loadtemplates);
        });
        //bfestore.n32store(data, url, tempstore, callback);
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + uri);
        bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
        callback(new Error("ERROR: FAILED to load external source: " + uri));
      }
    });
  }

  exports.deleteId = function(id, bfelog){
    var url = config.versobase + "/verso/api/bfs/" + id;
  
    $.ajax({
      type: "DELETE",                
      url: url,
      dataType: "json",
      success: function () {
        bfelog.addMsg(new Error(), "INFO", "Deleted " + id);
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        bfelog.addMsg(new Error(), "ERROR", "FAILED to delete: " + url);
        bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
      }
    });
  
  }

  exports.setStartingPoints = function (config, callback){
    if ( startingPoints !== null ) {
        config.startingPoints = startingPoints;
        callback(config);
    } else if (config.startingPointsUrl) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Starting Points URL: ' + config.startingPointsUrl);
        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: config.startingPointsUrl,
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                  bfelog.addMsg(new Error(),"ERROR", 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
            },
            success: function (data) {  
                startingPoints = data[0].json
                config.startingPoints = startingPoints;
                callback(config)
            }
        });
    } else if (config.startingPoints) {
        startingPoints = config.startingPoints;
        callback(config);
    } else {
        bfelog.addMsg(new Error(), "ERROR", "No startings points URL or staring points defined.");
        callback(config);
    }
}

    function createSaveJson(bfestore, action) {
      var save_json = {};
      save_json.name = bfestore.name;
      save_json.profile = bfestore.profile;
      save_json.url = config.versobase + '/verso/api/bfs?filter=%7B%22where%22%3A%20%7B%22name%22%3A%20%22' + bfestore.name + '%22%7D%7D';
      save_json.created = bfestore.created;
      save_json.modified = new Date().toUTCString();

      if (_.some(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata' })) {
        var modifiedDate = new Date(save_json.modified);
        var modifiedDateString = modifiedDate.toJSON().split(/\./)[0];

        if (_.some(bfestore.store, { p: 'http://id.loc.gov/ontologies/bibframe/changeDate' })) {
          _.each(_.where(bfestore.store, { p: 'http://id.loc.gov/ontologies/bibframe/changeDate' }), function (cd) {
            cd.o = modifiedDateString;
          });
        } else {
          var adminTriple = {};
          adminTriple.s = _.find(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata' }).o;
          adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/changeDate';
          adminTriple.o = modifiedDateString;
          adminTriple.otype = 'literal';
          bfestore.store.push(adminTriple);
        }
      }
      
        if (action == "publish") {
            //update profile
            if (_.some(bfestore.store, {'p': 'http://id.loc.gov/ontologies/bflc/profile'})){
                var profile = _.find(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bflc/profile' });
                profile.o = bfestore.profile;
            } else {
                var admin = _.find(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata' }).o;
                bfestore.addProfile(admin, bfeditor.bfestore.profile);
            }
            //works or instances
            var profileType = _.last(bfestore.profile.split(':')) ==='Work' ? 'works' : 'instances';

            save_json.status = 'published';
            save_json.objid = 'loc.natlib.' + profileType + '.' + save_json.name + '0001';

            var lccns;
            if (_.some(bfestore.store, {o: 'http://id.loc.gov/ontologies/bibframe/Lccn' })) {
                var lccnType = _.where(bfestore.store, {o: 'http://id.loc.gov/ontologies/bibframe/Lccn' })[0].s
                lccns = _.where(bfestore.store, { s: lccnType, p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value' })
            }

            if (!_.isEmpty(lccns)) {
                for (var i = 0; i < lccns.length; i++) {
                    if (!lccns[i].o.trim().startsWith('n')) {
                        save_json.lccn = lccns[i].o.trim();
                        save_json.objid = 'loc.natlib.'+ profileType +'.e' + save_json.lccn + '0001';
                    }
                }
            }
        }

      save_json.rdf = bfestore.store2jsonldExpanded();
      save_json.addedproperties = bfestore.addedProperties;
      return save_json;
    };
  
  function guid() {
    var translator = window.ShortUUID();
    return translator.uuid();
  }
  
});
