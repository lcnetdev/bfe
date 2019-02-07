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


#### bfe.fulleditor(Object configObject, String divid) 

Invokes the "full editor," meaning a left-side navigation menu will be included.
See [below](#configuring-bfe) for more about the `config` object.  `id` is the 
identifier of the HTML element into which the editor will be loaded.  Use a `div`.

```javascript
var bfeditor = bfe.fulleditor(configObject, divid);
```


#### bfe.editor(Object configObject, String divid) 

Invokes only the `form` component of the "editor," meaning a left-side navigation 
menu will *not* be included. See [below](#configuring-bfe) for more about the 
`config` object.  `id` is the identifier of the HTML element into which the editor 
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
* `startingPoints` (only for fulleditor): (Array) Each member of the array is an object representing 
  a menu group, which consists of a heading (`menuGroup`) and an array of 
  items (`menuItems`). Each item has a `label` and an array of applicable 
  resource templates (`useResourceTemplates`) to be used when rendering that item.
  `useResourceTemplates` expects the identifier value of a resource template (not 
  the identifer for a Profile).  If more than one resource template identifier is 
  listed, then the multiple resource templates are combine into one form for 
  editing.  
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

Optional
* `basedbURI`: URI for posting triples for publication in a triplestore
* `resourceURI`: Base URI for resources in the triplestore.
* `logging`: (Object) with two properties.  `level` indicates the level of logging 
  desired.  INFO and DEBUG are the two options.  DEBUG is verbose.  Default is 
  INFO.  `toConsole` is a boolean value.  "True" will write the output to the 
  Javascript console during runtime.  Default is "True". 
* lookups: (Object) an object of objects. The object's key is a scheme identifier used or 
  expected to be used with the useValuesFrom property constraint from a property in a 
  property template which is part of a profile's resource template. Each object consists of 
  two properties. name is a label/identifier for the lookup. It is used by the typeahead library. 
  load is the location of the Javascript file the contains the functions required to populate 
  the typeahead drop down selection list and then to process the selected item. 

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



