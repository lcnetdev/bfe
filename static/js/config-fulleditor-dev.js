function myCB(data) {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

/* Config object profiles
 * Editor profiles are read from a WS endpoint
 * The data are expected to be in a JSON array, with each object
 * in the array containing a "json" property that has the profile
 * itself.
 */
var rectobase = "http://localhost:3000";
var baseDBURI;
var resourceURI;
var workContext;
var loadmarc=false;
var buildcontext = true;
var enableusertemplates=true;

var name = "config";

baseDBURI = "https://preprod-8231.id.loc.gov"
resourceURI = baseDBURI + "/resources";
workContext = resourceURI + "/works/";  // This is unused?

var versobase = "https://preprod-3001.id.loc.gov/verso";

var save = {
        callback: function (data, bfelog, callback) {
            alert("Hello there");
            alert(JSON.stringify(data));
    }
};

var startingPoints =
    [
        {
            "menuGroup":"Hub",
            "menuItems":[
                {
                    "label":"Hub",
                    "type":["http://id.loc.gov/ontologies/bflc/Hub"],
                    "useResourceTemplates":["lc:RT:bf2:Hub:Hub"]
                }
            ]
        },
        {
            "menuGroup":"Monograph",
            "menuItems":[
                {
                    "label":"Instance",
                    "type":["http://id.loc.gov/ontologies/bibframe/Instance"],
                    "useResourceTemplates":["lc:RT:bf2:Monograph:Instance"]
                },
                {
                    "label":"Work",
                    "type":["http://id.loc.gov/ontologies/bibframe/Work"],
                    "useResourceTemplates":["lc:RT:bf2:Monograph:Work"]
                }
            ]
        },
        {
            "menuGroup":"Monograph (Non-Latin)",
            "menuItems":[
                {
                    "label":"Instance",
                    "type":["http://id.loc.gov/ontologies/bibframe/Instance"],
                    "useResourceTemplates":["lc:RT:bf2:MonographNR:Instance"]
                },
                {
                    "label":"Work",
                    "type":["http://id.loc.gov/ontologies/bibframe/Work"],
                    "useResourceTemplates":["lc:RT:bf2:MonographNR:Work"]
                }
            ]
        },
        {
            "menuGroup":"Notated Music",
            "menuItems":[
                {
                    "label":"Create Work",
                    "type":["http://id.loc.gov/ontologies/bibframe/Work"],
                    "useResourceTemplates":["lc:RT:bf2:NotatedMusic:Work"]
                },
                {
                    "label":"Create Instance",
                    "type":["http://id.loc.gov/ontologies/bibframe/Instance"],
                    "useResourceTemplates":["lc:RT:bf2:NotatedMusic:Instance"]
                }
            ]
        }
    ];

/*
    removeOrphans will strip triples of the first or second template when loading
    multiple templates in this fashion.  Probably should only permit one.
*/
/*
var toload = {
    "defaulturi": "http://id.loc.gov/resources/works/5226",
    "templates": [
        {
            "templateID": "lc:RT:bf2:MonographNR:Work"
        }
    ],
    "source": {
        "location": "http://id.loc.gov/resources/works/5226.json",
        "requestType": "json",
        "data": "UNUSED, BUT REMEMBER IT"
    }
};
*/
var toload = {
    "defaulturi": "http://id.loc.gov/resources/hubs/f60eb10317b7c78642d32f7e2851653b",
    "templates": [
        {
            "templateID": "lc:RT:bf2:Hub:Hub"
        }
    ],
    "source": {
        "location": "https://id.loc.gov/resources/hubs/f60eb10317b7c78642d32f7e2851653b.bibframe_edit.json?test",
        "requestType": "json",
        "data": "UNUSED, BUT REMEMBER IT"
    }
};
var toload = {
    "templates": [
        {
            "templateID": "lc:RT:bf2:Monograph:Work"
        }
    ]
};
//toload = {};

var config = {
     "logging": {
      "level": "DEBUG",
      "toConsole": true
     },
    "name": name,
    "url" : rectobase,
    "baseURI": "http://id.loc.gov/",
    "basedbURI": "https://preprod-8230.id.loc.gov/",
    "resourceURI": "https://preprod-8288.loc.gov/",
    "buildContext": true,
    "buildContextFor": [
            'id.loc.gov/authorities/names/',
            'id.loc.gov/authorities/subjects/',
            'id.loc.gov/authorities/childrensSubjects',
            'id.loc.gov/vocabulary/relators/',
            'id.loc.gov/resources/works/',
            'id.loc.gov/bfentities/providers/',
            'id.loc.gov/entities/providers/',
            'id.loc.gov/authorities/genreForms'
    ],
    "enableUserTemplates": false,
    "enableCloning": false,
    "enableAddProperty": false,

    "toload": toload,

    // "startingPointsUrl": versobase + "/api/configs?filter[where][configType]=startingPoints&filter[where][name]=" + name,
    "startingPoints": startingPoints,
    "literalLangDataUrl": versobase + '/api/configs?filter[where][configType]=literalLangData',
    "profiles": [
        versobase + "/api/configs?filter[where][configType]=profile"
    ],
    "save": save,
    "api": ["setStartingPoints", "load"],
    "return": {
        "format": "jsonld-expanded",
        "callback": myCB
    }
}
