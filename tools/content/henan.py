# -*- coding: utf-8 -*-
"""河南分省路书内容：城市 / 景点 / 美食 / 环线 / 提示 / 途径点"""

PROV = dict(
    id="henan", name="河南", en="Henan", capital="郑州",
    tagline="一部河南史 · 半部中国史",
    geoTitle="得中原者得天下，一部河南半部国史", geoSub="先认清格局再排行程：豫中读三大古都、豫北看太行殷墟、豫西南上伏牛品茶。",
    intro=[
        "河南是华夏文明的主舞台：洛阳、开封、安阳、郑州四大古都串起三千年的建都史，"
        "龙门石窟的卢舍那大佛、少林寺的禅武、殷墟的甲骨、清明上河园的宋韵，加上老君山金顶云海与南太行挂壁公路，历史与山水同样厚重。",
        "本页按 12 个地市整理精选停靠点、地方代表味道与省内环线；带 ★ 的是重点停靠点，免费景点标「免费」；数据为整理版本（坐标 GCJ-02），"
        "门票与演出价格随季节调整，出行前以景区与官方公告为准。",
    ],
    facts=[
        ("面积", "16.7 万 km²"),
        ("常住人口", "9815 万（2023 年末，全国第三）"),
        ("地级行政区", "17 个（16 市 + 济源示范区）"),
        ("省会", "郑州"),
        ("最高峰", "小秦岭老鸦岔 2414 m"),
        ("世界遗产", "5 处（龙门石窟·殷墟·天地之中·大运河·丝绸之路河南段）"),
    ],
    regions=[
        ("豫中 · 古都轴心", "郑州、洛阳、开封三大古都连成一线：少林寺、龙门石窟与清明上河园撑起华夏文明的主轴。"),
        ("豫北 · 太行人家", "安阳殷墟甲骨、林州红旗渠与南太行挂壁公路：历史与山水的硬朗组合。"),
        ("豫西南 · 伏牛茶乡", "伏牛山老君山避暑、南阳武侯祠与信阳毛尖茶乡：带着南方气质的河南。"),
    ],
)

CITIES = [
    # id|name|lat|lng|role|desc
    ("zhengzhou", "郑州", 34.747, 113.625, "省会 · 天地之中",
     "河南博物院、黄帝故里与只有河南：国家中心城市，少林寺与嵩山就在西南郊。"),
    ("luoyang", "洛阳", 34.619, 112.454, "十三朝古都 · 牡丹花城",
     "龙门石窟、白马寺与老君山：隋唐洛阳城遗址，四月牡丹甲天下。"),
    ("kaifeng", "开封", 34.797, 114.307, "八朝古都 · 大宋东京",
     "清明上河园、龙亭与开封府：一座被黄河反复掩埋又重生的宋韵水城。"),
    ("anyang", "安阳", 36.097, 114.392, "甲骨之乡 · 文字之都",
     "殷墟、红旗渠与太行大峡谷：三千年前的商都，加上人工天河的精神地标。"),
    ("jiaozuo", "焦作", 35.216, 113.242, "山水富城 · 太极故里",
     "云台山红石峡与陈家沟太极拳：南太行的峡谷瀑布与武术祖庭。"),
    ("xinxiang", "新乡", 35.303, 113.926, "南太行门户",
     "郭亮挂壁公路与八里沟：万仙山绝壁长廊是太行山最震撼的人工奇迹。"),
    ("nanyang", "南阳", 32.991, 112.528, "帝乡 · 诸葛躬耕地",
     "武侯祠与内乡县衙：伏牛山南麓的盆地，医圣张仲景与诸葛亮的故乡。"),
    ("xinyang", "信阳", 32.126, 114.091, "北国江南 · 毛尖茶乡",
     "鸡公山与南湾湖：大别山北麓的茶山竹海，河南最南的湿润地带。"),
    ("sanmenxia", "三门峡", 34.773, 111.200, "黄河第一坝 · 天鹅之城",
     "函谷关、陕州地坑院与天鹅湖：豫西门户，老子著《道德经》之地。"),
    ("shangqiu", "商丘", 34.414, 115.650, "殷商之源 · 古城",
     "商丘古城与芒砀山：外圆内方的水上古城，汉梁文化发源地。"),
    ("zhumadian", "驻马店", 32.980, 114.022, "天中之地",
     "嵖岈山花岗岩奇峰：《西游记》取景地，豫南的山水盆景。"),
    ("jiyuan", "济源", 35.090, 112.602, "愚公故里 · 王屋山",
     "王屋山道教洞天与济渎庙：愚公移山故事的发生地，黄河出山谷处。"),
]

SPOTS = r"""
shaolin|少林寺|culture|zhengzhou|34.508|112.937|禅宗祖庭·武林圣地：塔林、藏经阁与武术表演，登封嵩山少室山下。|img=hen_shaolin|ticket=80 元|season=全年|key
songshan|嵩山（嵩阳·中岳）|mountain|zhengzhou|34.530|112.945|五岳中岳：太室山与少室山，嵩阳书院、中岳庙与观星台构成「天地之中」。|img=hen_songshan|ticket=各景点分售|season=全年|level=世界遗产
henanmuseum|河南博物院|museum|zhengzhou|34.787|113.668|贾湖骨笛、莲鹤方壶与武则天金简：读懂中原文明的第一课，需预约。|img=hen_henanmuseum|season=全年（周一闭馆）|free|key
huangdi|黄帝故里|culture|zhengzhou|34.396|113.736|新郑轩辕丘：全球华人拜祖圣地，三月三拜祖大典声势浩大。|img=hen_huangdi|ticket=免费预约|season=全年|free
zhiyouhenan|只有河南·戏剧幻城|culture|zhengzhou|34.700|113.940|王潮歌导演：夯土墙里的 21 个剧场，用戏剧讲述黄河与河南的苦难与温情。|img=hen_zhiyouhenan|ticket=199 元起|season=全年
longmen|龙门石窟|culture|luoyang|34.555|112.470|世界遗产：卢舍那大佛的微笑与十万尊造像，伊河两岸的唐代石刻巅峰。|img=hen_longmen|ticket=90 元|season=全年，夜游亮灯|level=世界遗产|key
baima|白马寺|culture|luoyang|34.728|112.576|中国第一古刹：佛教传入后官办首寺，含泰国印度缅甸佛殿的国际寺院。|img=hen_baima|ticket=35 元|season=全年
laojunshan|老君山|mountain|luoyang|33.735|111.646|伏牛山主峰·道教圣地：金顶道观群云海翻涌，冬季雾凇宛如仙境。|img=hen_laojunshan|ticket=100 元+索道|elev=2217|season=全年，冬雪夏云|key
suitang|隋唐洛阳城（应天门·明堂）|culture|luoyang|34.652|112.466|武周神都中轴：应天门灯光秀与明堂天堂，复原隋唐洛阳的恢弘。|img=hen_suitang|ticket=各馆分售|season=全年，夜景最佳
qingming|清明上河园|culture|kaifeng|34.807|114.340|按《清明上河图》1:1 复原的宋文化园：包公巡游、岳飞校场与实景演出。|img=hen_qingming|ticket=120 元|season=全年，夜游《大宋·东京梦华》|key
longting|龙亭|landmark|kaifeng|34.803|114.352|六朝皇宫遗址：大殿高踞潘杨二湖之间，菊花文化节主会场。|img=hen_longting|ticket=45 元|season=全年，10 月菊展
kaifengfu|开封府|culture|kaifeng|34.792|114.348|包拯办公的北宋官衙：开衙仪式与断案表演，「包青天」文化地标。|img=hen_kaifengfu|ticket=80 元|season=全年
daxiangguo|大相国寺|culture|kaifeng|34.793|114.353|《水浒》鲁智深倒拔垂杨柳处：北宋皇家寺院，千手千眼观音木雕。|img=hen_daxiangguo|ticket=45 元|season=全年
yinxu|殷墟|culture|anyang|36.128|114.314|世界遗产·商代晚期都城：甲骨文与司母戊鼎出土地，中国信史开端。|img=hen_yinxu|ticket=70 元|season=全年|level=世界遗产|key
hongqi|红旗渠|culture|anyang|36.230|113.830|林州人工天河：十万民众十年凿出的悬崖水渠，青年洞是精神地标。|img=hen_hongqi|ticket=100 元|season=全年|key
taihang|太行大峡谷|mountain|anyang|36.150|113.730|林虑山北雄风光：桃花谷、王相岩与太行天路，秋日红叶漫山。|img=hen_taihang|ticket=100 元|season=4–11 月
yuntaishan|云台山|mountain|jiaozuo|35.420|113.370|南太行精华·5A：红石峡丹霞、茱萸峰与亚洲落差最大的云台天瀑。|img=hen_yuntaishan|ticket=120 元+观光车|season=全年，夏瀑秋叶|key
chenjiagou|陈家沟|culture|jiaozuo|35.060|113.090|温县太极拳发源地：太极祖庭与博物馆，陈氏十三式在此传承四百年。|img=hen_chenjiagou|ticket=40 元|season=全年
guoliang|郭亮挂壁公路|mountain|xinxiang|35.660|113.600|万仙山绝壁长廊：村民五年手凿的悬崖天路，太行山最震撼的人工奇迹。|img=hen_guoliang|ticket=万仙山 120 元|season=4–11 月|key
baligou|八里沟|scenery|xinxiang|35.560|113.560|南太行水乡：天河瀑布与红石河，太行之魂的峡谷溪流景区。|img=hen_baligou|ticket=80 元|season=4–10 月
wuhouci|武侯祠|culture|nanyang|32.998|112.500|诸葛亮躬耕地：三顾堂与草庐，「臣本布衣，躬耕于南阳」的实证地。|img=hen_wuhouci|ticket=40 元|season=全年
neixiang|内乡县衙|culture|nanyang|33.047|111.847|保存最完整的古代县级官署：三省堂与衙署文化，「天下第一衙」。|img=hen_neixiang|ticket=60 元|season=全年
jigongshan|鸡公山|mountain|xinyang|31.800|114.180|中国四大避暑胜地之一：报晓峰与万国别墅群，大别山北麓的清凉世界。|img=hen_jigongshan|ticket=80 元|season=夏季避暑最佳
nanwanhu|南湾湖|scenery|xinyang|32.080|114.030|豫南明珠：湖中茶岛与鸟岛，环湖是信阳毛尖的核心茶山。|img=hen_nanwanhu|ticket=65 元|season=全年
hangu|函谷关|culture|sanmenxia|34.519|110.864|秦关天险·老子著《道德经》处：太初宫与关楼，一夫当关的黄河要冲。|img=hen_hangu|ticket=80 元|season=全年
dishikeng|陕州地坑院|culture|sanmenxia|34.760|111.120|地下四合院：「见树不见村、进村不见房」的黄土穴居奇观。|img=hen_dishikeng|ticket=60 元|season=全年
tianehu|天鹅湖湿地|scenery|sanmenxia|34.770|111.160|黄河畔的天鹅之城：每年冬季上万只白天鹅越冬，豫西的生态名片。|img=hen_tianehu|season=11 月–次年 3 月观鹅|free
shangqiugu|商丘古城|culture|shangqiu|34.410|115.650|外圆内方的水上古城：归德府城墙与应天府书院，明清格局完整保存。|img=hen_shangqiugu|ticket=各景点分售|season=全年
chayashan|嵖岈山|mountain|zhumadian|33.070|113.680|花岗岩奇峰石林：《西游记》取景地，蜜蜡山与蓬莱三岛如盆景。|img=hen_chayashan|ticket=70 元|season=4–11 月
wangwushan|王屋山|mountain|jiyuan|35.100|112.200|道教第一洞天·愚公移山处：天坛峰与银杏树，黄河出山谷的门户山。|img=hen_wangwushan|ticket=90 元|season=全年
"""

FOODS = [
    ("河南烩面", "郑州", "羊肉高汤宽面配海带豆腐丝：筋道吸汤，河南人的日常图腾。"),
    ("洛阳水席", "洛阳", "二十四道汤水菜的官府宴：牡丹燕菜是头牌，酸辣利口、上菜如流水。"),
    ("开封灌汤包", "开封", "第一楼的小笼灌汤包：先开窗后喝汤，皮薄如纸、汤汁鲜美。"),
    ("道口烧鸡", "安阳", "滑县三百年老字号：造型如元宝，咸香酥烂、提骨即脱，中华名鸡之首。"),
    ("武陟油茶", "焦作", "面粉炒香配花生芝麻的糊状甜茶：暖胃顶饱，豫北的早餐饮品。"),
    ("新乡红焖羊肉", "新乡", "羊肉加面酱红焖的火锅：汤浓肉烂、微辣回甜，冬日围炉首选。"),
    ("新野板面", "南阳", "摔打成的宽面配牛油臊子：筋道爽滑、麻辣浓香，豫西南的街头霸主。"),
    ("固始鹅块", "信阳", "本地大白鹅清炖加高汤：肉质紧实、汤色奶白，豫南的硬菜代表。"),
]

LOOPS = [
    dict(name="中原古都文化环线", days="5–6 天", km="约 900 km",
         desc="郑州+开封+安阳+洛阳四大古都：少林龙门、殷墟甲骨与宋韵东京一次读透。",
         path="郑州(少林寺·河南博物院) → 开封(清明上河园·开封府) → 安阳(殷墟·红旗渠) → 洛阳(龙门石窟·老君山) → 郑州",
         note="龙门石窟与老君山各需一天；清明上河园夜游演出需提前订票；安阳殷墟与红旗渠分两处。",
         ids="zhengzhou,kaifeng,qingming_wp,anyang,yinxu_wp,hongqi_wp,luoyang,longmen_wp,zhengzhou"),
    dict(name="南太行山水挂壁环线", days="3–4 天", km="约 500 km",
         desc="焦作+新乡+济源的南太行：云台山瀑布、郭亮挂壁与王屋山道观。",
         path="焦作(云台山·陈家沟) → 新乡(郭亮挂壁·八里沟) → 济源(王屋山) → 焦作",
         note="郭亮挂壁在万仙山景区内，山路窄需慢行；云台山红石峡旺季限流早到。",
         ids="jiaozuo,yuntaishan_wp,xinxiang,guoliang_wp,baligou_wp,jiyuan,wangwushan_wp,jiaozuo"),
    dict(name="伏牛山避暑帝乡环线", days="3–4 天", km="约 650 km",
         desc="洛阳+南阳+驻马店的豫西南：老君山云海、武侯祠与嵖岈山奇峰。",
         path="洛阳(老君山) → 南阳(内乡县衙·武侯祠) → 驻马店(嵖岈山) → 洛阳",
         note="老君山索道上山省体力；伏牛山夏季凉爽适合避暑；嵖岈山石阶较多。",
         ids="luoyang,laojunshan_wp,nanyang,neixiang_wp,wuhouci_wp,zhumadian,chayashan_wp,luoyang"),
    dict(name="豫西古关黄河环线", days="2–3 天", km="约 400 km",
         desc="三门峡+洛阳的黄河沿线：函谷关、地坑院与天鹅湖，再回洛阳读白马寺。",
         path="三门峡(函谷关·陕州地坑院·天鹅湖) → 洛阳(白马寺·隋唐洛阳城) → 三门峡",
         note="天鹅湖冬季观白天鹅；地坑院在陕州区西张村镇；函谷关在灵宝市区西。",
         ids="sanmenxia,hangu_wp,dishikeng_wp,tianehu_wp,luoyang,baima_wp,sanmenxia"),
]

TIPS = [
    ("龙门石窟", "世界遗产，卢舍那大佛是精华；旺季夜游亮灯别有意境，建议早到避开团队高峰。"),
    ("老君山", "栾川金顶道观群云海翻涌，索道+电瓶车省体力；冬季雾凇如仙境，注意山路结冰。"),
    ("少林嵩山", "少林寺看塔林与武术表演，嵩山可登太室山；中岳庙、嵩阳书院与观星台同在登封一线。"),
    ("古都演出", "开封清明上河园《大宋·东京梦华》、洛阳应天门灯光秀为实景演出，需提前订票。"),
    ("季节", "4 月洛阳牡丹花会、秋季南太行红叶与云台山瀑布最盛；夏季伏牛山与鸡公山避暑。"),
]

WAYPOINTS = {
    "zhengzhou": ("郑州", 34.747, 113.625),
    "kaifeng": ("开封", 34.797, 114.307),
    "qingming_wp": ("清明上河园", 34.807, 114.340),
    "anyang": ("安阳", 36.097, 114.392),
    "yinxu_wp": ("殷墟", 36.128, 114.314),
    "hongqi_wp": ("红旗渠", 36.230, 113.830),
    "luoyang": ("洛阳", 34.619, 112.454),
    "longmen_wp": ("龙门石窟", 34.555, 112.470),
    "jiaozuo": ("焦作", 35.216, 113.242),
    "yuntaishan_wp": ("云台山", 35.420, 113.370),
    "xinxiang": ("新乡", 35.303, 113.926),
    "guoliang_wp": ("郭亮挂壁", 35.660, 113.600),
    "baligou_wp": ("八里沟", 35.560, 113.560),
    "jiyuan": ("济源", 35.090, 112.602),
    "wangwushan_wp": ("王屋山", 35.100, 112.200),
    "laojunshan_wp": ("老君山", 33.735, 111.646),
    "nanyang": ("南阳", 32.991, 112.528),
    "neixiang_wp": ("内乡县衙", 33.047, 111.847),
    "wuhouci_wp": ("武侯祠", 32.998, 112.500),
    "zhumadian": ("驻马店", 32.980, 114.022),
    "chayashan_wp": ("嵖岈山", 33.070, 113.680),
    "sanmenxia": ("三门峡", 34.773, 111.200),
    "hangu_wp": ("函谷关", 34.519, 110.864),
    "dishikeng_wp": ("陕州地坑院", 34.760, 111.120),
    "tianehu_wp": ("天鹅湖", 34.770, 111.160),
    "baima_wp": ("白马寺", 34.728, 112.576),
}
