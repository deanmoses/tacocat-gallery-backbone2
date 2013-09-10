/* Use this script if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-tasks' : '&#xe000;',
			'icon-tabletscale' : '&#xe001;',
			'icon-tablet' : '&#xe002;',
			'icon-search' : '&#xe003;',
			'icon-report' : '&#xe004;',
			'icon-remove' : '&#xe005;',
			'icon-profile' : '&#xe006;',
			'icon-plus' : '&#xe007;',
			'icon-pagelayout5' : '&#xe008;',
			'icon-pagelayout4' : '&#xe009;',
			'icon-pagelayout3' : '&#xe00a;',
			'icon-pagelayout2' : '&#xe00b;',
			'icon-pagelayout1' : '&#xe00c;',
			'icon-move' : '&#xe00d;',
			'icon-mobilescale' : '&#xe00e;',
			'icon-mobile' : '&#xe00f;',
			'icon-message' : '&#xe010;',
			'icon-link' : '&#xe011;',
			'icon-groups' : '&#xe012;',
			'icon-grab' : '&#xe013;',
			'icon-following' : '&#xe014;',
			'icon-followers' : '&#xe015;',
			'icon-file' : '&#xe016;',
			'icon-edit' : '&#xe017;',
			'icon-dropwdownarrow' : '&#xe018;',
			'icon-desktopscale' : '&#xe019;',
			'icon-desktop' : '&#xe01a;',
			'icon-carrot' : '&#xe01b;',
			'icon-arrow' : '&#xe01c;',
			'icon-analytics' : '&#xe01d;',
			'icon-circlegraph2' : '&#xe01e;',
			'icon-circlegraph1' : '&#xe01f;',
			'icon-close' : '&#xe020;',
			'icon-timeoff' : '&#xe021;',
			'icon-lead' : '&#xe022;',
			'icon-contact' : '&#xe023;',
			'icon-case' : '&#xe024;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; i < els.length; i += 1) {
		el = els[i];
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};