/**
 * jsUpdater for 1.17 migration tour
 * Originally written by [[m:User:Helder.wiki]]
 * @revision: 1
 * @author:: Helder
 */
window.jsUpdater = {};
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
			'single quotes'
		], */ [
			/document\.getElementById\s*\(['"]\s*bodyContent\s*['"]\)\s*/g,
			'mw.util.$content[0]',
			'mw.util.$content'
		], [
			/\/\/\s*(?:<\/?pre>\s*<\/?nowiki>|<\/?nowiki>\s*<\/?pre>|<\/?nowiki>|<\/?pre>)\s*\n/g,
			'',
			'-<pre>'
		], [
			/(?:\bjQuery|\$j?)(?:\(\s*document\s*\)\.ready)?\s*\(/g,
			'$(',
			'$(...)'
		]
	];

	jsUpdater.checkForUpdates = function (res) {
		var pages = res.query.pages,
			page, pagetitle, text, url, update = false;

		for (page in pages) {
			if (!pages[page].pageid) {
				continue;
			}
			text = pages[page].revisions[0]['*'];
			pagetitle = pages[page].title;
			break;
		}

		for (var i =0; i< jsUpdater.updates.length; i++ ) {
			if (jsUpdater.updates[i][0].test(text)) {
				update = true;
				break;
			}
		}

		if (update) {
			url = mw.util.wikiGetlink(pagetitle) + '?action=edit&runjsupdater=true';
			$(mw.util.addPortletLink('p-views', url, 'Update', 'ca-js-updater', 'Click here to scan this script for potential improvements for better compatibility with MW 1.17')).find('a').css('color', 'orange');
		}
	};

	jsUpdater.install = function () {
		var ns = mw.config.get('wgNamespaceNumber'),
			page;
		ns = (ns % 2 === 0) ? ns : ns - 1;
		page = mw.config.get('wgFormattedNamespaces')[ns] + ':' + mw.util.wikiUrlencode(mw.config.get('wgTitle'));
		mw.loader.load(mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/api.php?action=query&format=json&prop=revisions&titles=' + page + '&rvprop=content&callback=jsUpdater.checkForUpdates');
	};

	$(jsUpdater.install);
}
if ($.inArray(mw.config.get('wgAction'), ['edit', 'submit']) !== -1) {
	jsUpdater.run = function () {
		var	newText,
			oldText = $('#wpTextbox1').val(),
			summary = '[[mw:RL/MGU|Migration]] to MW 1.17';
		if (!jsUpdater.updates) {
			return;
		}
		for (var i =0; i< jsUpdater.updates.length; i++) {
			newText = oldText.replace(jsUpdater.updates[i][0], jsUpdater.updates[i][1]);
			if ( oldText !== newText ) {
				summary += '; ' + jsUpdater.updates[i][2];
				oldText = newText;
			}
		}

		if ( mw.util.$content.find('.permissions-errors').size() ) {
			jsMsg('<b>The updated code is displayed below:</b><br/><textarea cols="80" rows="40" style="width: 100%; font-family: monospace; line-height: 1.5em;">' + mw.html.escape(newText) + '</textarea>');
		} else {
			$('#wpTextbox1').val(newText);
			$('#wpSummary').val(summary);
			$('#wpDiff').click();
		}
	};

	if (!$.isEmpty(mw.util.getParamValue('runjsupdater'))) {
		$(jsUpdater.run);
	}
}
