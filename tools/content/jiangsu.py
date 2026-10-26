# -*- coding: utf-8 -*-
"""江苏分省路书内容：城市 / 景点 / 美食 / 环线 / 提示 / 途径点（坐标 WGS-84，构建转 GCJ-02）"""

PROV = dict(
    id="jiangsu", name="江苏", en="Jiangsu", capital="南京",
    tagline="江南水乡 · 园林古镇 · 淮扬风味",
    geoTitle="江南水乡甲天下，运河长江贯南北", geoSub="先认清格局再排行程：苏南逛园林水乡、苏中品淮扬运河、苏北看山海平原。",
    intro=[
        "江苏是江南水乡的精华所在：苏州园林与古镇、南京六朝古都、无锡太湖鼋头渚，撑起了「上有天堂、下有苏杭」的苏南；"
        "扬州瘦西湖与淮扬菜、南通濠河是苏中的运河慢生活；徐州汉文化、连云港花果山与盐城黄海湿地，则是苏北辽阔的山海平原。",
        "本页按 12 个地市整理精选停靠点、地方代表味道与省内环线；带 ★ 的是重点停靠点，免费景点标「免费」；数据为整理版本（坐标 GCJ-02），"
        "门票与预约政策随季节调整，出行前以景区与官方公告为准。",
    ],
    facts=[
        ("面积", "10.72 万 km²"),
        ("常住人口", "8526 万（2023 年末）"),
        ("地级市", "13 个"),
        ("省会", "南京"),
        ("最高峰", "连云港玉女峰 625 m"),
        ("GDP", "12.82 万亿（2023，全国第二）"),
    ],
    regions=[
        ("苏南 · 江南水乡", "南京、苏州、无锡、常州、镇江：园林、古镇与太湖，鱼米之乡的核心，经济最发达。"),
        ("苏中 · 淮扬运河", "扬州、泰州、南通：瘦西湖、濠河与淮扬菜，运河与长江交汇的慢生活地带。"),
        ("苏北 · 山海平原", "徐州、盐城、连云港、淮安：汉文化、花果山与黄海湿地，辽阔的平原与海岸。"),
    ],
)

CITIES = [
    # id|name|lat|lng|role|desc
    ("nanjing", "南京", 32.060, 118.797, "省会 · 六朝古都",
     "中山陵、明孝陵与夫子庙：十朝都会，南京博物院与总统府写满近代史。"),
    ("suzhou", "苏州", 31.299, 120.585, "园林之城 · 人间天堂",
     "拙政园、留园与平江路：世界遗产园林群，周庄同里的江南水乡。"),
    ("wuxi", "无锡", 31.491, 120.312, "太湖明珠",
     "鼋头渚、灵山大佛与惠山古镇：太湖佳绝处，三月樱花冠绝江南。"),
    ("changzhou", "常州", 31.810, 119.974, "龙城 · 乐园之城",
     "中华恐龙园与天目湖：主题乐园与溧阳山水竹海的休闲地。"),
    ("zhenjiang", "镇江", 32.187, 119.425, "京口 · 城市山林",
     "金山寺与西津渡：白娘子水漫金山的传说，长江与运河的交汇口。"),
    ("yangzhou", "扬州", 32.394, 119.413, "淮左名都 · 运河第一城",
     "瘦西湖、个园与大明寺：「烟花三月下扬州」，淮扬菜的发源地。"),
    ("xuzhou", "徐州", 34.205, 117.285, "两汉文化 · 兵家要地",
     "云龙湖与汉文化景区：刘邦故里，汉兵马俑与楚王陵的地下奇观。"),
    ("nantong", "南通", 31.980, 120.894, "江海门户 · 中国近代第一城",
     "濠河与狼山：长江入海北翼，张謇创办的近代实业与博物苑之城。"),
    ("yancheng", "盐城", 33.349, 120.163, "湿地之都 · 黄海明珠",
     "大丰麋鹿与条子泥：世界自然遗产黄海湿地，丹顶鹤与候鸟的家园。"),
    ("lianyungang", "连云港", 34.596, 119.222, "西游记故里 · 海港",
     "花果山与连岛：玉女峰是江苏最高峰，孙大圣的老家与新亚欧大陆桥头。"),
    ("huaian", "淮安", 33.551, 119.015, "运河之都 · 淮扬菜乡",
     "河下古镇与里运河：吴承恩与周恩来的故乡，淮扬菜的核心产区。"),
    ("taizhou", "泰州", 32.455, 119.923, "祥泰之州 · 水城",
     "溱湖湿地与凤城河：溱潼会船与黄桥烧饼，苏中的水乡慢城。"),
]

SPOTS = r"""
zhongshanling|中山陵|culture|nanjing|32.057|118.843|孙中山先生陵寝：392 级台阶与博爱坊，紫金山南麓的民国地标。|img=js_zhongshanling|ticket=免费预约|season=全年|free|key
mingxiaoling|明孝陵|culture|nanjing|32.055|118.837|明太祖朱元璋陵·世界遗产：石象路神道秋天最美，梅花山与红枫。|img=js_mingxiaoling|ticket=70 元|season=秋季石象路|level=世界遗产|key
fuzimiao|夫子庙·秦淮河|culture|nanjing|32.022|118.789|秦淮风光带：江南贡院与乌衣巷，夜游画舫看灯火，金陵的烟火中心。|img=js_fuzimiao|season=全年，夜游最佳|free|key
zongtongfu|总统府|culture|nanjing|32.044|118.793|中国近代史遗址博物馆：太平天国天王府与民国总统府，园林与史料并存。|img=js_zongtongfu|ticket=40 元|season=全年
nanjingbowuyuan|南京博物院|museum|nanjing|32.043|118.821|中国三大博物馆之一：一院六馆，民国馆老街与金兽、金缕玉衣。|img=js_nanjingbowuyuan|season=全年（周一闭馆）|free|key
zhuozhengyuan|拙政园|culture|suzhou|31.325|120.631|中国四大名园之首·世界遗产：以水见长，远香堂与荷风四面亭。|img=js_zhuozhengyuan|ticket=80 元|season=全年，需预约|level=世界遗产|key
liuyuan|留园|culture|suzhou|31.317|120.598|四大名园·世界遗产：冠云峰与精致的厅堂庭院，以小见大的造园典范。|img=js_liuyuan|ticket=55 元|season=全年|level=世界遗产
huqiu|虎丘|culture|suzhou|31.334|120.575|「吴中第一名胜」：云岩寺塔（中国比萨斜塔）与剑池，苏东坡赞不绝口。|img=js_huqiu|ticket=60 元|season=全年|key
pingjianglu|平江路|culture|suzhou|31.318|120.634|保存最完整的水巷古街：小桥流水人家，评弹与文创小店，免费慢逛。|img=js_pingjianglu|season=全年，清晨人少|free
zhouzhuang|周庄|culture|suzhou|31.114|120.845|「中国第一水乡」：双桥与沈厅，陈逸飞画笔下的江南古镇原型。|img=js_zhouzhuang|ticket=100 元|season=全年，住一晚看清晨|key
yuantouzhu|鼋头渚|scenery|wuxi|31.508|120.238|「太湖佳绝处」：长春桥樱花三月如雪，太湖仙岛与帆船晚霞。|img=js_yuantouzhu|ticket=90 元|season=3–4 月樱花|key
lingshan|灵山大佛|culture|wuxi|31.915|120.088|88 米高释迦牟尼铜佛：梵宫金碧辉煌，太湖马山的佛教文化地标。|img=js_lingshan|ticket=210 元|season=全年|key
huishan|惠山古镇|culture|wuxi|31.580|120.280|江南最大祠堂群：锡惠公园与天下第二泉，阿炳《二泉映月》诞生地。|img=js_huishan|ticket=古镇免费|season=全年|free
konglongyuan|中华恐龙园|scenery|changzhou|31.811|119.980|东方侏罗纪主题乐园：恐龙馆化石与过山车，亲子游的华东热门。|img=js_konglongyuan|ticket=260 元|season=全年
tianmuhu|天目湖·南山竹海|scenery|changzhou|31.290|119.450|溧阳山水：天目湖碧波与万亩竹海，御水温泉与砂锅鱼头。|img=js_tianmuhu|ticket=各景区分售|season=全年，夏避暑
jinshansi|金山寺|culture|zhenjiang|32.214|119.405|「水漫金山」传说地：江天禅寺与慈寿塔，寺裹山的独特布局。|img=js_jinshansi|ticket=50 元|season=全年|key
xijindu|西津渡|culture|zhenjiang|32.213|119.436|千年古渡口：一眼看千年的老街与昭关石塔，长江运河交汇的码头。|img=js_xijindu|season=全年|free
shouxihu|瘦西湖|scenery|yangzhou|32.406|119.421|「烟花三月下扬州」：五亭桥、二十四桥与白塔，湖上园林的典范。|img=js_shouxihu|ticket=100 元|season=3–4 月最佳|key
geyuan|个园|culture|yangzhou|32.397|119.436|四大名园之一：以四季假山著称，盐商黄至筠的宅园与万竿修竹。|img=js_geyuan|ticket=45 元|season=全年
damingsi|大明寺|culture|yangzhou|32.414|119.415|鉴真东渡出发地：栖灵塔俯瞰扬州城，平山堂与欧阳修苏轼的足迹。|img=js_damingsi|ticket=45 元|season=全年
yunlonghu|云龙湖|scenery|xuzhou|34.236|117.158|「西湖姊妹湖」：徐州城中湖，免费开放，环湖绿道与水上世界。|img=js_yunlonghu|season=全年|free
hanwenhua|汉文化景区|culture|xuzhou|34.268|117.290|楚王陵与汉兵马俑：地下军团与金缕玉衣，两汉文化的集中展示。|img=js_hanwenhua|ticket=90 元|season=全年
haohe|濠河|scenery|nantong|32.011|120.858|南通护城河：国内保存最完整的古护城河之一，夜游灯光与水岸慢城。|img=js_haohe|season=全年，夜游|free
langshan|狼山|mountain|nantong|31.961|120.837|「江海第一山」：广教寺与大圣菩萨，长江入海口的登山望江处。|img=js_langshan|ticket=50 元|season=全年|key
milu|大丰麋鹿保护区|scenery|yancheng|33.030|120.800|「麋鹿故乡」：世界最大麋鹿种群与滨海湿地，观鹿与候鸟天堂。|img=js_milu|ticket=45 元|season=全年，秋季观鸟|key
tiaozini|条子泥湿地|scenery|yancheng|32.850|120.900|世界自然遗产：黄（渤）海候鸟栖息地，潮汐树与百万候鸟的滩涂。|img=js_tiaozini|season=全年，候鸟季|key
huaguoshan|花果山|mountain|lianyungang|34.700|119.180|《西游记》原型·江苏最高峰：玉女峰与水帘洞，孙大圣的老家。|img=js_huaguoshan|ticket=90 元|season=4–11 月|key
liandao|连岛|scenery|lianyungang|34.740|119.430|江苏最大海岛：苏马湾与海滨浴场，金沙滩与山海相拥的リゾート。|img=js_liandao|ticket=50 元|season=5–10 月
hexia|河下古镇|culture|huaian|33.560|119.110|运河千年古镇：吴承恩故居与石板街，淮扬菜与进士之乡的根。|img=js_hexia|season=全年|free
qinhu|溱湖湿地|scenery|taizhou|32.560|120.150|溱潼会船节举办地：湖荡湿地与簖蟹，水乡民俗与生态观鸟。|img=js_qinhu|ticket=80 元|season=清明会船，秋季蟹
"""

FOODS = [
    ("南京盐水鸭", "南京", "桂花鸭皮白肉嫩、咸鲜回甘：南京人的日常，配鸭血粉丝汤更地道。"),
    ("苏州松鼠鳜鱼", "苏州", "鳜鱼改花刀炸成松鼠形浇糖醋汁：苏帮菜头牌，外酥里嫩、酸甜可口。"),
    ("无锡酱排骨", "无锡", "三凤桥浓油赤酱的糖醋排骨：甜中带咸、肉质酥烂，无锡味的代表。"),
    ("镇江锅盖面", "镇江", "大锅里漂小锅盖压出的跳面：配肴肉与浇头，「不到长城非好汉，不吃锅盖面遗憾」。"),
    ("扬州狮子头", "扬州", "肥瘦相间的猪肉手工剁制清炖：淮扬功夫菜，入口即化、汤清味醇。"),
    ("徐州地锅鸡", "徐州", "土鸡与面饼同炖的农家菜：锅边贴饼吸满汤汁，香辣下饭，苏北豪爽味。"),
    ("南通文蛤", "南通", "如东黄海文蛤「天下第一鲜」：清蒸或炒制，肉质肥美、鲜掉眉毛。"),
    ("淮安软兜长鱼", "淮安", "鳝鱼脊背肉快炒的淮扬名菜：软嫩如兜、蒜香浓郁，开国第一宴头道热菜。"),
]

LOOPS = [
    dict(name="江南园林水乡环线", days="4–5 天", km="约 500 km",
         desc="南京+苏州+无锡+常州的苏南精华：六朝古都、世界遗产园林与太湖樱花。",
         path="南京(中山陵·夫子庙) → 苏州(拙政园·周庄) → 无锡(鼋头渚·灵山大佛) → 常州(天目湖) → 南京",
         note="拙政园、中山陵、南博均需预约；鼋头渚 3–4 月樱花限流早到；周庄住一晚看清晨。",
         ids="nanjing,suzhou,zhuozhengyuan_wp,zhouzhuang_wp,wuxi,yuantouzhu_wp,changzhou,tianmuhu_wp,nanjing"),
    dict(name="宁镇扬淮扬运河环线", days="4–5 天", km="约 600 km",
         desc="南京+镇江+扬州+淮安+泰州的运河淮扬线：金陵、京口、淮左名都与菜乡。",
         path="南京(明孝陵·总统府) → 镇江(金山寺·西津渡) → 扬州(瘦西湖·个园) → 淮安(河下古镇) → 泰州(溱湖) → 南京",
         note="扬州「早上皮包水、晚上水包皮」（早茶+泡澡）；镇江三山一渡可一天；溱湖清明会船最热闹。",
         ids="nanjing,mingxiaoling_wp,zhenjiang,jinshansi_wp,yangzhou,shouxihu_wp,huaian,hexia_wp,taizhou,qinhu_wp,nanjing"),
    dict(name="苏北山海湿地环线", days="4–5 天", km="约 900 km",
         desc="徐州+连云港+盐城+南通的苏北山海线：汉文化、花果山与黄海候鸟湿地。",
         path="徐州(云龙湖·汉文化景区) → 连云港(花果山·连岛) → 盐城(条子泥·大丰麋鹿) → 南通(狼山·濠河) → 徐州",
         note="条子泥与大丰看候鸟需查潮汐与季节；花果山玉女峰江苏最高；连岛夏季海滨。",
         ids="xuzhou,yunlonghu_wp,lianyungang,huaguoshan_wp,yancheng,tiaozini_wp,nantong,langshan_wp,xuzhou"),
    dict(name="南京文博精华短线", days="1–2 天", km="约 50 km",
         desc="南京城内的六朝与近代史精华：中山陵、明孝陵、南博与夫子庙一线。",
         path="南京(中山陵·明孝陵) → 南京博物院 → 夫子庙·秦淮河 → 南京",
         note="中山陵免费预约、明孝陵与南博同区；夫子庙夜游秦淮画舫，一天可串完。",
         ids="nanjing,zhongshanling_wp,mingxiaoling_wp,nanjingbowuyuan_wp,fuzimiao_wp,nanjing"),
]

TIPS = [
    ("苏州园林", "拙政园、留园是世界遗产，旺季限流需预约；平江路、山塘街免费逛，清晨人少最有味。"),
    ("南京", "中山陵免费但需预约，明孝陵石象路秋天最美；夫子庙秦淮河夜游，南京博物院需提前订票。"),
    ("太湖", "鼋头渚 3–4 月樱花冠绝江南，灵山大佛与梵宫在无锡马山；天目湖与南山竹海在常州溧阳。"),
    ("水乡古镇", "周庄、同里、甪直各具特色，周庄最知名但商业化重；建议住一晚看清晨与夜景。"),
    ("季节", "3–5 月（樱花、园林新绿）与 9–11 月（明孝陵红叶、大闸蟹肥）最佳；夏季梅雨闷热，冬季湿冷。"),
]

WAYPOINTS = {
    "nanjing": ("南京", 32.060, 118.797),
    "zhongshanling_wp": ("中山陵", 32.057, 118.843),
    "mingxiaoling_wp": ("明孝陵", 32.055, 118.837),
    "nanjingbowuyuan_wp": ("南京博物院", 32.043, 118.821),
    "fuzimiao_wp": ("夫子庙", 32.022, 118.789),
    "suzhou": ("苏州", 31.299, 120.585),
    "zhuozhengyuan_wp": ("拙政园", 31.325, 120.631),
    "zhouzhuang_wp": ("周庄", 31.114, 120.845),
    "wuxi": ("无锡", 31.491, 120.312),
    "yuantouzhu_wp": ("鼋头渚", 31.508, 120.238),
    "changzhou": ("常州", 31.810, 119.974),
    "tianmuhu_wp": ("天目湖", 31.290, 119.450),
    "zhenjiang": ("镇江", 32.187, 119.425),
    "jinshansi_wp": ("金山寺", 32.214, 119.405),
    "yangzhou": ("扬州", 32.394, 119.413),
    "shouxihu_wp": ("瘦西湖", 32.406, 119.421),
    "huaian": ("淮安", 33.551, 119.015),
    "hexia_wp": ("河下古镇", 33.560, 119.110),
    "taizhou": ("泰州", 32.455, 119.923),
    "qinhu_wp": ("溱湖", 32.560, 120.150),
    "xuzhou": ("徐州", 34.205, 117.285),
    "yunlonghu_wp": ("云龙湖", 34.236, 117.158),
    "lianyungang": ("连云港", 34.596, 119.222),
    "huaguoshan_wp": ("花果山", 34.700, 119.180),
    "yancheng": ("盐城", 33.349, 120.163),
    "tiaozini_wp": ("条子泥", 32.850, 120.900),
    "nantong": ("南通", 31.980, 120.894),
    "langshan_wp": ("狼山", 31.961, 120.837),
}
