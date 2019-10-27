[bfe][demo-page]
=======================
[![CircleCI](https://circleci.com/gh/lcnetdev/bfe/tree/master.svg?style=svg)](https://circleci.com/gh/lcnetdev/bfe/tree/master)

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

[demo-page]: http://bibframe.org/bfe/index.html
[ontology]: http://id.loc.gov/ontologies/bibframe/
[bfi]: http://www.loc.gov/bibframe/

Getting Started
---------------
`bfe` is currently submodule of [recto](http://github.com/lcnetdev/recto), an express-based webserver, which uses [verso](http://github.com/lcnetdev/verso) a loopback-based server for backend data. The current recommendation is to install recto and verso and use bfe as part of the demonstration environment.

`bfe`'s `RECTOBASE` is now set using an environment variable.
Note: default `RECTOBASE` value is `http://localhost:3000`.

```bash
./env.sh > builds/env.js
npm install
grunt
```

`bfe` can be run as a demo or development version using a simple express-based server - found in the main `bfe` directory - 
that ships with `bfe`:

```bash
node server-bfe.js
```

Documentation 
-------------

* [API]

[API]: https://github.com/lcnetdev/bfe/blob/master/docs/bfe-api.md


Demo?
--------

[Online Demo][demo-page]

<!-- section links -->

[demo-page]: http://bibframe.org/bibliomata/bfe/index.html

Browser Support
---------------

* Chrome 34
* Firefox 24+
* Safari - 6+
* Opera - 12+

**NOTE:** `bfe` has also not been **thoroughly** tested in the browsers for which
support is currently listed.  It has been developed primarily using Chrome.
It has been tested in both Chrome and Safari mobile versions. IE is no longer supported.

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

Developers
----------

From a design standpoint, the objective with `bfe` was to create the simplest 
'pluggable' form editor one can to maximize experimental implementer's abilities 
to create/edit BIBFRAME data.  The current focus is to transform bfe into a production ready tool.

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


Contributors
-----------

* [Jeremy Nelson](https://github.com/jermnelson)
* [Kevin Ford](https://github.com/kefo)
* [Kirk Hess](https://github.com/kirkhess)
* [Matt Miller](https://github.com/thisismattmiller)

[Index Data](http://indexdata.com/):
* [Charles Ledvina](https://github.com/cledvina)
* [Wayne Schneider](https://github.com/wafschneider)

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
