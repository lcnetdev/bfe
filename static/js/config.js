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
              /* "logging": {
                "level": "DEBUG",
                "toConsole": false
              },*/ 
  "url" : rectoBase,
  "buildContext": true,
  "buildContextFor": ['id.loc.gov/authorities/names/','id.loc.gov/authorities/subjects/','id.loc.gov/vocabulary/relators/','id.loc.gov/resources/works/', 'id.loc.gov/bfentities/providers/','id.loc.gov/entities/providers/','id.loc.gov/authorities/genreForms'],
  "buildContextForWorksEndpoint": workContext,
  "enableUserTemplates" :true,
  "baseURI": "http://id.loc.gov/",
  "basedbURI": baseDBURI,
  "resourceURI": resourceURI,
  "profiles": [
     versoURL + "/configs?filter[where][configType]=profile"
  ],
  "startingPoints": [
    {"menuGroup": "Monograph",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:Monograph:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:Monograph:Work" ]
       }

     ]},
    {"menuGroup": "Notated Music",
     "menuItems": [
       {
         label: "Create Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:NotatedMusic:Work" ]
       },
       {
         label: "Create RDA Expression",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:NotatedMusic:Expression" ]
       },
       {
         label: "Create Instance", 
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:NotatedMusic:Instance" ]
       }
     ]},
    {"menuGroup": "Serial",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:Serial:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:Serial:Work" ]
       }

     ]},
    {"menuGroup": "Cartographic",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:Cartographic:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:Cartographic:Work" ]
       }

     ]},
    {"menuGroup": "Sound Recording: Audio CD",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:SoundRecording:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:SoundRecording:Work" ]
       }

     ]},
    {"menuGroup": "Sound Recording: Audio CD-R",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:SoundCDR:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:SoundCDR:Work" ]
       }

     ]},
    {"menuGroup": "Sound Recording: Analog",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:Analog:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:Analog:Work" ]
       }

     ]},
    {"menuGroup": "Moving Image: BluRay DVD",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:MIBluRayDVD:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:MIBluRayDVD:Work" ]
       }

     ]},
    {"menuGroup": "Moving Image: 35mm Feature Film",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:35mmFeatureFilm:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:35mmFeatureFilm:Work" ]
       }

     ]},
    {"menuGroup": "Rare Materials",
     "menuItems": [
       {
         label: "Instance",
         type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
         useResourceTemplates: [ "lc:RT:bf2:RareMat:Instance" ]
       },
       {
         label: "Work",
         type: ["http://id.loc.gov/ontologies/bibframe/Work"],
         useResourceTemplates: [ "lc:RT:bf2:RareMat:Work" ]
       }

     ]}
  ],
  "api": ["save", "publish", "retrieveLDS", "retrieve", "deleteId"],
  "return": {
    "format": "jsonld-expanded",
    "callback": myCB
  }
}
