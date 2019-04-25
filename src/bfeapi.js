/*
bfe rest api calls
*/
bfe.define('src/bfeapi', ['require', 'exports'], function (require, exports) {

exports.retrieve = function (uri, bfestore, loadtemplates, bfelog, callback){
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
  }

exports.save = function (data, bfelog, callback){
  var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});

  var url = config.url + "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+data.name+"%22%7D";

  $.ajax({
    url: url,
    type: "POST",
    data:JSON.stringify(data),
    dataType: "json",
    contentType: "application/json; charset=utf-8"
  }).done(function (data) {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    bfelog.addMsg(new Error(), "INFO", "Saved " + data.id);
    var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
    var decimaltranslator = window.ShortUUID("0123456789");
    var resourceName = "e" + decimaltranslator.fromUUID(data.name);
    $messagediv.append('<div class="alert alert-info"><strong>Description saved:</strong><a href='+data.url+'>'+resourceName+'</a></div>')
    $('#bfeditor-formdiv').empty();
    $('#save-btn').remove();
    $messagediv.insertBefore('.nav-tabs');
    $('#bfeditor-previewPanel').remove();
    $('.nav-tabs a[href="#browse"]').tab('show')
    bfeditor.bfestore.store = [];
    window.location.hash = "";
    callback(true, data.name);
  }).fail(function (XMLHttpRequest, textStatus, errorThrown){
    bfelog.addMsg(new Error(), "ERROR", "FAILED to save");
    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
    $messagediv.append('<div class="alert alert-danger"><strong>Save Failed:</strong>'+errorThrown+'</span>');
    $messagediv.insertBefore('.nav-tabs');
  }).always(function(){                       
    // $('#table_id').DataTable().ajax.reload();
  });
}

exports.publish = function (data, rdfxml, savename, bfelog, callback){
    var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});
  
    var url = config.url + "/profile-edit/server/publish";
    var saveurl = "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+savename+"%22%7D";
  
    var savedata = {};
    savedata.name = savename;
    savedata.profile = data.profile;
    savedata.url = data.url;
    savedata.created = data.created;
    savedata.modified = data.modified;
    savedata.status = data.status;
    savedata.rdf = data.rdf;
  
    data.rdfxml = JSON.stringify(rdfxml);
    
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
      })).done(function (savedata, publishdata) {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        bfelog.addMsg(new Error(), "INFO", "Published " + publishdata[0].name);
        var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
        $messagediv.append('<div class="alert alert-info"><strong>Description submitted for posting:</strong><a href=' + config.basedbURI + "/" + publishdata[0].objid+'>'+publishdata[0].lccn+'</a></div>');
        $('#bfeditor-formdiv').empty();
        $('#save-btn').remove();
        $messagediv.insertBefore('.nav-tabs');
        $('#bfeditor-previewPanel').remove();
        $('.nav-tabs a[href="#browse"]').tab('show')
        bfeditor.bfestore.store = [];
        window.location.hash = "";
        callback(true, data.name);                
      }).fail(function (XMLHttpRequest, textStatus, errorThrown){
        bfelog.addMsg(new Error(), "ERROR", "FAILED to save");
        bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
        $messagediv.append('<div class="alert alert-danger"><strong>Save Failed:</strong>'+errorThrown+'</span>');
        $messagediv.insertBefore('#bfeditor-previewPanel');
      }).always(function(){
        // $('#table_id').DataTable().ajax.reload();
      });
  }
  
  exports.retrieveLDS =function (uri, bfestore, loadtemplates, bfelog, callback){

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
    var url = config.url + "/verso/api/bfs/" + id;
  
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
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: config.startingPointsUrl,
            error: function (XMLHttpRequest, textStatus, errorThrown) {
              bfelog.addMsg(new Error(),"ERROR", 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
        },
        success: function (data) {            
            config.startingPoints = data[0].json;
            callback(config)
        }
    });
}
});
