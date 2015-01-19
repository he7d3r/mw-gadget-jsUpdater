# jsUpdater - Helper tool for _Le Tour de Wikí: 2011 Resource Walker_ 

More info on [the discussion page at meta.wikimedia.org](https://meta.wikimedia.org/wiki/User_talk:Krinkle/Le_Tour_de_Wik%C3%AD/2011_Resource_Walker/jsUpdater.js).

Installation
===========================

1. Go to one of the js subpages of your user page. You can choose a page such as these:
  * [meta:User:`<Name>`/global.js](https://meta.wikimedia.org/wiki/Special:MyPage/global.js), which will be loaded in all wikis, in all skins
  * [meta:User:`<Name>`/common.js](https://meta.wikimedia.org/wiki/Special:MyPage/common.js), which will be loaded only on Meta-wiki, in all skins
  * [meta:User:`<Name>`/vector.js](https://meta.wikimedia.org/wiki/Special:MyPage/vector.js), which will be loaded only on Meta-wiki, in the vector skin
2. Copy the following to the page you have chosen:

  ```javascript
  // [[File:User:He7d3r/Tools/jsUpdater.js]] (workaround for [[phab:T35355]])
  mw.loader.load( '//meta.wikimedia.org/w/index.php?title=User:He7d3r/Tools/jsUpdater.js&action=raw&ctype=text/javascript' );
  ```

3. Clear the cache of your browser.

This will import the minified copy of the script I maintain on Meta-wiki.
