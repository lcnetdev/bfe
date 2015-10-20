bfe.define('src/bfestore', ['require', 'exports', 'module' , 'src/lib/lodash.min'], function(require, exports, module) {
    require("src/lib/lodash.min");

    exports.store = [];
    
    exports.storeDedup = function() {
        exports.store = _.uniq(exports.store, function(t) { 
            if (t.olang !== undefined) {
                return t.s + t.p + t.o + t.otype + t.olang
            } else if (t.odatatype !== undefined) {
                return t.s + t.p + t.o + t.otype + t.odatatype
            } else {
                return t.s + t.p + t.o + t.otype
            }
        });
        return exports.store;
    }
    
    exports.jsonld2store = function(jsonld) {
        jsonld.forEach(function(resource){
            var s = typeof resource["@id"] !== 'undefined' ? resource["@id"] : '_:b' + guid();
            for (var p in resource) {
                if (p !== "@id") {
                    resource[p].forEach(function(o) {
                        var tguid = guid();
                        var triple = {};
                        triple.guid = tguid;
                        triple.s = s;
                        triple.p = p;
                        if (o["@id"] !== undefined) {
                            triple.o = o["@id"];
                            triple.otype = "uri";
                        } else if (o["@value"] !== undefined) {
                            triple.o = o["@value"];
                            triple.otype = "literal";
                            if (o["@language"] !== undefined) {
                                triple.olang = o["@language"];
                            }
                        }
                        exports.store.push(triple);
                        });
                    }
                }
            // If a resource does not have a defined type, do we care?
        });
        return exports.store;
    }

    
    exports.store2jsonldExpanded = function() {
        var json = [];
        exports.storeDedup();
        groupedResources = _.groupBy(exports.store, function(t) { return t.s; });
        for (var resourceURI in groupedResources) {
            var j = {};
            j["@id"] = resourceURI;
            groupedProperties = _.groupBy(groupedResources[resourceURI], function(t) { return t.p; });
            for (var propertyURI in groupedProperties) {
                var prop = propertyURI;
                if (propertyURI == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    prop = "@type";
                }
                j[prop] = [];
                groupedProperties[propertyURI].forEach(function(r) {
                    if (prop == "@type" && r.otype == "uri") {
                        j[prop].push(r.o);
                    } else if (r.otype == "uri") {
                        j[prop].push({"@id": r.o});
                    } else {
                        var o = {}
                        if (r.olang !== undefined && r.olang !== "") {
                            o["@language"] = r.olang;
                        }
                        if (r.p=="@type"){
                          o = r.o;
                        } else {
                           o["@value"] = r.o;
                        }
                        j[prop].push(o);
                    }
                });
            }
            json.push(j);
        };
        return json;
    }
    
    exports.store2text = function() {
        var nl = "\n";
        var nlindent = nl + "\t";
        var nlindentindent = nl + "\t\t";
        var predata = "";
        var json = exports.store2jsonldExpanded();
        json.forEach(function(resource) {
            predata += nl + "ID: " + resource["@id"];
            if (resource["@type"] !== undefined) {
                predata += nlindent + "Type(s)";
                resource["@type"].forEach(function(t) {
                    //predata += nlindentindent + t["@id"];
                    if(t["@value"] !== undefined){
                        predata += nlindentindent + t["@value"];
                    } else {
                        predata += nlindentindent + t;
                    }
                });
            }
            for (var t in resource) {
                if (t !== "@type" && t !== "@id") {
                    var prop = t.replace("http://bibframe.org/vocab/", "bf:");
                    prop = prop.replace("http://id.loc.gov/vocabulary/relators/", "relators:");
                    prop = prop.replace("http://bibframe.org/vocab2/", "bf2:");
                    prop = prop.replace("http://rdaregistry.info/termList/", "rda");
                    predata += nlindent + prop;
                    resource[t].forEach(function(o) {
                        if (o["@id"] !== undefined) {
                            predata += nlindentindent + o["@id"];
                        } else {
                            predata += nlindentindent + o["@value"];
                        }
                    });
                }
            }
            predata += nl + nl;
        });
        return predata;
    }
    
    /**
    * Generates a GUID string.
    * @returns {String} The generated GUID.
    * @example GCt1438871386
    */
    function guid() {
        function _randomChoice() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            for (var i = 0; i < 1; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }
        return _randomChoice() + _randomChoice() + _randomChoice() + parseInt(Date.now() / 1000);
    }

});