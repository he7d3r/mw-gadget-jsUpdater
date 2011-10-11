/**
 * jsUpdater
 *
 * Helper tool for implementing good practices and changes as found on:
 * [[mw:RL/MGU]], [[mw:CC#JavaScript code]], [[mw:RL/JD]].
 * @revision: 3
 * @author: Helder, 2011 ([[m:User:Helder.wiki]])
 */
window.jsUpdater = {};
mw.messages.set( {
	'jsupdater-single-quotes': 'single quotes',
	'jsupdater-update-link': 'Update',
	'jsupdater-update-link-description': 'Click here to scan this script for' +
				' potential improvements for better compatibility with MW 1.17',
	'jsupdater-migration-summary': '[[mw:RL/MGU|Migration]] to MW 1.17',
	'jsupdater-new-code-description': 'The updated code is displayed below:',
	'jsupdater-update-button': 'Update',
	'jsupdater-select-updates': 'Which updates should be performed?'
});
if (/\.js$/g.test(mw.config.get('wgTitle')) && $.inArray(mw.config.get('wgNamespaceNumber'), [8, 9, 2, 3, 4, 5]) !== -1) {
	jsUpdater.updates = [
		[
			/\bappendCSS\s*\(/g,
			'mw.util.addCSS(',
			'appendCSSmw.util.addCSS'
		], [
			/\bimportScriptURI\s*\(/g,
			'mw.loader.load(',
			'importScriptURImw.loader.load'
		], [
			/\bimportStylesheetURI\s*\(\s*([^\n\)]+?)\s*\)/g,
			'mw.loader.load( $1, \'text/css\' )',
			'importStylesheetURImw.loader.load'
		], [
			/\baddOnloadHook\s*\(/g,
			'$(',
			'addOnloadHook$'
		], [
			/([^.])getURLParamValue\s*\(/g,
			'$1mw.util.getParamValue(',
			'getURLParamValuemw.util.getParamValue'
		], [
			/([^.])getParamVal\s*\(/g,
			'$1mw.util.getParamValue(',
			'getParamValmw.util.getParamValue'
		], [
			/([^.])getParamValue\s*\(/g,
			'$1mw.util.getParamValue(',
			'getParamValuemw.util.getParamValue'
		], [
			/([^.])addPortletLink\s*\(/g,
			'$1mw.util.addPortletLink(',
			'addPortletLinkmw.util.addPortletLink'
		], [
			// IE < 9 doesn't support Array.indexOf()
			/(wgUserGroups|wgRestrictionEdit|wgRestrictionMove|wgSearchNamespaces|wgMWSuggestMessages|wgFileExtensions)\.indexOf\s*\(\s*(.+?)\s*\)/g,
			'$.inArray($2, $1)',
			'indexOf$.inArray'
		], [
			/([a-zA-Z_][0-9a-zA-Z_]*)\.escapeRE\s*\(\s*\)/g,
			'$.escapeRE( $1 )',
			'str.escapeRE()$.escapeRE(str)'
		], [
			/([0-9a-zA-Z_\$\.]*|mw\.config\.get\(\s*'[a-zA-Z_]*'\s*\))\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*/g,
			'$.inArray( $1, [ $2, $3, $4, $5 ]) > -1',
			'a==1||a==2$.inArray(a,[1,2])>-1'
		], [
			/([0-9a-zA-Z_\$\.]*|mw\.config\.get\(\s*'[a-zA-Z_]*'\s*\))\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*/g,
			'$.inArray( $1, [ $2, $3, $4 ]) > -1',
			'a==1||a==2$.inArray(a,[1,2])>-1'
		], [
			/([0-9a-zA-Z_\$\.]*|mw\.config\.get\(\s*'[a-zA-Z_]*'\s*\))\s*===?\s*([^\(\|\)&!]*)\s*\|\|\s*\1\s*===?\s*([^\(\|\)&!]*)\s*/g,
			'$.inArray( $1, [ $2, $3 ]) > -1',
			'a==1||a==2$.inArray(a,[1,2])>-1'
		], [
			// Use mw.config.get to access wg* global variables. The following list comes from [[mw:Manual:Interface/JavaScript]]
			/([^'"<>$0-9A-Za-z_\/])(skin|stylepath|wgUrlProtocols|wgArticlePath|wgScriptPath|wgScriptExtension|wgScript|wgVariantArticlePath|wgActionPaths|wgServer|wgCanonicalNamespace|wgCanonicalSpecialPageName|wgNamespaceNumber|wgPageName|wgTitle|wgAction|wgArticleId|wgIsArticle|wgUserName|wgUserGroups|wgUserLanguage|wgContentLanguage|wgBreakFrames|wgCurRevisionId|wgVersion|wgEnableAPI|wgEnableWriteAPI|wgSeparatorTransformTable|wgDigitTransformTable|wgMainPageTitle|wgMainPageTitle|wgNamespaceIds|wgSiteName|wgCategories|wgRestrictionEdit|wgRestrictionMove|wgUserVariant|wgMWSuggestTemplate|wgDBname|wgSearchNamespaces|wgSearchNamespaces|wgMWSuggestMessages|wgAjaxWatch|wgLivepreviewMessageLoading|wgLivepreviewMessageReady|wgLivepreviewMessageFailed|wgLivepreviewMessageError|wgFileExtensions)\b/g,
			'$1mw.config.get( \'$2\' )',
			'wg*mw.config.get(\'wg*\')'
		], [
			/document\.write\('<script type="text\/javascript" src="'\n?[\t\s]*\+[\t\s]*'(http[^\n]+?\.js'\n?[\t\s]*\+[\t\s]*'&action=raw&ctype=text\/javascript(?:&dontcountme=s)?(?:&smaxage=\d+)?(?:&maxage=\d+)?)"><\/script>'\)/g,
			'mw.loader.load( \'$1\' )',
			'document.write(\'<script...\')mw.loader.load'
		], /* [
			// Use single quotes where possible. The [^=] is to avoid false positives in HTML tags such as '<a title="test" >'
			/([^=])"([A-Za-z]+)"/g,
			'$1\'$2\'',
			mw.msg( 'jsupdater-single-quotes' )
		], */ [
			/document\.getElementById\s*\(['"]\s*bodyContent\s*['"]\)\s*/g,
			'mw.util.$content[0]',
			'mw.util.$content'
		], [
			/\/\/\s*(?:<\/?pre>\s*<\/?nowiki>|<\/?nowiki>\s*<\/?pre>|<\/?nowiki>|<\/?pre>)\s*\n/g,
			'',
			'-<pre>'
		], [
			/typeof\s+([a-zA-Z_][0-9a-zA-Z_\.]*)\s*===?\s*(['"])function\2/g,
			'$.isFunction($1)',
			'typeof x == \'function\'$.isFunction(x)'
		], [
			/(?:(?:\bjQuery|\$j?)(?:\(\s*document\s*\)\.ready)|(?:\bjQuery|\$j))\s*\(/g,
			'$(',
			'$(...)'
		], [
		/(\$[^;$]+)\.size\(\)/g,
			'$1.length',
			'.size()$length'
		]
	];

	jsUpdater.getUpdates = function (code, onlyFirst) {
		var updates = [];
		for (var i =0; i< jsUpdater.updates.length; i++ ) {
			if (jsUpdater.updates[i][0].test(code)) {
				updates.push( i );
				if (onlyFirst) {
					break;
				}
			}
		}
		return updates.join( '|' );
	};

	jsUpdater.checkForUpdates = function (res) {
		var	pages = res.query.pages,
			pageids = res.query.pageids,
			i, pagetitle, text, url, update = false;
 
		for (i = 0; i < pageids.length; i++) {
			if (!pages[ pageids[i] ].pageid) {
				continue;
			}
			text = pages[ pageids[i] ].revisions[0]['*'];
			pagetitle = pages[ pageids[i] ].title;
			break;
		}
		update = jsUpdater.getUpdates(text, true /* only first update */);
		if ( update.length ) {
			url = mw.util.wikiGetlink(pagetitle) + '?action=edit&runjsupdater=true';
			$(mw.util.addPortletLink(
				'p-views',
				url,
				mw.msg( 'jsupdater-update-link' ),
				'ca-js-updater',
				mw.msg( 'jsupdater-update-link-description' )
			)).find('a').css('color', 'orange');
		}
	};

	jsUpdater.install = function () {
		var ns = mw.config.get('wgNamespaceNumber'),
			page;
		ns = (ns % 2 === 0) ? ns : ns - 1;
		page = mw.config.get('wgFormattedNamespaces')[ns] + ':' +
			mw.util.wikiUrlencode(mw.config.get('wgTitle'));
		$.getJSON(
			mw.util.wikiScript( 'api' ), {
				'format': 'json',
				'action': 'query',
				'titles': page,
				'prop': 'revisions',
				'rvprop': 'content',
				'indexpageids': '1'
			}, jsUpdater.checkForUpdates
		);
	};

	$(jsUpdater.install);
}
if ($.inArray(mw.config.get('wgAction'), ['edit', 'submit']) !== -1) {
	jsUpdater.run = function ( list ) {
		var	newText, oldText,
			summary = mw.msg( 'jsupdater-migration-summary' );
		if ( !jsUpdater.updates || !list.length ) {
			return;
		}
		oldText = $('#wpTextbox1').val();
		for (var i =0; i< list.length; i++) {
			newText = oldText.replace(
				jsUpdater.updates[ list[i] ][0], jsUpdater.updates[ list[i] ][1]
			);
			if ( oldText !== newText ) {
				summary += '; ' + jsUpdater.updates[ list[i] ][2];
				oldText = newText;
			}
		}

		if ( mw.util.$content.find('.permissions-errors').length ) {
			jsMsg(
				'<b>' + mw.msg( 'jsupdater-new-code-description' ) + '</b><br/><br/>' +
				'<textarea cols="80" rows="40" style="width: 100%; font-family: monospace; line-height: 1.5em;">' +
				mw.html.escape(newText) +
				'</textarea>'
			);
		} else {
			$('#wpTextbox1').val(newText);
			$('#wpSummary').val(summary);
			$('#wpDiff').click();
		}
	};
	jsUpdater.showOptions = function () {
		var	$msg, $updateInput, $updateLabel, $updateButton,
			code = $('#wpTextbox1').val(),
			updates = jsUpdater.getUpdates(code, false /* not only the first update */)
				.split('|');
		if (!jsUpdater.updates) {
			return;
		}
		$msg = $( '<div/>', {
			'id': 'js-updater-options',
			'text': mw.msg( 'jsupdater-select-updates' )
		} ).append('<br/>');
		for (var i =0; i< updates.length; i++) {
			// Based on [[mw:Snippets/Hide prefix in SpecialPrefixIndex]]
			$updateInput = $( '<input/>', {
				'type': 'checkbox',
				'name': 'updates',
				'id': 'update-' + updates[i],
				'value': updates[i],
				'checked': 'checked'
			} );
			$updateLabel = $( '<label/>', {
				'for': 'update-' + updates[i],
				'text': jsUpdater.updates[ updates[i] ][2]
			} );
			$msg.append($updateInput)
				.append($updateLabel)
				.append('<br/>');
		}
		$updateButton = $( '<button/>', {
			'type': 'button',
			'id': 'update-button',
			'value': 'Update',
			'text': mw.msg( 'jsupdater-update-button' )
		} ).click(function () {
			var list = [];
			$( '#js-updater-options' )
			.find( 'input:checkbox[name=updates]:checked' ).each(function(){
				list.push( $(this).val() );
			});
			jsUpdater.run( list );
		} ).appendTo( $msg );
		jsMsg( $msg.get(0) );
	};

	if (!$.isEmpty(mw.util.getParamValue('runjsupdater'))) {
		$(jsUpdater.showOptions);
	}
}
