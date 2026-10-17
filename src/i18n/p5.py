# -*- coding: utf-8 -*-
D5 = {
'أضف أبناءك بأسمائهم وأعمارهم وصورهم, واختر لكل واحد شخصيته الكرتونية.':'Add your kids with their names, ages and photos, and pick a cartoon character for each one.',
'الأبناء كلهم يتنافسون على الخريطة نفسها, وتقدر تغيّرها وقت ما تبي ويبقى تقدّمهم كما هو.':'All the kids compete on the same map. You can change it any time and their progress stays as it is.',
'النقاط تُسجَّل خلال هذه الفترة فقط. اتركها فاضية إذا ما تبي تحديد وقت.':'Points are only counted during this period. Leave it empty if you do not want a time limit.',
'كم نقطة يحتاج الابن ليوصل المستوى 100؟ كل ما قلّ الرقم صارت الخريطة أسرع.':'How many points does a child need to reach level 100? The lower the number, the faster the map.',
'عند المحطات 25 و50 و75 يوجد صندوق كنز على الخريطة، وعندما يصله الابن ينفجر ويكشف المكافأة التي كتبتها. إذا تركت المكافأة فارغة أو ضغطت «حذف» فلن يظهر الصندوق في هذه المحطة ولن ينفتح أي كنز.':'At stations 25, 50 and 75 there is a treasure chest on the map. When a child reaches it, it bursts open and reveals the reward you wrote. If you leave the reward empty or tap “Delete”, no chest appears at that station and no treasure opens.',
'تصفّر نقاط الجميع ليبدأوا من جديد, وتبقى الشهادات التي حصلوا عليها.':'Resets everyone’s points so they can start again. The certificates they earned are kept.',
'السلوك الإيجابي يرفع الابن مستويات على الخريطة, والسلبي ينزله. أنت تحدد النقاط.':'Positive behavior moves a child up levels on the map and negative behavior moves them down. You decide the points.',
'بمقاس A4، احفظ الصورة ثم اطبعها.':'A4 size. Save the image, then print it.',
'التاريخ:':'Date:',
'رحلة الأخلاق تبدأ بخطوة':'The journey of good character begins with one step',
'جميع الحقوق محفوظة · إعداد محمد الشافعي':'All rights reserved — Mohammed Al-Shafei',
'حلا يختاره':'A dessert of their choice','نزهة في الحديقة':'A trip to the park','يوم بدون واجبات منزلية':'A day without homework','هدية كبيرة':'A big gift',
'اسم عائلتك أنت':'Your own family name','اسم العائلة المدعوة':'The invited family’s name','كل ما حصل للأبناء':'Everything that happened to the kids',
}
P5 = [
(r'^مثال: (.+)$', r"e.g. $1"),
(r'^خيار (\d+)$', r"Option $1"),
(r'^شهادات (.+)$', r"$1’s certificates"),
(r'^(.+): اضغط لإضافة أو خصم نقاط$', r"$1: tap to add or deduct points"),
]
