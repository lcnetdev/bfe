[bfe][demo-page]
=======================

`bfe` is a standalone Editor for the Library of Congress's [Bibliographic Framework 
(BIBFRAME) Initiative][bfi].  It can be used more generically as an editor for RDF data. 
`bfe` uses [BIBFRAME Profiles][profilespec] to render an HTML/UI input form; it is 
capable of integrating 'lookup' services, which query data from external Web APIs;
and implementers can define the input and extract the output.

This repository includes a development example, a "production" example, and 
various BIBFRAME Profiles with which to begin experimenting. In order 
to get started with `bfe` quickly and easily, there are two main aspects of `bfe`: 
a javascript library and an accompanying CSS file.  The packaged javascript 
library bundles a few additional libraries, some of which are [JQuery], [Lo-Dash], 
elements from Twitter's [Bootstrap.js][Bootstrap], and 
Twitter's [typeahead.js].  The CSS bundle includes mostly elements of 
Twitter's [Bootstrap] and a few additional custom CSS declarations.

<!-- section links -->

[demo-page]: http://bibframe.org/tools/editor/
[bfi]: http://www.loc.gov/bibframe/
[profilespec]: http://bibframe.org/documentation/bibframe-profilespec/
[JQuery]: http://jquery.com/
[Lo-Dash]: http://lodash.com/
[Bootstrap]: http://getbootstrap.com/
[typeahead.js]: https://github.com/twitter/typeahead.js


Getting Started
---------------

`bfe` should be run on or within a server.  To run the demo or development version, 
you can use the simple nodejs-based server - found in the main `bfe` directory - 
that ships with `bfe`:

```bash
node server-bfe.js
```
or something like Python's SimpleHTTPServer:

```bash
python -m SimpleHTTPServer
```

As for integrating `bfe` with your own project, take a look at the `index.html` 
file.  Pay particular attention to the includes - the javascript file and CSS - 
at the top of the page.  Those includes and the little bit of configuration below 
those includes is all that is needed.  

If you do not want to clone this repository and use it locally, then, in order 
to acquire those includes, you should download the minified, raw versions from the 
`builds` directory:
* Javascript - https://github.com/lcnetdev/bfe/blob/master/builds/bfe-0.0.1.min.js
* CSS - https://github.com/lcnetdev/bfe/blob/master/builds/bfe-0.0.1.min.css

There are also non-minified versions available.


Documentation 
-------------

* [API]
* [Lookups][lookups-info]

[API]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-api.md
[lookups-info]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-lookups.md


Demo?
--------

[Absolutely.][demo-page]

<!-- section links -->

[demo-page]: http://bibframe.org/tools/editor/


Browser Support
---------------

* Chrome 34
* Firefox 24+
* Safari - UNKNOWN
* Internet Explorer 10+ - UNKNOWN
* Opera - 12+

**NOTE:** `bfe` has not been tested in all browsers, not to mention mobile ones.


**NOTE:** `bfe` has also not been **thoroughly** tested in the browsers for which
support is currently listed.  It has been developed primarily in Firefox 29.


**NOTE:** `bfe` will not work in IE versions 8 and 9, for certain.


Issues
------

Oh, there will most certainly be issues.  Log them here:

https://github.com/lcnetdev/bfe/issues


Support
----------------

For technical questions about `bfe`, you can use the GitHub [Issues] feature, but 
please "label" your question a 'question.'

Although you are encouraged to ask your quesion publicly (the answer might 
help everyone), you may also email this repository's [maintainer][kefo] 
directly or tweet him at [@3windmills]. 

For general questions about BIBFRAME, you can subscribe to the [BIBFRAME Listserv][listserv] 
and ask in that forum.

<!-- section links -->

[Issues]: https://github.com/lcnetdev/bfe/issues
[kefo]: mailto:kefo@3windmills.com
[@3windmills]: https://twitter.com/3windmills
[listserv]: http://listserv.loc.gov/cgi-bin/wa?SUBED1=bibframe&A=1


Version and Versioning
----------

Builds are numbered and committed with the following format:

`<major>.<minor>.<patch>`

Usually, the numbering would follow that:

* The major increases when backwards compatibility breaks
* An increase of the minor indicates a new addition or feature
* The patch increases for bug fixes and other miscellaneous changes.

Considerable development is expected in the next few weeks during which time 
backwards compatibility could easily be broken, though this will be avoided whenever 
possible.  There will be no commitment to ensuring 'backwards compatibility' until 
the `<major>` reaches '1'.  Do not live link (now or in general).


Testing
-------

Ha!

Joking aside, some kind of testing support is being investigated.


Roadmap
----------

In no particular order:

* Implement the entire [BIBFRAME Profile Specification][profilespec]. `bfe` does 
  not currently.
* Support for the notion of "sessions," to capture administrative metadata.
* Implement automated testing.
* Create additional lookups for bundling (for VIAF, FAST, etc), so such lookups
  ship with `bfe`.
* Code clean up, refactoring, and documentation.  As this README is being 
  written (30 April 2014), `bfe`'s code is all of 5 weeks old.  It was written 
  very quickly (during a period that included a 10-day hiatus) and it shows.


<!-- section links -->

[profilespec]: http://bibframe.org/documentation/bibframe-profilespec/


Developers
----------

You are all most welcome.  

From a design standpoint, the objective with `bfe` is to create the simplest 
'pluggable' form editor one can to maximize experimental implementer's abilities 
to create/edit BIBFRAME data.  It might be a little weighty as a result, but 
ease-of-use is the objective.  Still, there's lots to do and the roadmap above includes 
a few of those things.  

All contributions are welcome.  If you do not code, surely you will discover an 
[issue] you can report.  Do you manage a Linked Data Service/API?  Perhaps you might 
contribute a [Lookup].  

`development.html` does not use the bundled javascript library but instead loads 
all the required files dynamically and is meant - as its name would suggest - 
for development purposes.  

'Building' `bfe` requires [node.js].  See `package.json` for dependencies, the 
main one being Mozilla's [dryice].

<!-- section links -->

[issue]: https://github.com/lcnetdev/bfe/issues
[Lookup]: https://github.com/lcnetdev/bfe/tree/master/src/lookups
[node.js]: http://nodejs.org/
[dryice]: https://github.com/mozilla/dryice


Acknowledgements
----------

In addition to all the good people who have worked on [JQuery], [Lo-Dash], 
Twitter's [Bootstrap], Twitter's [typeahead.js], [require.js], [dryice], and 
more, all of whom made this simpler, special recognition needs to 
go to the developers who have worked on [Ajax.org's Ace editor][ace] and 
the fine individuals at [Zepheira].

Using `require.js`, `Ace`'s developers figured out a great way to bundle their code 
into a single distributable.  `Ace`'s methods were studied and emulated, and when 
that wasn't enough, their code was ported (with credit, of course, and those 
snippets were ported only in support of building the package with `dryice`).  The 
`Ace`'s devs also just have a really smart way of approaching this type of 
javascript project.

In late 2013, and demoed at the American Library Association's Midwinter Conference,
Zepheira developed a prototype BIBFRAME Editor.  Although that project never moved 
beyond an experimental phase, Zepheira's work was nevertheless extremely influential, 
especially with respect to `bfe`'s UI design. (None of the code in `bfe` was ported 
from Zepheira's prototype.)  Zepheira also developed the [BIBFRAME Profile 
Specification][profilespec].

<!-- section links -->

[JQuery]: http://jquery.com/
[Lo-Dash]: http://lodash.com/
[Bootstrap]: http://getbootstrap.com/
[typeahead.js]: https://github.com/twitter/typeahead.js
[require.js]: http://requirejs.org/
[dryice]: https://github.com/mozilla/dryice
[ace]: https://github.com/ajaxorg/ace
[Zepheira]: https://zepheira.com/
[profilespec]: http://bibframe.org/documentation/bibframe-profilespec/


Contributors
-----------

* [Jeremy Nelson](https://github.com/jermnelson)
* **Your name could be here!**


Maintainer
-----------

* **Kevin Ford** 
  * [GitHub](https://github.com/kefo)
  * [@3windmills](https://twitter.com/3windmills) 


Author
-------

* **Kevin Ford** 
  * [GitHub](https://github.com/kefo)
  * [@3windmills](https://twitter.com/3windmills) 


License
-------

Unless otherwise noted, code that is original to `bfe` is in the Public Domain.

http://creativecommons.org/publicdomain/mark/1.0/

**NOTE:**  `bfe` includes or depends on software from other open source projects, all or 
most of which will carry their own license and copyright.  The Public Domain mark 
stops at `bfe` original code and does not convey to these projects.

See a more detailed itemization of the licensing breakdown at:

https://github.com/lcnetdev/bfe/tree/master/LICENSE.txt

