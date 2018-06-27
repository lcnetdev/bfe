var ie = (function(){
  var undef,
      v = 3,
      div = document.createElement('div'),
      all = div.getElementsByTagName('i');
  while (
    div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
    all[0]
  );
  return v > 4 ? v : undef;
}());
if (ie < 10) {
  $("#iealert").addClass("alert alert-danger");
  $("#iealert").html("Sorry, but the BIBFRAME Editor will not work in IE8 or IE9.")
}
function myCB(data) {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function getCSRF(){
  //eventually you'll have to login       
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      var name = "csrftoken";
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }       
  return cookieValue;            
}

function setCSRF(xhr, settings, csrf) {
  if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
    xhr.setRequestHeader("X-CSRFToken", csrf);
  }
}

function save(data, csrf, bfelog, callback){
  var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});

  var url = config.url + "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+data.name+"%22%7D";

  $.ajax({
    url: url,
    type: "POST",
    data:JSON.stringify(data),
    csrf: csrf,
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
    $('#table_id').DataTable().ajax.reload();
  });
}

function publish(data, rdfxml, savename, bfelog, callback){
  var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});

  //var url = "http://mlvlp04.loc.gov:8201/bibrecs/bfe2mets.xqy";
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
      $('#table_id').DataTable().ajax.reload();
    });
}


function retrieve(uri, bfestore, loadtemplates, bfelog, callback){
  
  var url = config.url + "/profile-edit/server/whichrt";
  
  $.ajax({
    dataType: "json",
    type: "GET",
    async: false,
    data: { uri: uri},
    url: url,
    success: function (data) {
      bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + url);
      bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
      bfestore.store = bfestore.jsonldcompacted2store(data, function(expanded) {
        bfestore.store = [];
        tempstore = bfestore.jsonld2store(expanded);
        callback(loadtemplates);
      });
      //bfestore.n32store(data, url, tempstore, callback);
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + url);
      bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
    }
  });
}

function retrieveLDS(uri, bfestore, loadtemplates, bfelog, callback){

  var url = config.url + "/profile-edit/server/retrieveLDS";

  $.ajax({
    dataType: "json",
    type: "GET",
    async: false,
    data: { uri: uri},
    url: url,
    success: function (data) {
      bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + url);
      bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
      bfestore.store = bfestore.jsonldcompacted2store(data, function(expanded) {
        bfestore.store = [];
        tempstore = bfestore.jsonld2store(expanded);
        bfestore.storeDedup();
        callback(loadtemplates);
      });
      //bfestore.n32store(data, url, tempstore, callback);
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + url);
      bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
    }
  });
}


function deleteId(id, csrf, bfelog){
  var url = config.url + "/verso/api/bfs/" + id;

  //$.ajaxSetup({
  //    beforeSend: function(xhr, settings){getCSRF(xhr, settings, csrf);}
  //});

  $.ajax({
    type: "DELETE",                
    url: url,
    dataType: "json",
    csrf: csrf,
    success: function (data) {
      bfelog.addMsg(new Error(), "INFO", "Deleted " + id);
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      bfelog.addMsg(new Error(), "ERROR", "FAILED to delete: " + url);
      bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
    }
  });

}

/* Config object profiles
 * Editor profiles are read from a WS endpoint
 * The data are expected to be in a JSON array, with each object
 * in the array containing a "json" property that has the profile
 * itself. The "versoURL" variable is a convenience for setting the
 * base URL of verso in the "config" definition below.
 */
var rectoBase = "http://mlvlp04.loc.gov:3000";

// The following line is for local developement
// rectoBase = "http://localhost:3000";

var versoURL = rectoBase + "/verso/api";

var config = {
  /*            "logging": {
                "level": "DEBUG",
                "toConsole": true
                },*/
  "url" : rectoBase,
  "baseURI": "http://id.loc.gov/",
  "basedbURI": "http://mlvlp04.loc.gov:8230",
  "resourceURI": "http://mlvlp04.loc.gov:8230/resources",
  "profiles": [
    versoURL + "/configs?filter[where][configType]=profile"
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Admin Metadata",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Agents Contribution",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Agents Primary Contribution",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Agents",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Cartographic",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 DDC",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Edition Information",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Form",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 IBC",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Identifiers",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Item",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 LCC",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Language",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Load",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Monograph",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Moving Image-35mm Feature Film",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Moving Image-BluRay DVD",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Notated Music",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Note",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Place",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Prints and Photographs",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Publication, Distribution, Manufacturer Activity",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 RWO",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Rare Materials",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Related Works and Expressions",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Serial",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Series Information",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Sound Recording-Analog",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Sound Recording-Audio CD-R",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Sound Recording-Audio CD",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Title Information",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=BIBFRAME 2.0 Topic",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=PMO Medium of Performance",
    // versoURL + "/configs?filter[where][configType]=profile&filter[where][name]=Test BSR monograph"
  ],
  "startingPoints": [
    {"menuGroup": "Monograph",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:Monograph:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:Monograph:Work" ]
       }

     ]},
    {"menuGroup": "Notated Music",
     "menuItems": [
       {
         label: "Create Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:NotatedMusic:Work" ]
       },
       {
         label: "Create RDA Expression",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:NotatedMusic:Expression" ]
       },
       {
         label: "Create Instance", 
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:NotatedMusic:Instance" ]
       }
     ]},
    {"menuGroup": "Serial",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Serial"],
         useResourceTemplates: [ "profile:bf2:Serial:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Text"],
         useResourceTemplates: [ "profile:bf2:Serial:Work" ]
       }

     ]},
    {"menuGroup": "Cartographic",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:Cartographic:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:Cartographic:Work" ]
       }

     ]},
    {"menuGroup": "Sound Recording: Audio CD",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:SoundRecording:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:SoundRecording:Work" ]
       }

     ]},
    {"menuGroup": "Sound Recording: Audio CD-R",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:SoundCDR:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:SoundCDR:Work" ]
       }

     ]},
    {"menuGroup": "Sound Recording: Analog",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:Analog:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:Analog:Work" ]
       }

     ]},
    {"menuGroup": "Moving Image: BluRay DVD",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:MIBluRayDVD:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:MIBluRayDVD:Work" ]
       }

     ]},
    {"menuGroup": "Moving Image: 35mm Feature Film",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:35mmFeatureFilm:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:35mmFeatureFilm:Work" ]
       }

     ]},
    {"menuGroup": "Prints and Photographs",
     "menuItems": [
       {
         label: "Physical Description",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:Graphics:Description" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:Graphics:Work" ]
       }

     ]},
    {"menuGroup": "Rare Materials",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "profile:bf2:RareMat:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "profile:bf2:RareMat:Work" ]
       }

     ]},
    {"menuGroup": "Authorities",
     "menuItems": [
       {
         label: "Person",
         type: ["http://www.loc.gov/standards/mads/rdf/v1.html#PersonalName"],
         useResourceTemplates: [ "profile:bf2:Agent:Person" ]
       },
       {
         label: "Family",
         type: ["http://www.loc.gov/standards/mads/rdf/v1.html#FamilyName"],
         useResourceTemplates: [ "profile:bf2:Agent:Family" ]
       },
       {
         label: "Corporate Body",
         type: ["http://www.loc.gov/standards/mads/rdf/v1.html#CorporateName"],
         useResourceTemplates: [ "profile:bf2:Agent:CorporateBody" ]
       },
       {
         label: "Conference",
         type: ["http://www.loc.gov/standards/mads/rdf/v1.html#Conference"],
         useResourceTemplates: [ "profile:bf2:Agent:Conference" ]
       },                            
       {
         label: "Jurisdiction",
         type: ["http://www.loc.gov/standards/mads/rdf/v1.html#Territory"],
         useResourceTemplates: [ "profile:bf2:Agent:Jurisdiction" ]
       }
     ]}

  ],
  "save": {
    "callback": save
  },
  "publish": {
    "callback": publish
  },
  "retrieveLDS": {
    "callback":retrieveLDS
  },            
  "retrieve": {
    "callback": retrieve
  },
  "deleteId": {
    "callback": deleteId
  },            
  "getCSRF":{
    "callback": getCSRF
  },
  /*            "load": [
                {
                "templateID": ["profile:bf:Work:Monograph", "profile:bf:Instance:Monograph", "profile:bf:Annotation:AdminMeta"],
                "defaulturi": "http://id.loc.gov/resources/bibs/5226",
                "_remark": "Source must be JSONLD expanded, so only jsonp and json are possible requestTypes",
                "source": {
                "location": "http://id.loc.gov/resources/bibs/5226.bibframe_raw.jsonp",
                "requestType": "jsonp",
                "data": "UNUSED, BUT REMEMBER IT"
                }
                }
                ],*/
  "return": {
    "format": "jsonld-expanded",
    "callback": myCB
  }
}
var bfeditor = bfe.fulleditor(config, "bfeditor");
