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
var oclckey;

if (env.RECTOBASE!==undefined)
    rectobase = env.RECTOBASE;

if (env.BASEDBURI!=undefined) {
    baseDBURI = env.BASEDBURI;
    resourceURI = baseDBURI + "/resources";
    workContext = resourceURI + "/works/";
}

if (env.OCLCKEY!=undefined) {
    oclckey = env.OCLCKEY;
}

var versoURL = rectobase + "/verso/api";

var config = {
     "logging": {
      "level": "DEBUG",
      "toConsole": true
    }, 
    "name":"config-test",
    "url": rectobase,
    "buildContext": true,
    "baseURI": "http://id.loc.gov/",
    "basedbURI": baseDBURI,
    "resourceURI": resourceURI,
    "buildContextFor": ['id.loc.gov/authorities/names/','id.loc.gov/authorities/subjects/','id.loc.gov/vocabulary/relators/','id.loc.gov/resources/works/', 'id.loc.gov/bfentities/providers/','id.loc.gov/entities/providers/','id.loc.gov/authorities/genreForms'],
    "buildContextForWorksEndpoint": workContext,
    "enableUserTemplates" :true,
    "enableLoadMarc": true,
    "startingPointsUrl": versoURL + "/configs?filter[where][configType]=startingPoints&filter[where][name]=config-test",
    "literalLangDataUrl": versoURL + '/configs?filter[where][configType]=literalLangData',
    "oclckey": oclckey,
    "profiles": [
        versoURL + "/configs?filter[where][configType]=profile"
    ],
    "api": ["save", "publish", "retrieveLDS", "retrieve", "deleteId", "setStartingPoints"],
    "return": {
        "format": "jsonld-expanded",
        "callback": myCB
    }
}

