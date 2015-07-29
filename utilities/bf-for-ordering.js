var request = require('request');
var lodash = require("lodash");

var bfOrdered = {};

request.get("http://bibframe.org/vocab.json", function(error, response, body) {
    //console.log("Got response: " + response.statusCode);
    var resources = JSON.parse(response.body);
    processResources(resources);
});

function processResources(resources) {
    
    var bfClasses = lodash.where(resources, {"@type": ["http://www.w3.org/2000/01/rdf-schema#Class"]});
    bfClasses.sort(orderOnIDsAtoZ);
    
    bfClasses.forEach(function(bfClass) {
        var deletedClass = false;
        if (bfClass["http://purl.org/dc/terms/modified"] !== undefined) {
            bfClass["http://purl.org/dc/terms/modified"].forEach(function(m) {
                if (m["@value"].match(/delete/i)) deletedClass = true;
            });
        }
        
        if (!deletedClass) {
            var cURI = bfClass["@id"];
            bfOrdered[cURI] = [];
            
            // Ultimately, get properties from any superclasses
            getSuperClasses(resources, bfClass, cURI);

            // Get the props for this resource.
            getProps(resources, cURI, cURI);
            
        }
    });
    
    bfOrdered["floaters"] = [];
    var bfProperties = lodash.where(resources, {"@type": ["http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"]});
    bfProperties.sort(orderOnIDsAtoZ);
    bfProperties.forEach(function(p) { 
        if (p["http://www.w3.org/2000/01/rdf-schema#domain"] === undefined) {
            var deletedProp = false;
            if (p["http://purl.org/dc/terms/modified"] !== undefined) {
                p["http://purl.org/dc/terms/modified"].forEach(function(m) {
                    if (m["@value"].match(/delete/i)) deletedProp = true;
                });
            }
           if (!deletedProp) {
                bfOrdered["floaters"].push(p["@id"]);
            }
        }
    });
    
    console.log(JSON.stringify(bfOrdered, undefined, " "));
}

function getProps(resources, cURI, scURI) {
    var properties = lodash.where(resources, {"http://www.w3.org/2000/01/rdf-schema#domain": [{"@id": scURI}]});
    properties.sort(orderOnIDsAtoZ);
    properties.forEach(function(p) {
    var deletedProp = false;
        if (p["http://purl.org/dc/terms/modified"] !== undefined) {
            p["http://purl.org/dc/terms/modified"].forEach(function(m) {
                if (m["@value"].match(/delete/i)) deletedProp = true;
            });
        }
        if (!deletedProp) {
            bfOrdered[cURI].push(p["@id"]);
        }
    });
}


function getSubProps(resources, cURI, pID) {
    var subprops = lodash.where(resources, {"http://www.w3.org/2000/01/rdf-schema#subPropertyOf": [{"@id": pID}]});
    subprops.sort(orderOnIDsAtoZ);
    subprops.forEach(function(sp) {
        var deletedSubProp = false;
        if (sp["http://purl.org/dc/terms/modified"] !== undefined) {
            sp["http://purl.org/dc/terms/modified"].forEach(function(m) {
                if (m["@value"].match(/delete/i)) deletedSubProp = true;
            });
        }
        if (!deletedSubProp) {
            bfOrdered[cURI].push(sp["@id"]);
            getSubProps(resources, cURI, sp["@id"]);
        }
    });
}

function getSuperClasses(resources, bfClass, cURI) {
    if (bfClass["http://www.w3.org/2000/01/rdf-schema#subClassOf"] !== undefined) {
        bfClass["http://www.w3.org/2000/01/rdf-schema#subClassOf"].forEach(function(sc) {
            var scURI = sc["@id"];
            
            // Do this now so they are on 'top'
            var superClasses = lodash.where(resources, {"@id": scURI});
            superClasses.forEach(function(superClass) {
                getSuperClasses(resources, superClass, cURI);
            });
            
            getProps(resources, cURI, scURI);
            
        });
    }
}

function orderOnIDsAtoZ(a, b) {
    return a["@id"] > b["@id"] ? 1 : -1;
}
