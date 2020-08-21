`bfe` API
----------------

`bfe` is a Javascript UI application that renders an HTML form based on defined 
Profiles.  There are things to know about configuring and using `bfe`.

Contents
-----------------

* [`bfe`](#bfe)
* [Configuring `bfe`](#configuring-bfe)
* [`bfelookup`](#bfelookup)
* [`bfestore`](#bfestore)
* [`bfelog`](#bfelog)


----------------

### `bfe`

The defined, Javascript namespace for `bfe` when loaded.

#### bfe.lcapplication(Object configObject, String divid) 

Invokes the "LC Application." This mode includes an entire tab-mased menu to load records
from various LC-specific sources, such as LC's bibframe database, OCLC, etc.
*This mode will not work for any user but LC.*  It will also include all of the 
`fulleditor` mode.  See [below](#configuring-bfe) for more about the `configObject`.  
`id` is the identifier of the HTML element into which the editor will be loaded. 
Use a `div`.

```javascript
var bfeditor = bfe.fulleditor(Object configObject, divid);
```

#### bfe.fulleditor(Object configObject, String divid) 

Invokes the "full editor," meaning a left-side navigation menu will be included.
See [below](#configuring-bfe) for more about the `configObject`.  `id` is the 
identifier of the HTML element into which the editor will be loaded.  Use a `div`.

```javascript
var bfeditor = bfe.fulleditor(Object configObject, divid);
```


#### bfe.editor(Object configObject, String divid) 

Invokes only the `form` component of the "editor," meaning a left-side navigation 
menu will *not* be included. See [below](#configuring-bfe) for more about the 
`configObject`.  `id` is the identifier of the HTML element into which the editor 
will be loaded.  Use a `div`.

```javascript
var bfeditor = bfe.editor(configObject, divid);
```

----------------

### Configuring `bfe`

The `config` object is a JSON Object that, minimally, identifies which Profiles 
to load and, if invoking the "full editor," the structure of the left-side menu.
Providing a `return` description is generally necessary in order to provide a 
callback function for when the user hits the `save` button.

#### `config` Properties

Required

* `url`: (String) the url for the server, which in the example config is set to 
  rectoBase, which by default is `http://localhost:3000`, or the value of RECTOBASE
  which is set in env.js by env.sh.

* `baseURI`: (String) the base URI to use when minting new identifiers.  Defaults 
  to `http://example.org/`.

* `literalLangDataUrl`: (String) Url to a JSON structure that contains config information
  for language and scripts to handle non-latin cataloging.  QUESTION: Why is this 
  handled this way?  It's inherent functionality.

* `profiles`: (Array) locations (URLs) of Profiles to be
  loaded. Profiles should be in the form of a JSON array with one or
  more objects that contain a "name" and a "json" property with the
  profile itself. For example:

```json
[
  {
    "name": "BIBFRAME 2.0 Agent",
    "json": {
      "Profile": {
        [...]
      }
    }
  }
]
```

* `return`: (Object) contains two properties.  `format`, which indicates how the 
  the data should be formatted/serialized.  Only "jsonld-expanded" is supported 
  presently.  `callback` is the name of the callback function, which expects one 
  parameter, the returned data formatted according to the `format` instruction.

* `startingPoints` (only for fulleditor or lcapplication): (Array) Each member of the 
  array is an object representing 
  a menu group, which consists of a heading (`menuGroup`) and an array of 
  items (`menuItems`). Each item has a `label` and an array of applicable 
  resource templates (`useResourceTemplates`) to be used when rendering that item.
  `useResourceTemplates` expects the identifier value of a resource template (not 
  the identifer for a Profile).  If more than one resource template identifier is 
  listed, then the multiple resource templates are combined into one form for 
  editing.  This property must be present OR `startingPointsUrl` must be present.

```json
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

     ]}
   ]
```

* `startingPointsUrl` (only for fulleditor or lcapplication): (Array) A URL
  that provides a JSON object that contains the `startingPoints` array as described
  above.  This property must be present OR `startingPoints` must be present.
  The JSON should be structured as follows:

```json
[
    {
        "id":"d1ab69a1-fe18-40d6-b596-40039a1144ae",
        "name":"config",
        "configType":"startingPoints",
        "json": [
            {
                "menuGroup": "Monograph",
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
                ]
            }
        ]
    }
]
```

Optional
* `basedbURI`: Used to determine whether the "Search BIBFRAME database" link appears
  and where the link goes.
* `buildContext`: (Boolean) True to build typeahead side panels, which provide more 
  information - context - about the highlighted drop down option to assist with selection. 
  Defaults to `false`. 
* `buildContextFor`: (Array) An array of strings that, when tested against a URI, will return `True` if a context panel
  should be generated for that particular URI.  For example, this array - `['id.loc.gov/authorities/names/','id.loc.gov/authorities/subjects/']`- 
  would generate a context panel for any Names or Subjects URI/Resource.
* `buildContextForWorksEndpoint`: (String) This is a custom override for LC to redirect context panel requests from resources
  at ID.LOC.GOV to an internal source.  QUESTION: Is this necessary still or could we use the ID data?
* `enableUserTemplates`: (Boolean)  This will permit users to generate their own "templates," which is a means to hide not-required fields in
  a chosen profile.  Default "true".
* `enableLoadMarc`: (Boolean) This option - really only useful to LC - will enable the "Load MARC" tab in the `lcapplication` (see above).
* `logging`: (Object) with two properties.  `level` indicates the level of logging 
  desired.  INFO and DEBUG are the two options.  DEBUG is verbose.  Default is 
  INFO.  `toConsole` is a boolean value.  "True" will write the output to the 
  Javascript console during runtime.  Default is "True". 
* lookups: (Object) an object of objects. The object's key is a scheme identifier used or 
  expected to be used with the useValuesFrom property constraint from a property in a 
  property template which is part of a profile's resource template. Each object consists of 
  two properties. name is a label/identifier for the lookup. It is used by the typeahead library. 
  load is the location of the Javascript file the contains the functions required to populate 
  the typeahead drop down selection list and then to process the selected item.  QUESTION: It
  is really hard to tell if this would even work any more.  Will it?
* `oclckey`: (String) This holds the OCLC developer's key and is used to fetch MARC records from OCLC.  Used by `lcapplication` (see above).
* `resourceURI`: Base URI for resources in the triplestore.
* `toload`: Object that contains the template to load and the resource to load (i.e. populate the form)
```json
{
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
}
```

<!-- section links -->
----------------

### `bfelookup` 

`bfe` Lookups
----------------

A `bfe` lookup is a Javascript function that contains logic to fetch typeahead suggestions,
format those suggestions for display, and, after a suggestion is selected, a
lookup performs post-selection processing and returns the data to the editor.

Each lookup must contain three exported objects:

* `scheme` - (String) representing the scheme identifier.  This is used to match 
  the lookup with the appropriate declaration in the `useValuesFrom` declaration
  in the profile.
* `source` - (Function) expects two parameters - `query, process` - and 
  ultimately returns a list of objects each with a `uri` property and `value` 
  property, the latter containing the humand readable text to display.
* `getResource` - (Function) expects four parameters: `subjecturi, propertyuri, 
  selected, process`. `subjecturi` is the URI for the resource being described.  
  `propertyuri` is the property uri of the property that invoked the lookup.
  `selected` is the selected item, it has two properties `uri` and `value`, about 
  which see `source` above.  Finally, `process` is the callback.  At the end, `process` is called with 
  one parameter, which is an array of triples formatted according to the [`bfestore`](#bfestore).
  It is not necessary to include the `guid` property for each triple; that is added
  after the data is returned to the editor.

Lookups can be created and dynamically loaded at run time.  See [configuring 
`bfe`](#configuring-bfe).  If a 'key' of a dynamically loaded lookup is the same 
as a pre-existing/pre-loaded lookup, the pre-loaded one is overwritten and not 
used.

<!-- section links -->

----------------

### `bfestore`

The `bfestore` is an in-memory store of the data being created or modified.  If 
data is loaded for editing, the store is populated with that data.  As data is 
otherwise created, deleted, or modified during an editing session, the store is 
updated accordingly.  `bfestore` provides a few methods for accessing the data.

#### bfe.bfestore.store

Is the store itself.  The store is an array of triples of the following form.

```javascript
[
 {
  "guid": "79d84d4c-9752-fecd-9d79-91455a552dc5",
  "rtID": "profile:bf:Instance",
  "s": "http://example.org/79d84d4c-9752-fecd-9d79-91455a552dc5",
  "p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  "o": "http://bibframe.org/vocab/Instance",
  "otype": "uri"
 },
 {
  "guid": "0dfcafb2-1a0c-e190-a372-7423675dd9c0",
  "s": "http://example.org/79d84d4c-9752-fecd-9d79-91455a552dc5",
  "p": "http://bibframe.org/vocab/title",
  "o": "Some title",
  "otype": "literal",
  "olang": "en"
 }
]
```
#### bfe.bfestore.jsonld2store
Expects expanded jsonld, and converts the jsonld to an array of triples.

#### bfe.bfestore.rdfxml2store
Using ajax  uses `http://rdf-translator.appstpot.com` to convert rdfxml to jsonld, which used the helper function `jsonldcompascted2store` to expand the jsonld and normalize blanknodes and identifiers. Used with Load Marc in editor.

#### bfe.bfestore.store2rdfxml

Using jsonld, converts the jsonld to nquads, which is converted to turtle by N3.js. The prefixes are set and the turtle
is sent to rapper using a rest api on recto. Used in the preview pane.

#### bfe.bfestore.n32store

Using N3.js, convert n3/turtle to quads, which is passed to jsonld, expanded and pushed into the bfestore.

#### bfe.bfestore.store2turtle()

Returns the store formatted as turtle, for use in the preview pane.

#### bfe.bfestore.store2jsonldcompacted 
Returns the store formatted as compacted jsonld, for use in the preview pane.

----------------

### `bfelog`

`bfelog` manages INFO and DEBUG logging for `bfe`.  See the 
[`bfe` config options above](#configuring-bfe) for more information about setting 
logging levels. `bfelog` was put together quickly and is a candidate for serious 
rethinking.

#### bfe.bfelog.getLog()

Returns the log as a JSON object.  Sample:

```javascript
[
 {
  "dt": "2014-05-01T14:02:33.477Z",
  "dtLocaleSort": "2014-05-01T14:02:33.477Z",
  "dtLocaleReadable": "5/1/2014, 10:02:33 AM",
  "type": "INFO",
  "fileName": "src/bfelogging.js",
  "lineNumber": 23,
  "msg": "Logging instantiated: level is DEBUG; log to console is set to true"
 },
 {
  "dt": "2014-05-01T14:02:33.486Z",
  "dtLocaleSort": "2014-05-01T14:02:33.486Z",
  "dtLocaleReadable": "5/1/2014, 10:02:33 AM",
  "type": "INFO",
  "fileName": "src/bfelogging.js",
  "lineNumber": 24,
  "msg": "http://localhost:8000/"
 },
 {
  "dt": "2014-05-01T14:02:33.486Z",
  "dtLocaleSort": "2014-05-01T14:02:33.486Z",
  "dtLocaleReadable": "5/1/2014, 10:02:33 AM",
  "type": "INFO",
  "fileName": "src/bfe.js",
  "lineNumber": 126,
  "msg": "Loading profile: /static/profiles/bibframe/Agents.json"
 }
]
```



