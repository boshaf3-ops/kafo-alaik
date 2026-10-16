# -*- coding: utf-8 -*-
D7 = {
'نقاط لجميع الأبناء':'Points for all the kids',
'لجميع الأبناء':'For all the kids',
'اختر نوع السلوك، ثم السلوك الذي يُمنح لكل الأبناء دفعة واحدة.':'Pick the type of behaviour, then the behaviour to give to all the kids at once.',
'سلوك إيجابي':'Positive behaviour','سلوك سلبي':'Negative behaviour',
'سلوك إيجابي لجميع الأبناء':'Positive behaviour for all the kids','سلوك سلبي لجميع الأبناء':'Negative behaviour for all the kids',
'رجوع':'Back','إغلاق':'Close',
'ما فيه ابن يمكن منحه هذا السلوك الآن':'No kid can be given this behaviour right now',
}
P7 = [
(r'^«(.+)» ([+-]\d+) لـ (\d+) (?:أبناء|ابنين|ابن) \(تخطّينا (\d+)\)$', r"“$1” $2 for $3 kid(s) ($4 skipped)"),
(r'^«(.+)» ([+-]\d+) لـ (\d+) (?:أبناء|ابنين|ابن)$', r"“$1” $2 for $3 kid(s)"),
]
