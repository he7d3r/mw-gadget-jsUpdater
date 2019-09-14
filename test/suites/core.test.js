(function (jsUpdater, $, QUnit) {
	"use strict";
	QUnit.module('init');

	QUnit.test('getPatterns', function (assert) {
		var badSample, goodSample;
		QUnit.expect(4);

		badSample = 'var nsId = wgNamespaceNumber;'
			+ 'var namespace = wgFormattedNamespaces[nsId];'
			+ 'var sections = $("h2").size();';

		goodSample = 'var nsId = mw.config.get("wgNamespaceNumber");'
			+ 'var namespace = mw.config.get("wgFormattedNamespaces")[nsId];'
			+ 'var sections = $("h2").length;';

		assert.deepEqual(
			jsUpdater.getPatterns(badSample, /*onlyFirst=*/false),
			['wgVars', 'jqSize'],
			'getPatterns finds both basic patterns'
		);
		assert.strictEqual(
			jsUpdater.getPatterns(badSample, /*onlyFirst=*/true).length,
			1,
			'getPatterns:onlyFirst will stop after the first'
		);

		assert.strictEqual(
			jsUpdater.getPatterns(goodSample, /*onlyFirst=*/false).length,
			0,
			'getPatterns matches no false positives'
		);
		assert.strictEqual(
			jsUpdater.getPatterns(goodSample, /*onlyFirst=*/true).length,
			0,
			'getPatterns:onlyFirst matches no false positives'
		);
	});


	QUnit.module('run');

	QUnit.test('doConversion', function (assert) {
		var verifications;

		verifications = [
			{
				pattern: ['wgVars'],
				comment: 'plain',
				input: 'nsId = wgNamespaceNumber;',
				output: 'nsId = mw.config.get(\'wgNamespaceNumber\');'
			}, {
				pattern: ['wgVars'],
				comment: 'array access',
				input: 'nsName = wgFormattedNamespaces[nsId];',
				output: 'nsName = mw.config.get(\'wgFormattedNamespaces\')[nsId];'
			}, {
				pattern: ['wgVars'],
				comment: 'function argument, array access',
				input: 'doFoo(wgUserGroups[ext]);',
				output: 'doFoo(mw.config.get(\'wgUserGroups\')[ext]);'
			}, {
				// Happens automatically unless we do advance parsing for each character.
				// Side-effect, could be unwanted. Therefor we require human check in diff,
				// before saving.
				pattern: ['wgVars'],
				comment: 'mention in a comment',
				input: '/* Use wgTitle instead */',
				output: '/* Use mw.config.get(\'wgTitle\') instead */'
			}, {
				pattern: ['wgVars'],
				comment: 'Prevent recursing (exact plain target)',
				input: 'nsId = mw.config.get(\'wgNamespaceNumber\');',
				output: 'nsId = mw.config.get(\'wgNamespaceNumber\');'
			}, {
				pattern: ['wgVars'],
				comment: 'Prevent recursing (double quotes)',
				input: 'nsId = mw.config.get("wgNamespaceNumber");',
				output: 'nsId = mw.config.get("wgNamespaceNumber");'
			}, {
				pattern: ['wgVars'],
				comment: 'Prevent recursing (whitespace)',
				input: 'nsId = mw.config.get(  "wgNamespaceNumber"  );',
				output: 'nsId = mw.config.get(  "wgNamespaceNumber"  );'
			}, {
				pattern: ['jqSize'],
				comment: 'plain selector',
				input: '$("h2").size();',
				output: '$("h2").length;'
			}, {
				pattern: ['jqSize'],
				comment: 'html argument, whitespace',
				input: '$ ( "<html>" ).size() ;',
				output: '$ ( "<html>" ).length ;'
			}, {
				pattern: ['jqSize'],
				comment: 'jquery object in a variable named $foo',
				input: '$foo.size();\n',
				output: '$foo.length;\n'
			},
			/* {
				// We don't want this to match, because "foo" is too generic,
				// too much chance of it being a different object.
				pattern: ['jqSize'],
				comment: 'jquery object in a variable named foo',
				input: 'foo.size();\n',
				output: 'foo.length;\n'
			}, */
			{
				pattern: ['jqSize'],
				comment: 'jQuery instead $',
				input: 'jQuery(el).size();\n',
				output: 'jQuery(el).length;\n'
			}, {
				pattern: ['old$j'],
				comment: 'Old jquery alias (selecting elements)',
				input: '$j ( "#test" );\n',
				output: '$( "#test" );\n'
			}, {
				pattern: ['old$j'],
				comment: 'Variable name containing the old jquery alias',
				input: '$joo = $("#test");\n',
				output: '$joo = $("#test");\n'
			}, {
				pattern: ['old$j'],
				comment: 'Old jquery alias (calling a function)',
				input: '$j.ajax ( { test: "" } );\n',
				output: '$.ajax ( { test: "" } );\n'
			}, {
				pattern: ['wgServerMissing'],
				comment: 'Add wgServer to URLs to be loaded',
				input: 'mw.loader.load( mw.config.get( \'wgScript\' ) + \'?title=Foo.js&action=raw&ctype=text/javascript\' );\n',
				output: 'mw.loader.load( mw.config.get( \'wgServer\' ) + mw.config.get( \'wgScript\' ) + \'?title=Foo.js&action=raw&ctype=text/javascript\' );\n'
			}, {
				pattern: ['wgServerMissing'],
				comment: 'Add wgServer to URLs in variables which will be loaded',
				input: 'var url = mw.config.get(\'wgScript\') + \'?title=Foo.js&action=raw&ctype=text/javascript\';\nmw.loader.load(url);\n',
				output: 'var url = mw.config.get( \'wgServer\' ) + mw.config.get(\'wgScript\') + \'?title=Foo.js&action=raw&ctype=text/javascript\';\nmw.loader.load(url);\n'
			}, {
				pattern: ['appendCSS'],
				comment: 'mw.util.addCSS',
				input: 'appendCSS( \'#foo bar {display:none;}\' );\n',
				output: 'mw.util.addCSS( \'#foo bar {display:none;}\' );\n'
			}, {
				pattern: ['importScriptURI'],
				comment: 'Use mw.loader.load to load JavaScript',
				input: 'importScriptURI(\'//test2.wikipedia.org/w/index.php?action=raw&ctype=text/javascript&title=MediaWiki:foo.js&maxage=0&smaxage=0\');\n',
				output: 'mw.loader.load(\'//test2.wikipedia.org/w/index.php?action=raw&ctype=text/javascript&title=MediaWiki:foo.js&maxage=0&smaxage=0\');\n'
			}, {
				pattern: ['importStylesheetURI'],
				comment: 'Use mw.loader.load to load CSS',
				input: 'importStylesheetURI( \'//\' + lang + \'.wikipedia.org/w/index.php?title=User:Foo/bar.css&action=raw&ctype=text/css\' );\n',
				output: 'mw.loader.load(\'//\' + lang + \'.wikipedia.org/w/index.php?title=User:Foo/bar.css&action=raw&ctype=text/css\', \'text/css\');\n'
			}, {
				pattern: ['addOnloadHook'],
				comment: 'Function in a variable',
				input: 'addOnloadHook( fooBar );',
				output: '$( fooBar );'
			}, {
				pattern: ['addOnloadHook'],
				comment: 'Anonymous function in multiple lines',
				input: 'addOnloadHook(function() {\n// do something\n});',
				output: '$(function() {\n// do something\n});'
			}, {
				pattern: ['getURLParamValue'],
				comment: 'Equality test',
				input: 'if (getURLParamValue("suppressredirect")!="1") return;',
				output: 'if (mw.util.getParamValue("suppressredirect")!="1") return;'
			}, {
				pattern: ['getURLParamValue'],
				comment: 'Save to variable',
				input: 'var extraCSS = getURLParamValue(\'withCSS\');',
				output: 'var extraCSS = mw.util.getParamValue(\'withCSS\');'
			}, {
				pattern: ['getParamVal'],
				comment: 'Save to variable',
				input: 'foo = getParamVal( "bar" );',
				output: 'foo = mw.util.getParamValue( "bar" );'
			}, {
				pattern: ['getParamValue'],
				comment: 'Boolean test',
				input: 'if (getParamValue(\'minor\')) {\n\t//foo\n}',
				output: 'if (mw.util.getParamValue(\'minor\')) {\n\t//foo\n}'
			}, {
				pattern: ['addPortletLink'],
				comment: 'Inline',
				input: '$(function() { addPortletLink(\'p-tb\', \'http://example.com/some_url\', \'Text\', \'Tooltip\');});',
				output: '$(function() { mw.util.addPortletLink(\'p-tb\', \'http://example.com/some_url\', \'Text\', \'Tooltip\');});'
			}, {
				pattern: ['arrayProtoIndexOf'],
				comment: 'String',
				input: 'obj = {\n\tadmin: wgUserGroups.indexOf(\'sysop\') > -1 ? true : false\n};',
				output: 'obj = {\n\tadmin: $.inArray(\'sysop\', wgUserGroups) > -1 ? true : false\n};'
			}, {
				pattern: ['arrayProtoIndexOf'],
				comment: 'Variable',
				input: 'mw.config.get( \'wgUserGroups\' ).indexOf( group ) !== -1',
				output: '$.inArray(group, mw.config.get( \'wgUserGroups\' )) !== -1'
			}, {
				pattern: ['strProtoEscapeRE'],
				comment: 'variable',
				input: 'newString = oldString.escapeRE();',
				output: 'newString = mw.util.escapeRegExp(oldString);'
			}, {
				pattern: ['theOrOrOrOr'],
				comment: 'A variable and four strings',
				input: 'if (skin === "cologneblue" || skin === "modern" || skin === "monobook" || skin === "vector" ) {',
				output: 'if ($.inArray(skin, ["cologneblue" , "modern" , "monobook" , "vector" ]) !== -1) {'
			}, {
				pattern: ['theOrOrOr'],
				comment: 'A variable and three strings',
				input: 'if( wgAction == \'view\' || wgAction == \'purge\' || wgAction == \'submit\' ){',
				output: 'if( $.inArray(wgAction, [\'view\' , \'purge\' , \'submit\' ]) !== -1){'
			}, {
				pattern: ['theOrOr'],
				comment: 'A variable and two strings',
				input: 'if( wgAction == \'edit\' || wgAction == \'submit\' ){',
				output: 'if( $.inArray(wgAction, [\'edit\' , \'submit\' ]) !== -1){'
			}, {
				pattern: ['wgVars'],
				comment: 'Compare with string',
				input: 'if (wgPageName == \'User:foo/bar\')',
				output: 'if (mw.config.get(\'wgPageName\') == \'User:foo/bar\')'
			}, {
				pattern: ['skin'],
				comment: 'Compare with string',
				input: 'if( skin == "monobook" ) {',
				output: 'if( mw.config.get(\'skin\') == "monobook" ) {'
			}, {
				pattern: ['bitsSkins'],
				comment: 'Replace bits.wikimedia.org',
				input: 'var x = "//bits.wikimedia.org/skins/Vector/images/watch-icon.png";',
				output: 'var x = "/static/current/skins/Vector/images/watch-icon.png";'
			}, {
				pattern: ['bitsStaticCurrent'],
				comment: 'Replace bits.wikimedia.org',
				input: 'var x = "//bits.wikimedia.org/static-current/skins/MonoBook/bullet.gif";',
				output: 'var x = "/static/current/skins/MonoBook/bullet.gif";'
			}, {
				pattern: ['documentWriteScript'],
				comment: 'Upper case tag',
				input: 'document.write(\'<SCRIPT SRC="http://example.com/gadget.js"><\/SCRIPT>\');',
				output: 'mw.loader.load( \'http://example.com/gadget.js\' );'
			}, {
				pattern: ['documentWriteRawScript'],
				comment: 'Three lines, concatenation and "dontcountme"',
				input: 'document.write(\'<script type="text/javascript" src="\' \n    + \'http://en.wikipedia.org/w/index.php?title=User:Example/code.js\' \n    + \'&action=raw&ctype=text/javascript&dontcountme=s"></script>\');',
				output: 'mw.loader.load( \'http://en.wikipedia.org/w/index.php?title=User:Example/code.js\' \n    + \'&action=raw&ctype=text/javascript&dontcountme=s\' );'
			}, {
				pattern: ['documentWriteRawScript'],
				comment: 'Single line and "dontcountme"',
				input: 'document.write(\'<script type="text/javascript" src="http://en.wikipedia.org/w/index.php?title=User:Example/vector.js&action=raw&ctype=text/javascript&dontcountme=s"><\/script>\');',
				output: 'mw.loader.load( \'http://en.wikipedia.org/w/index.php?title=User:Example/vector.js&action=raw&ctype=text/javascript&dontcountme=s\' );'
			}, {
				pattern: ['documentWriteRawScript'],
				comment: 'Three lines, concatenation and "maxage"',
				input: 'document.write(\'<script type="text/javascript" src="\' \n     + \'http://meta.wikimedia.org/w/index.php?title=MediaWiki:Wikiminiatlas.js\' \n     + \'&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400"></script>\');',
				output: 'mw.loader.load( \'http://meta.wikimedia.org/w/index.php?title=MediaWiki:Wikiminiatlas.js\' \n     + \'&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400\' );'
			}, {
				pattern: ['documentWriteStylesheet'],
				comment: 'Single line stylesheet',
				input: 'document.write(\'<link rel="stylesheet" type="text/css" href="http://en.wikipedia.org/w/index.php?title=User:Foo/vector.css&action=raw&ctype=text/css&dontcountme=s"><\/link>\');',
				output: 'mw.loader.load( \'http://en.wikipedia.org/w/index.php?title=User:Foo/vector.css&action=raw&ctype=text/css&dontcountme=s\', \'text/css\' );'
			}, {
				pattern: ['jqEscapeRE'],
				comment: 'Escaping a namespace name',
				input: 'new RegExp( \'^\' + $.escapeRE( mw.util.getUrl( mw.config.get( \'wgFormattedNamespaces\' )[\'6\'] + \':\' ) ) )',
				output: 'new RegExp( \'^\' + mw.util.escapeRegExp( mw.util.getUrl( mw.config.get( \'wgFormattedNamespaces\' )[\'6\'] + \':\' ) ) )'
			}
		];

		$.each(verifications, function (i, verify) {
			assert.equal(
				jsUpdater.doConversion(verify.input, verify.pattern).output,
				verify.output,
				'Pattern ' + verify.pattern + ': ' + (verify.comment || verify.input)
			);
		});

	});

}(jsUpdater, jQuery, QUnit));
