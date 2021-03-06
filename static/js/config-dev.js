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
var metaproxyURI;
var buildcontext = true;

var name = "config";

if (env.RECTOBASE!==undefined){
    rectobase = env.RECTOBASE;
}

baseDBURI = "https://preprod-8210.id.loc.gov"
if (env.BASEDBURI!=undefined) {
    baseDBURI = env.BASEDBURI;
}
resourceURI = baseDBURI + "/resources";
workContext = resourceURI + "/works/";  // This is unused?

var lookups = {
    'http://preprod.id.loc.gov/authorities/names': {
      'name': 'LCNAF',
      'require': 'src/lookups/lcnames'
    }
};

var config = {
     "logging": {
      "level": "DEBUG",
      "toConsole": true
     }, 
     "enviro": {
         "classes": "bg-danger text-dark",
         "text": "DEVELOPMENT"
     },
    "name": name,
    "url" : rectobase,
    "baseURI": "http://id.loc.gov/",
    "basedbURI": baseDBURI,
    "resourceURI": resourceURI,
    "metaproxyURI": metaproxyURI,
    //"lookups": lookups,
    "buildContext": true,
    "buildContextFor": ['id.loc.gov/authorities/names','id.loc.gov/authorities/subjects/','http://id.loc.gov/authorities/childrensSubjects','id.loc.gov/vocabulary/relators/','id.loc.gov/resources/works/', 'id.loc.gov/bfentities/providers/','id.loc.gov/entities/providers/','id.loc.gov/authorities/genreForms'],
    "buildContextForWorksEndpoint": workContext,
    "enableUserTemplates": true,
    "enableLoadMarc": true,
    "startingPointsUrl": "/api/listconfigs?where=index.resourceType:startingPoints&where=index.label:" + name,
    "literalLangDataUrl": '/api/listconfigs?where=index.resourceType:literalLangData',
    "profiles": [
        "/api/listconfigs?where=index.resourceType:profile"
    ],
    "api": ["save", "publish", "retrieveLDS", "retrieve", "deleteId", "setStartingPoints"],
    "return": {
        "format": "jsonld-expanded",
        "callback": myCB
    }
}
