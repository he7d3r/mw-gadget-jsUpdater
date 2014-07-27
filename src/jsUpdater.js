/**
 * jsUpdater
 *
 * Helper tool for implementing good practices and changes as found on:
 * [[mw:RL/MGU]], [[mw:CC#JavaScript code]], [[mw:RL/JD]].
 * @version 10
 * @author Helder, 2011-2012 ([[m:User:Helder.wiki]])
 * @author Timo Tijhof, 2011-2012 ([[m:User:Krinkle]])
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/jsUpdater.js]] ([[File:User:Helder.wiki/Tools/jsUpdater.js]])
 */
/*jshint browser: true, camelcase: true, curly: true, eqeqeq: true, immed: true, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: true, undef: true, unused: true, strict: true, trailing: true, evil: true, onevar: true */
/*global jQuery, mediaWiki */
( function ( mw, $ ) {
	'use strict';

	var jsUpdater = {};

	mw.messages.set({
		'jsupdater-single-quotes': 'single quotes',
		'jsupdater-update-link': 'Update',
		'jsupdater-update-link-description-some': 'Click here to scan this script for' +
			' potential improvements for better compatibility with MW 1.17+',
		'jsupdater-migration-summary': '[[mw:RL/MGU|Migration]]: ',
		'jsupdater-new-code-description': 'The updated code is displayed below:',
		'jsupdater-update-button': 'Update',
		'jsupdater-select-updates': 'Which updates should be performed?',
		'jsupdater-no-updates': 'No applicable updates for this script available.' +
			' Perhaps this script has been updated already?'
	});

	jsUpdater.patterns = {
		appendCSS: {
			regex: /\bappendCSS\s*\(/g,
			replace: 'mw.util.addCSS(',
			summary: 'appendCSS → mw.util.addCSS'
		},
		importScriptURI: {
			regex: /\bimportScriptURI\s*\(/g,
			replace: 'mw.loader.load(',
			summary: 'importScriptURI → mw.loader.load'
		},
		importStylesheetURI: {
			regex: /\bimportStylesheetURI\s*\(\s*([^\n\)]+?)\s*\)/g,
			replace: 'mw.loader.load($1, \'text/css\')',
			summary: 'importStylesheetURI → mw.loader.load'
		},
		addOnloadHook: {
			regex: /\baddOnloadHook\s*\(/g,
			replace: '$(',
			summary: 'addOnloadHook → $'
		},
		getURLParamValue: {
			regex: /([^.])getURLParamValue\s*\(/g,
			replace: '$1mw.util.getParamValue(',
			summary: 'getURLParamValue → mw.util.getParamValue'
		},
		getParamVal: {
			regex: /([^.])getParamVal\s*\(/g,
			replace: '$1mw.util.getParamValue(',
			summary: 'getParamVal → mw.util.getParamValue'
		},
		getParamValue: {
			regex: /([^.])getParamValue\s*\(/g,
			replace: '$1mw.util.getParamValue(',
			summary: 'getParamValue → mw.util.getParamValue'
		},
		addPortletLink: {
			regex: /([^.])addPortletLink\s*\(/g,
			replace: '$1mw.util.addPortletLink(',
			summary: 'addPortletLink → mw.util.addPortletLink'
		},
		arrayProtoIndexOf: {
			// IE < 9 doesn't support Array.indexOf()
			regex: /((?:mw\.config\.get\( *['"])?(?:wgUserGroups|wgRestrictionEdit|wgRestrictionMove|wgSearchNamespaces|wgMWSuggestMessages|wgFileExtensions)(?:['"] *\))?)\.indexOf\s*\(\s*(.+?)\s*\)/g,
			replace: '$.inArray($2, $1)',
			summary: 'arr.indexOf → $.inArray'
		},
		strProtoEscapeRE: {
			regex: /([a-zA-Z_][0-9a-zA-Z_]*)\.escapeRE\s*\(\s*\)/g,
			replace: '$.escapeRE($1)',
			summary: 'str.escapeRE() → $.escapeRE(str)'
		},
		theOrOrOrOr: {
			regex: /([0-9a-zA-Z_\$\.]*|mw\.config\.get\(\s*'[a-zA-Z_]*'\s*\))\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*/g,
			replace: '$.inArray($1, [$2, $3, $4, $5]) !== -1',
			summary: 'a==1||a==2 → $.inArray(a,[1,2])'
		},
		theOrOrOr: {
			regex: /([0-9a-zA-Z_\$\.]*|mw\.config\.get\(\s*'[a-zA-Z_]*'\s*\))\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*/g,
			replace: '$.inArray($1, [$2, $3, $4]) !== -1',
			summary: 'a==1||a==2 → $.inArray(a,[1,2])'
		},
		theOrOr: {
			regex: /([0-9a-zA-Z_\$\.]*|mw\.config\.get\(\s*'[a-zA-Z_]*'\s*\))\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*/g,
			replace: '$.inArray($1, [$2, $3]) !== -1',
			summary: 'a==1||a==2 → $.inArray(a,[1,2])'
		},
		wgVars: {
			// Use mw.config.get to access wg* global variables. The following list comes from [[mw:Manual:Interface/JavaScript]]
			regex: /([^'"<>$0-9A-Za-z_\/])(skin|stylepath|wgUrlProtocols|wgArticlePath|wgScriptPath|wgScriptExtension|wgScript|wgVariantArticlePath|wgActionPaths|wgServer|wgCanonicalNamespace|wgCanonicalSpecialPageName|wgNamespaceNumber|wgPageName|wgTitle|wgAction|wgArticleId|wgIsArticle|wgUserName|wgUserGroups|wgUserLanguage|wgContentLanguage|wgBreakFrames|wgCurRevisionId|wgVersion|wgEnableAPI|wgEnableWriteAPI|wgSeparatorTransformTable|wgDigitTransformTable|wgMainPageTitle|wgMainPageTitle|wgNamespaceIds|wgSiteName|wgCategories|wgRestrictionEdit|wgRestrictionMove|wgUserVariant|wgMWSuggestTemplate|wgDBname|wgSearchNamespaces|wgSearchNamespaces|wgMWSuggestMessages|wgAjaxWatch|wgLivepreviewMessageLoading|wgLivepreviewMessageReady|wgLivepreviewMessageFailed|wgLivepreviewMessageError|wgFileExtensions|wgFormattedNamespaces)\b/g,
			replace: '$1mw.config.get(\'$2\')',
			summary: 'wg* → mw.config.get(\'wg*\')'
		},
		documentWriteScript: {
			regex: /document\.write\('<script type="text\/javascript" src="'\n?[\t\s]*\+[\t\s]*'(http[^\n]+?\.js'\n?[\t\s]*\+[\t\s]*'&action=raw&ctype=text\/javascript(?:&dontcountme=s)?(?:&smaxage=\d+)?(?:&maxage=\d+)?)"><\/script>'\)/g,
			replace: 'mw.loader.load( \'$1\' )',
			summary: 'document.write(\'<script...\') → mw.loader.load'
		},
		wgServerMissing: {
			regex: /(mw\.loader\.load\s*\(\s*)(mw\.config\.get\s*\(\s*(["'])wgScript\3\s*\)\s*\+\s*['"]\?)|(\s*var\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*)(mw\.config\.get\s*\(\s*(["'])wgScript\7\s*\)\s*\+\s*['"]\?)(?=(?:.|\n)+?mw\.loader\.load\s*\(\s*\5\s*\))/g,
			replace: '$1$4mw.config.get( $3$7wgServer$3$7 ) + $2$6',
			summary: '+wgServer ([[bugzilla:34036]])'
		},
		/* doubleQuotes: {
			// Use single quotes where possible. The [^=] is to avoid false positives in HTML tags such as '<a title="test" >'
			regex: /([^=])"([A-Za-z]+)"/g,
			replace: '$1\'$2\'',
			mw.msg('jsupdater-single-quotes' )
		}, */
		preNowiki: {
			regex: /\/\/\s*(?:<\/?pre>(?:\s*<\/?nowiki>)?|<\/?nowiki>\s*<\/?pre>|<\/?pre>)\s*\n/g,
			replace: '',
			summary: '-<pre>'
		},
		typeofFunction: {
			regex: /typeof\s+([a-zA-Z_][0-9a-zA-Z_\.]*)\s*===?\s*(['"])function\2/g,
			replace: '$.isFunction($1)',
			summary: 'typeof x == \'function\' → $.isFunction(x)'
		},
		jqSize: {
			regex: /([\$|jQuery][^;$]+)\.size\(\)/g,
			replace: '$1.length',
			summary: '$obj.size() → $obj.length'
		},
		old$j: {
			regex: /\$j\s*\(/g,
			replace: '$(',
			summary: '$j → $'
		},
		newArray: {
			regex: /new\s+Array\(\s*\)/g,
			replace: '[]',
			summary: 'new Array() → []'
		},
		newObject: {
			regex: /new\s+Object\(\s*\)/g,
			replace: '{}',
			summary: 'new Object() → {}'
		},
		wikiGetlink: {
			regex: /mw\.util\.wikiGetlink/g,
			replace: 'mw.util.getUrl',
			summary: 'wikiGetlink → getUrl'
		},
		hookEvent: {
			regex: /hookEvent\s*\(\s*(["'])load\1\s*,/g,
			replace: '$(',
			summary: 'hookEvent → $'
		},
		addHandler: {
			regex: /addHandler\s*\((.*?),\s*(["'])focus\2\s*,/g,
			replace: '$($1).focus(',
			summary: 'addHandler → $(...).focus'
		},
		mwUserName: {
			regex: /mw\.user\.name\(\s*\)/g,
			replace: 'mw.user.getName()',
			summary: 'mw.user.name → mw.user.getName'
		},
		mwUserAnonymous: {
			regex: /mw\.user\.anonymous\(\s*\)/g,
			replace: 'mw.user.isAnon()',
			summary: 'mw.user.anonymous → mw.user.isAnon'
		},
		tooltipAccessKeyPrefix: {
			regex: /([^.])tooltipAccessKeyPrefix/g,
			replace: '$1mw.util.tooltipAccessKeyPrefix',
			summary: 'tooltipAccessKeyPrefix → mw.util.tooltipAccessKeyPrefix'
		},
		tooltipAccessKeyRegexp: {
			regex: /([^.])tooltipAccessKeyRegexp/g,
			replace: '$1mw.util.tooltipAccessKeyRegexp',
			summary: 'tooltipAccessKeyRegexp → mw.util.tooltipAccessKeyRegexp'
		},
		updateTooltipAccessKeys: {
			regex: /([^.])updateTooltipAccessKeys/g,
			replace: '$1mw.util.updateTooltipAccessKeys',
			summary: 'updateTooltipAccessKeys → mw.util.updateTooltipAccessKeys'
		}
	};

	/** @return array: Array of keys to jsUpdater.patterns */
	jsUpdater.getPatterns = function (code, onlyFirst) {
		var patternIDs = [];
		$.each(jsUpdater.patterns, function (id, pattern) {
			// Set lastIndex back to 0 in case we've ran against
			// the same string before (see also https://github.com/Krinkle/mw-gadgets-jsUpdater/issues/1)
			pattern.regex.lastIndex = 0;
			if (pattern.regex.test(code)) {
				patternIDs.push(id);
				if (onlyFirst) {
					return false;
				}
			}
		});
		return patternIDs;
	};

	jsUpdater.checkForUpdates = function (res) {
		var pagetitle, text, updates, url, plink,
			pages = res.query.pages,
			// pageids may be an empty array, in which case this will be undefined
			pageid = res.query.pageids[0];

		// pageid may be -1, in that case 'text' and 'revisions' will be undefined
		if (pageid && Number(pageid) > 0 && pages[pageid]) {
			pagetitle = pages[pageid].title;
			text = pages[pageid].revisions[0]['*'];

			updates = jsUpdater.getPatterns(text, /*onlyFirst=*/true);
			url = mw.util.getUrl(pagetitle, { action: 'edit', runjsupdater: 'true' });
			plink = mw.util.addPortletLink(
				'p-views',
				url,
				mw.msg('jsupdater-update-link'),
				'ca-js-updater',
				updates.length ?
					mw.msg('jsupdater-update-link-description-some') :
					mw.msg('jsupdater-no-updates')
			);
			$(plink).find('a').css('color', updates.length ? 'orange' : 'green');
		} else {
			mw.log('API information for jsUpdater indicates this page does\'t exist.');
		}
	};

	jsUpdater.install = function () {
		var ns = mw.config.get('wgNamespaceNumber'),
			page;
		ns = (ns % 2 === 0) ? ns : ns - 1;
		page = mw.config.get('wgFormattedNamespaces')[ns] + ':' + mw.config.get('wgTitle');
		$.getJSON(
			mw.util.wikiScript('api'),
			{
				format: 'json',
				action: 'query',
				titles: page,
				prop: 'revisions',
				rvprop: 'content',
				indexpageids: ''
			},
			jsUpdater.checkForUpdates
		);
	};

	/**
	 * @param String input
	 * @param Array patternIDs
	 * @return Object keys 'output' (String) and 'summaries' (Array).
	 */
	jsUpdater.doConversion = function (input, patternIDs) {
		var ret;
		ret = {
			output: input,
			summaries: []
		};

		if (!patternIDs.length) {
			return ret;
		}

		$.each(patternIDs, function (i) {
			var pattern = jsUpdater.patterns[patternIDs[i]];
			pattern.regex.lastIndex = 0;
			ret.output = input.replace(pattern.regex, pattern.replace);
			if (ret.output !== input) {
				ret.summaries.push(pattern.summary);
				input = ret.output;
			}
		});

		return ret;
	};

	jsUpdater.run = function (patternIDs) {
		var conversion,
			summary = mw.msg('jsupdater-migration-summary'),
			ace = $(".ace_editor"),
			oldText = ace.length ? ace[0].env.document.getValue() : $('#wpTextbox1').val();

		conversion = jsUpdater.doConversion(oldText, patternIDs);

		summary += conversion.summaries.join('; ');

		$('#js-updater-options').remove();
		if (mw.util.$content.find('.permissions-errors').length) {
			$('#mw-content-text').prepend(
				'<b>' + mw.msg('jsupdater-new-code-description') + '</b><br><br>' +
					'<textarea cols="80" rows="40" style="width: 100%; font-family: monospace; line-height: 1.5em;">' +
					mw.html.escape(conversion.output) +
					'</textarea>'
			);
		} else {
			if (ace.length){
				ace[0].env.document.setValue(conversion.output);
			} else {
				$('#wpTextbox1').val(conversion.output);
			}
			$('#wpSummary').val(summary);
			$('#wpDiff').click();
		}
	};

	jsUpdater.showOptions = function () {
		var $msg, $updateInput, $updateLabel, $updateButton, i,
			ace = $(".ace_editor"),
			code = ace.length ? ace[0].env.document.getValue() : $('#wpTextbox1').val(),
			updates = jsUpdater.getPatterns(code, /*onlyFist=*/false);

		$msg = $('<div id="js-updater-options"></div>');

		if (!updates.length) {
			$msg.text(mw.msg('jsupdater-no-updates'));
		} else {
			$msg.text(mw.msg('jsupdater-select-updates'));

			for (i = 0; i < updates.length; i++) {
				// Based on [[mw:Snippets/Hide prefix in SpecialPrefixIndex]]
				$updateInput = $('<input>', {
					type: 'checkbox',
					name: 'updates',
					id: 'update-' + updates[i],
					value: updates[i],
					checked: 'checked'
				});
				$updateLabel = $('<label>', {
					'for': 'update-' + updates[i],
					text: jsUpdater.patterns[updates[i]].summary
				});
				$msg.append('<br>', $updateInput, $updateLabel);
			}

			$updateButton = $('<button>', {
				type: 'button',
				id: 'update-button',
				value: 'Update',
				text: mw.msg('jsupdater-update-button')
			}).click(function () {
				var patternIDs = [];
				$('#js-updater-options')
					.find('input:checkbox[name="updates"]:checked')
					.each(function () {
						patternIDs.push($(this).val());
					});
				jsUpdater.run(patternIDs);
			}).appendTo($msg);
		}

		$('#mw-content-text').prepend($msg.get(0));
	};

	if (/\.js$/g.test(mw.config.get('wgTitle')) && $.inArray(mw.config.get('wgNamespaceNumber'), [8, 9, 2, 3, 4, 5]) !== -1) {
		mw.loader.using([
			'mediawiki.util',
			'jquery.mwExtension'
		], function () {
			$(jsUpdater.install);

			if ($.inArray(mw.config.get('wgAction'), ['edit', 'submit']) !== -1) {
				if (!$.isEmpty(mw.util.getParamValue('runjsupdater'))) {
					$(jsUpdater.showOptions);
				}
			}
		});
	}

	window.jsUpdater = jsUpdater;

}( mediaWiki, jQuery ) );