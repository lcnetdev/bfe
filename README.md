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
you can use the simple express-based server - found in the main `bfe` directory - 
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
* Javascript - https://github.com/lcnetdev/bfe/blob/v0.2.0/builds/bfe.min.js
* CSS - https://github.com/lcnetdev/bfe/blob/v0.2.0/builds/bfe.min.css


Documentation 
-------------

* [API]
* [Lookups][lookups-info]

[API]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-api.md
[lookups-info]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-lookups.md


Demo?
--------

[Online Demo][demo-page]

<!-- section links -->

[demo-page]: http://bibframe.org/tools/editor/


Browser Support
---------------

* Chrome 34
* Firefox 24+
* Safari - 6+
* Internet Explorer 10+
* Opera - 12+

**NOTE:** `bfe` has also not been **thoroughly** tested in the browsers for which
support is currently listed.  It has been developed primarily in Chrome.
It has been tested in both Chrome and Safari mobile versions.


Issues
------

Log them here:

https://github.com/lcnetdev/bfe/issues


Support
----------------

For technical questions about `bfe`, you can use the GitHub [Issues] feature, but 
please "label" your question a 'question.'

Although you are encouraged to ask your quesion publicly (the answer might 
help everyone), you may also email this repository's [maintainer][khes] 
directly. 

For general questions about BIBFRAME, you can subscribe to the [BIBFRAME Listserv][listserv] 
and ask in that forum.

<!-- section links -->

[Issues]: https://github.com/lcnetdev/bfe/issues
[khes]: mailto:khes@loc.gov
[listserv]: http://listserv.loc.gov/cgi-bin/wa?SUBED1=bibframe&A=1


Roadmap
----------
v0.2.x
* Support LC Bibframe Pilot
* Request.js has been deprecated
* Dryice build has been replaced with Grunt.

v0.3.x
* Document config.js
* Refactor bfelookups.js into more generic component.
* Implement save/load api

v0.4.x
* Implement v2.0 of vocabulary.
* Rewrite editor using Angular.js.
* Implement automated testing.

Developers
----------

From a design standpoint, the objective with `bfe` is to create the simplest 
'pluggable' form editor one can to maximize experimental implementer's abilities 
to create/edit BIBFRAME data.  It might be a little weighty as a result, but 
ease-of-use is the objective.  Still, there's lots to do and the roadmap above includes 
a few of those things.  

All contributions are welcome.  If you do not code, surely you will discover an 
[issue] you can report.  

'Building' `bfe` requires npm, bundled with [node.js] and [grunt].  See `package.json` for dependencies. 
See `Gruntfile.json` for build dependencies.

Basic build steps:
* npm init
* npm install
* grunt

<!-- section links -->

[issue]: https://github.com/lcnetdev/bfe/issues
[Lookup]: https://github.com/lcnetdev/bfe/tree/master/src/bfelookups.js
[node.js]: http://nodejs.org
[Grunt]: http://gruntjs.com


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
* [Kevin Ford](https://github.com/kefo)
* [Kirk Hess](https://github.com/kirkhess)


Maintainer
-----------

* **Kirk Hess** 
  * [GitHub](https://github.com/kirkhess)


License
-------

Unless otherwise noted, code that is original to `bfe` is in the Public Domain.

http://creativecommons.org/publicdomain/mark/1.0/

**NOTE:**  `bfe` includes or depends on software from other open source projects, all or 
most of which will carry their own license and copyright.  The Public Domain mark 
stops at `bfe` original code and does not convey to these projects.
