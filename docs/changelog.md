Change Log

----------------

This change log pertains to builds.

----------------
* 1.1.0 (2018-03-01)
  * Enter key fixed, no longer refreshes browser in single property modal windows.
  * Implement lists in bfestore
  * Fix date rendering
  * Implement user templates
  * Fix headings
  * Speedup jQuery Datatable loading

* 1.0.0 (2018-10-18)
  * Fixes for labels
  * Set rectoBase using env variable; use env.sh to populate
  * Updated documentation

* 0.4.0 (2018-09-24)
  * Fixes for #13, #14, #15, #16, #17, #18, #19
  * This release is incorporated into Recto lcnetdev/recto as a submodule.
  * Please change the rectoBase variable in static/js/config.js and static/js/config-dev.js to your path. 

* 0.3.1 (2018-03-26)
  * Minor profile and code fixes

* 0.3.0 (2018-03-21)
  * LC BIBFRAME 2.0 Pilot version
  * Includes BIBFRAME 2.0 Profiles

* 0.2.0 (2015-10-20)
  * Replace dryice with grunt
  * Refactor build w/o request.js (deprecated)
  * Support LC Pilot w/many new lookups added
  * Lookups in single file.

* 0.1.5 (2014-10-03)
  * Fix: Use '@type' in JSONLD expanded.

* 0.1.4 (2014-08-11)
  * Bug Fix: Invalid JSONLD expanded.

* 0.1.3 (2014-05-06)
  * Bug Fix: Bad var name resulting in 'undefined.'

* 0.1.2 (2014-05-02)
  * Bug Fix: Allow lookup if not the initial property on base form.
  * Bug Fix: only return bf-specific triples for lcnames and lcsubjects lookups
    when propertyuri is in the bf or relators namespaces.

* 0.1.1 (2014-05-02)
  * Bug Fix: Remove default language tag from literals.

* 0.1.0 (2014-05-02)
  * Initial release.

