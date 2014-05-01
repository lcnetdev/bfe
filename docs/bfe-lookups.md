`bfe` Lookups
----------------

A `bfe` lookup is a Javascript file that contains logic to fetch typeahead suggestions,
format those suggestions for display, and, after a suggestion is selected, a 
lookup performs post-selection processing and returns the data to the editor.

The best thing to do is look at an example:

https://github.com/lcnetdev/bfe/blob/master/src/lookups/rdacarriers.js

**Note**: The above file calls a helper file, in which some of the magic happens.

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
  one parameter, which is an array of triples formatted according to the [`bfestore`][bfestore].
  It is not necessary to include the `guid` property for each triple; that is added
  after the data is returned to the editor.

Lookups can be created and dynamically loaded at run time.  See [configuring 
`bfe`][configuring-bfe].  If a 'key' of a dynamically loaded lookup is the same 
as a pre-existing/pre-loaded lookup, the pre-loaded one is overwritten and not 
used.

<!-- section links -->

[bfestore]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-api.md#bfestore
[configuring-bfe]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-api.md#configuring-bfe
