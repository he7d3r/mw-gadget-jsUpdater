/*global jsUpdater, jQuery, QUnit*/
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
				pattern: ['wgServerMissing'],
				comment: 'Add wgServer to URLs to be loaded',
				input: 'mw.loader.load( mw.config.get( \'wgScript\' ) + \'?title=Foo.js&action=raw&ctype=text/javascript\' );\n',
				output: 'mw.loader.load( mw.config.get( \'wgServer\' ) + mw.config.get( \'wgScript\' ) + \'?title=Foo.js&action=raw&ctype=text/javascript\' );\n'
			}, {
				pattern: ['wgServerMissing'],
				comment: 'Add wgServer to URLs in variables which will be loaded',
				input: 'var url = mw.config.get(\'wgScript\') + \'?title=Foo.js&action=raw&ctype=text/javascript\';\nmw.loader.load(url);\n',
				output: 'var url = mw.config.get( \'wgServer\' ) + mw.config.get(\'wgScript\') + \'?title=Foo.js&action=raw&ctype=text/javascript\';\nmw.loader.load(url);\n'
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