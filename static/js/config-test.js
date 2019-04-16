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


function setStartingPoints(fileMode){
    var spfile = versoURL + "/configs?filter[where][configType]=startingPoints&filter[where][name]=config-test";
    if (fileMode){
        spfile = rectoBase + "/bfe/builds/startingPoints.json";
    }
    $.ajax({
        type: 'GET',
        dataType: 'json',
        async: false,
        url: spfile,
            error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.error('ERROR: Request status: ' + textStatus + '; Error msg: ' + errorThrown);
        },
        success: function (data) {            
            config.startingPoints = data[0].json;
        }
    });
}


function myCB(data) {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

/* Config object profiles
 * Editor profiles are read from a WS endpoint
 * The data are expected to be in a JSON array, with each object
 * in the array containing a "json" property that has the profile
 * itself. The "versoURL" variable is a convenience for setting the
 * base URL of verso in the "config" definition below.
 */
var rectobase = "http://localhost:3000";
var baseDBURI;
var resourceURI;
var workContext;

if (env.RECTOBASE!==undefined)
    rectoBase = env.RECTOBASE;

if (env.BASEDBURI!=undefined) {
    baseDBURI = env.BASEDBURI;
    resourceURI = baseDBURI + "/resources";
    workContext = resourceURI + "/works/";
}

var versoURL = rectoBase + "/verso/api";

var config = {
     "logging": {
      "level": "DEBUG",
      "toConsole": true
    }, 
    "name":"config-test",
    "url": rectoBase,
    "buildContext": true,
    "baseURI": "http://id.loc.gov/",
    "basedbURI": baseDBURI,
    "resourceURI": resourceURI,
    "buildContext": true,
    "buildContextFor": ['id.loc.gov/authorities/names/','id.loc.gov/authorities/subjects/','id.loc.gov/vocabulary/relators/','id.loc.gov/resources/works/', 'id.loc.gov/bfentities/providers/','id.loc.gov/entities/providers/','id.loc.gov/authorities/genreForms'],
    "buildContextForWorksEndpoint": workContext,
    "enableUserTemplates" :true,
    "enableLoadMarc": true,
    "literalLangDataUrl": versoURL + '/configs?filter[where][configType]=literalLangData',
    "profiles": [
        versoURL + "/configs?filter[where][configType]=profile"
    ],
    "api": ["save", "publish", "retrieveLDS", "retrieve", "deleteId"],
    "return": {
        "format": "jsonld-expanded",
        "callback": myCB
    }
}

setStartingPoints();

