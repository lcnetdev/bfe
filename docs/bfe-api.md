`bfe` API
----------------

`bfe` is a Javascript UI application that renders an HTML form based on defined 
Profiles.  There are things to know about configuring and using `bfe`.

Contents
-----------------

* [`bfe`](#bfe)
* [Configuring `bfe`](#configuring-bfe)
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


#### Example (Kitchen sink)

```javascript
{
    "baseURI": "http://example.org/",
    "profiles": [
        "/static/profiles/bibframe/Agents.json",
        "/static/profiles/bibframe/Annotations.json",
        "/static/profiles/bibframe/Authorities.json",
        "/static/profiles/bibframe/Entities.json",
        "/static/profiles/bibframe/WIA.json",
    ],
    "startingPoints": [
        {
            "menuGroup": "BIBFRAME Generic",
            "menuItems": [
                {
                    label: "New HeldItem", 
                    useResourceTemplates: [ "profile:bf:HeldItem" ]
                },
                {
                    label: "New Instance", 
                    useResourceTemplates: [ "profile:bf:Instance" ]
                },
                {
                    label: "New Work", 
                    useResourceTemplates: [ "profile:bf:Work" ]
                },
                {
                    label: "New Work, Instance, & HeldItem", 
                    useResourceTemplates: [ "profile:bf:Work", "profile:bf:Instance", "profile:bf:HeldItem" ]
                },
            ]
        }
    ],
    "lookups": {
        "http://id.loc.gov/authorities/names": {
            "name": "LCNAF",
            "load": "src/lookups/lcnames"
        },
        "http://id.loc.gov/authorities/subjects": {
            "name": "LCSH",
            "load": "src/lookups/lcsubjects"
        }
    },
    "load": [
        {
            "templateID": "profile:bf:Work",
            "defaulturi": "http://id.loc.gov/resources/bibs/5226",
            "source": {
                "location": "http://id.loc.gov/resources/bibs/5226.bibframe_raw.jsonp",
                "requestType": "jsonp"
            }
        },
        {
            "templateID": "profile:bf:Instance",
            "defaulturi": "_:b105resourcesbibs5226"
        }
    ],
    "return": {
        "format": "jsonld-expanded",
        "callback": myCB
    }
}
```

#### `config` Properties

Required
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
  editing.  For more about the distinction see the [BIBFRAME Profile Specification][profilespec].


Optional
* `baseURI`: (String) the base URI to use when minting new identifiers.  Defaults 
  to `http://example.org/`.
* `load`: (Array) Instructs which resource templates to automatically load into 
  the editor.  This is essential when using the "form only" editor.  Each member 
  of the `load` object contains minimally one property, `templateID`.
  `templateID` is the resource template identifier of the resource template to 
  be loaded.  Each resource template - each object - represents a resource. 
  If multiple objects are specified, the resource templates will be 
  combined and displayed as one large form, similar to identifing multiple resource 
  template identifiers of the `useResourceTemplates` property of a menu item (see 
  `startingPoints` above).  Each object may also specify a `defaultURI` to use 
  for the resource being loaded/edited.  In order to "edit" existing data, the 
  `source` property should be used.  `source` is an object that indicates the 
  `location` of the data to be loaded for editing and the `requestType`.  `location` 
  should be a full URL (content-negotation is not supported).  `requestType` may 
  be either 'jsonp' or 'json'.  'json' should only be used when not attempting a 
  cross-domain request.
* `logging`: (Object) with two properties.  `level` indicates the level of logging 
  desired.  INFO and DEBUG are the two options.  DEBUG is verbose.  Default is 
  INFO.  `toConsole` is a boolean value.  "True" will write the output to the 
  Javascript console during runtime.  Default is "True".
* `lookups`: (Object) an object of objects.  The object's key is a scheme identifier
  used or expected to be used with the `useValuesFrom` property constraint from 
  a property in a property template which is part of a profile's resource template.
  For more about the `useValuesFrom` property, see the [Profile Specification][profilespec].
  Each object consists of two properties.  `name` is a label/identifier for the lookup.
  It is used by the typeahead library.  `load` is the location of the Javascript 
  file the contains the functions required to populate the typeahead drop down
  selection list and then to process the selected item.  You can read more about [lookups 
  here][lookups-info].
  

<!-- section links -->

[profilespec]: http://bibframe.org/documentation/bibframe-profilespec/
[lookups-info]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-lookups.md

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

#### bfe.bfestore.storeDedup()

Returns the store after deduping.  Nominally clears the store of duplicate triples.
It is usually not necessary to call this; the store is deduped before calling the 
below methods.

#### bfe.bfestore.store2text()

Returns the store formatted as text.  This is a throw away function designed to 
provide quick and dirty human-readable access to the data in the store.

#### bfe.bfestore.store2jsonldExpanded()

Returns the store as JSON object formatted according to jsonld expanded syntax.

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


