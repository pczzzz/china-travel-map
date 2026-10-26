# -*- coding: utf-8 -*-
"""海南分省路书内容：城市 / 景点 / 美食 / 环线 / 提示 / 途径点（坐标 WGS-84，构建转 GCJ-02）"""

PROV = dict(
    id="hainan", name="海南", en="Hainan", capital="海口",
    tagline="热带海岛 · 阳光海岸 · 自贸港",
    geoTitle="热带海岛，中国唯一的自由贸易港", geoSub="先认清格局再排行程：东线玩阳光海岸、中线探雨林民族、西线看原始秘境。",
    intro=[
        "海南是中国唯一的热带海岛省：三亚的亚龙湾与蜈支洲岛、海口的骑楼老街与火山口撑起东线阳光海岸；"
        "保亭呀诺达与五指山是中线的热带雨林与黎苗村寨；儋州古盐田、昌江棋子湾与乐东尖峰岭则是人少景美的原始西线，再加上文昌航天城与博鳌论坛，海岛多元而年轻。",
        "本页按 12 个市县整理精选停靠点、地方代表味道与省内环线；带 ★ 的是重点停靠点，免费景点标「免费」；数据为整理版本（坐标 GCJ-02），"
        "门票与邮轮政策随季节调整，出行前以景区与官方公告为准。",
    ],
    facts=[
        ("面积", "陆地 3.54 万 km² + 海域约 200 万 km²"),
        ("常住人口", "1043 万（2023 年末）"),
        ("行政区", "4 地级市 + 5 县级市 + 4 县 + 6 自治县（省直辖）"),
        ("省会", "海口"),
        ("最高峰", "五指山 1867 m"),
        ("定位", "海南自由贸易港（2025 全岛封关运作）"),
    ],
    regions=[
        ("东线 · 阳光海岸", "海口、文昌、琼海、万宁、陵水、三亚：椰林、海湾与航天城，海南最成熟的度假海岸带。"),
        ("中线 · 雨林民族", "五指山、保亭：热带雨林国家公园与黎苗村寨，海南的绿色心脏与民族文化。"),
        ("西线 · 原始秘境", "儋州、昌江、乐东：古盐田、棋子湾与尖峰岭，人少景美的原始西海岸。"),
    ],
)

CITIES = [
    # id|name|lat|lng|role|desc
    ("haikou", "海口", 20.044, 110.199, "省会 · 椰城",
     "骑楼老街、火山口与观澜湖：海南门户，南洋风情的百年商埠与免税城。"),
    ("sanya", "三亚", 18.253, 109.512, "东方夏威夷 · 度假天堂",
     "亚龙湾、蜈支洲岛与天涯海角：中国最南的热带滨海度假城市。"),
    ("danzhou", "儋州", 19.521, 109.581, "西部中心 · 诗乡",
     "千年古盐田与东坡书院：苏东坡谪居地，洋浦港与海花岛的西部门户。"),
    ("qionghai", "琼海", 19.258, 110.472, "博鳌论坛 · 万泉河",
     "博鳌亚洲论坛会址与玉带滩：万泉河入海口的小城，医疗旅游先行区。"),
    ("wanning", "万宁", 18.796, 110.389, "冲浪之都 · 侨乡",
     "石梅湾、日月湾与东山岭：中国冲浪胜地，兴隆咖啡与东南亚归侨风情。"),
    ("wenchang", "文昌", 19.613, 110.753, "航天城 · 椰子之乡",
     "文昌航天发射场、铜鼓岭与东郊椰林：中国最南的航天母港与文昌鸡故乡。"),
    ("lingshui", "陵水", 18.506, 110.037, "珍珠海岸",
     "分界洲岛、清水湾与南湾猴岛：会唱歌的沙滩与潜水海岛，黎族聚居地。"),
    ("baoting", "保亭", 18.637, 109.703, "雨林温泉 · 黎苗之乡",
     "呀诺达、槟榔谷与七仙岭：热带雨林、黎苗非遗与雨林温泉的秘境。"),
    ("wuzhishan", "五指山", 18.775, 109.517, "海南屋脊 · 翡翠山城",
     "五指山热带雨林与牙胡梯田：海南最高峰，黎族文化与雨林国家公园核心。"),
    ("changjiang", "昌江", 19.298, 109.054, "山海黎乡 · 西海岸",
     "棋子湾与霸王岭：西海岸最美落日海湾，海南长臂猿的雨林家园。"),
    ("ledong", "乐东", 18.746, 109.175, "尖峰天池 · 盐场",
     "尖峰岭与莺歌海盐场：中国最美森林之一的天池，南方最大海盐场。"),
    ("chengmai", "澄迈", 19.738, 110.006, "长寿之乡 · 咖啡",
     "福山咖啡与永庆寺：世界长寿之乡，海口西郊的咖啡小镇与火山古村。"),
]

SPOTS = r"""
qilou|骑楼老街|culture|haikou|20.036|110.342|南洋风格百年商埠：中山路与得胜沙的骑楼群，海口的烟火与历史。|img=hai_qilou|season=全年|free|key
huoshankou|雷琼火山口|mountain|haikou|19.900|110.270|万年火山地质公园：火山口与熔岩隧道，海口石山镇的黑豆腐与荔枝。|img=hai_huoshankou|ticket=60 元|season=全年
guanyinhu|观澜湖电影公社|culture|haikou|19.940|110.300|冯小刚电影主题街区：民国街与南洋街，电影取景地与温泉度假区。|img=hai_guanlanhu|ticket=各街区|season=全年
yalongwan|亚龙湾|scenery|sanya|18.210|109.640|「天下第一湾」：7 公里银沙与清澈海水，海南最高端的度假海湾。|img=hai_yalongwan|season=11 月–次年 4 月|free|key
wuzhizhou|蜈支洲岛|scenery|sanya|18.320|109.760|中国的马尔代夫：潜水天堂与情人岛，海水能见度与珊瑚礁最佳。|img=hai_wuzhizhou|ticket=船票+门票 168 元|season=全年，潜水|key
tianyahaijiao|天涯海角|landmark|sanya|18.236|109.400|「天涯」与「海角」巨石：中国最南的浪漫地标，爱情的象征。|img=hai_tianyahaijiao|ticket=81 元|season=全年|key
nanshan|南山文化旅游区|culture|sanya|18.290|109.210|108 米海上观音：佛教文化园与不二法门，三亚湾西端的地标。|img=hai_nanshan|ticket=129 元|season=全年|key
dadonghai|大东海|scenery|sanya|18.230|109.510|市区最方便的海湾：免费开放，沙滩平缓、夜生活丰富，背包客聚集地。|img=hai_dadonghai|season=全年|free
gumyantian|千年古盐田|culture|danzhou|19.730|109.200|洋浦 1200 年古法晒盐：千余个砚式石盐槽，中国保存最完整的古盐场。|img=hai_gumyantian|season=全年|free|key
dongpo|东坡书院|culture|danzhou|19.680|109.280|苏轼谪居儋州讲学处：载酒堂与东坡井，海南文脉的源头之一。|img=hai_dongpo|ticket=10 元|season=全年
boao|博鳌亚洲论坛会址|landmark|qionghai|19.160|110.580|博鳌亚洲论坛永久会址：万泉河入海口，中国面向亚洲的外交小镇。|img=hai_boao|ticket=128 元|season=全年，年会期|key
yudaitan|玉带滩|scenery|qionghai|19.170|110.590|博鳌河海分界沙洲：一侧万泉河一侧南海， Guinness 记录的狭长沙滩。|img=hai_yudaitan|season=全年
shimeiwan|石梅湾|scenery|wanning|18.700|110.300|青皮林与加井岛：《非诚勿扰2》取景地，艾美酒店与宁静海湾。|img=hai_shimeiwan|season=11 月–次年 4 月|key
riyuewan|日月湾|scenery|wanning|18.620|110.370|中国冲浪之都：常年浪况稳定，国内外冲浪爱好者的聚集海湾。|img=hai_riyuewan|season=全年冲浪|key
dongshanling|东山岭|mountain|wanning|18.790|110.390|「海南第一山」：摩崖石刻与潮音寺，东山羊的原产地。|img=hai_dongshanling|ticket=50 元|season=全年
hangtian|文昌航天发射场|landmark|wenchang|19.620|110.850|中国最南的航天母港：龙楼镇可近距离观看火箭发射，航天科普中心。|img=hai_hangtian|ticket=发射观礼另计|season=看发射日历|key
tongguling|铜鼓岭|mountain|wenchang|19.660|110.870|海南东海岸最高峰：俯瞰月亮湾与铜鼓角，原始海岸与观日胜地。|img=hai_tongguling|ticket=40 元|season=全年
dongjiao|东郊椰林|scenery|wenchang|19.590|110.830|「文昌椰子半海南」：十里椰林海岸与清澜港，文昌鸡与椰子饭。|img=hai_dongjiao|season=全年
fenjiezhou|分界洲岛|scenery|lingshui|18.580|110.180|潜水与海洋动物互动：海南南北气候分界岭下的海岛，水质清澈。|img=hai_fenjiezhou|ticket=船票+门票 150 元|season=全年|key
qingshuiwan|清水湾|scenery|lingshui|18.500|110.050|「会唱歌的沙滩」：沙质细腻走上去发声，高端度假与高尔夫。|img=hai_qingshuiwan|season=11 月–次年 4 月|key
nanwan|南湾猴岛|scenery|lingshui|18.400|110.030|猕猴自然保护区：跨海缆车与猕猴表演，半岛上的野生猴群。|img=hai_nanwan|ticket=158 元含缆车|season=全年
yanoda|呀诺达雨林|scenery|baoting|18.420|109.740|热带雨林文化区：踏瀑戏水与高空滑索，北纬 18° 的雨林奇观。|img=hai_yanoda|ticket=155 元|season=全年|key
binglanggu|槟榔谷|culture|baoting|18.470|109.700|黎苗文化活态博物馆：非遗村寨与实景演出，海南原住民文化窗口。|img=hai_binglanggu|ticket=98 元|season=全年|key
qixianling|七仙岭|mountain|baoting|18.620|109.720|雨林温泉：七座山峰如指，山脚的天然热泉与热带植物园。|img=hai_qixianling|ticket=各温泉分售|season=全年，温泉
wuzhishanfeng|五指山热带雨林|mountain|wuzhishan|18.880|109.680|海南最高峰 1867 m：热带雨林国家公园核心，五指状峰峦与云雾。|img=hai_wuzhishanfeng|ticket=各景点|season=全年|key
yahu|牙胡梯田|scenery|wuzhishan|18.950|109.600|海南最美梯田：层层叠叠的稻浪与云雾，摄影与农耕景观。|img=hai_yahu|season=5–6 月灌水，9–10 月稻黄|free
qiziwan|棋子湾|scenery|changjiang|19.350|108.950|西海岸最美海湾：落日、礁石与银沙，海南最干净的原始海岸之一。|img=hai_qiziwan|season=11 月–次年 4 月|key
bawangling|霸王岭|mountain|changjiang|19.150|109.050|热带雨林与海南长臂猿：中国唯一长臂猿栖息地，原始森林徒步。|img=hai_bawangling|ticket=40 元|season=全年
jianfengling|尖峰岭|mountain|ledong|18.730|108.870|中国最美十大森林：主峰天池与热带雨林，避暑与观鸟胜地。|img=hai_jianfengling|ticket=50 元|season=全年|key
yinggehai|莺歌海盐场|scenery|ledong|18.500|108.700|南方最大海盐场：天空之镜般的盐田与落日，工业景观摄影地。|img=hai_yinggehai|season=全年，傍晚|free
fushan|福山咖啡小镇|culture|chengmai|19.750|109.980|中国咖啡文化名镇：福山咖啡与长寿之乡，火山岩土壤的咖啡馆。|img=hai_fushan|season=全年
"""

FOODS = [
    ("文昌鸡", "文昌", "海南四大名菜之首：白切皮黄骨酥、肉质嫩滑，配鸡油饭与橘酱。"),
    ("东山羊", "万宁", "四大名菜：东山岭放养黑山羊，红焖或白切，皮脆肉嫩、无膻味。"),
    ("和乐蟹", "万宁", "四大名菜：港北港青蟹膏满肉肥，清蒸最鲜，海南蟹中之王。"),
    ("嘉积鸭", "琼海", "四大名菜：万泉河番鸭，白切或板鸭，皮薄肉嫩、肥而不腻。"),
    ("海南粉", "海口", "腌粉配酸菜花生与牛肉干：海口人的早餐，拌粉与汤粉两吃。"),
    ("三亚海鲜", "三亚", "第一市场自选海鲜加工：和乐蟹、龙虾与芒果螺，现挑现做最划算。"),
    ("陵水酸粉", "陵水", "细粉配酸汤与小鱼干、牛肉干：酸辣开胃，海南南部的特色腌粉。"),
    ("福山咖啡", "澄迈", "火山岩土壤种的罗布斯塔咖啡：炭烧浓香，配咖啡糕的长寿乡味道。"),
]

LOOPS = [
    dict(name="东线阳光海岸环线", days="5–6 天", km="约 400 km",
         desc="海口→文昌→琼海→万宁→陵水→三亚的经典东线：航天城、博鳌、冲浪与海岛。",
         path="海口(骑楼·火山口) → 文昌(航天发射场·铜鼓岭) → 琼海(博鳌·玉带滩) → 万宁(石梅湾·日月湾) → 陵水(分界洲岛) → 三亚 → 海口",
         note="东线高速最成熟；文昌看火箭发射查日历；蜈支洲岛与分界洲岛潜水需提前订船票。",
         ids="haikou,wenchang,hangtian_wp,qionghai,boao_wp,wanning,shimeiwan_wp,lingshui,fenjiezhou_wp,sanya,haikou"),
    dict(name="西线原始秘境环线", days="4–5 天", km="约 500 km",
         desc="三亚→乐东→昌江→儋州→海口的西线：尖峰岭、棋子湾、古盐田，人少景美。",
         path="三亚 → 乐东(尖峰岭·莺歌海盐场) → 昌江(棋子湾·霸王岭) → 儋州(千年古盐田·东坡书院) → 海口 → 三亚",
         note="西线高速路况好但景点分散；尖峰岭天池需上山；棋子湾看落日；古盐田在洋浦。",
         ids="sanya,ledong,jianfengling_wp,changjiang,qiziwan_wp,danzhou,gumyantian_wp,haikou,sanya"),
    dict(name="中线雨林民族环线", days="3–4 天", km="约 350 km",
         desc="三亚→保亭→五指山的中线：呀诺达、槟榔谷与五指山雨林，黎苗文化与温泉。",
         path="三亚 → 保亭(呀诺达·槟榔谷·七仙岭温泉) → 五指山(热带雨林·牙胡梯田) → 海口 → 三亚",
         note="中线山路弯多备晕车药；呀诺达踏瀑戏水备换洗衣物；五指山雨林徒步防滑防蚊。",
         ids="sanya,baoting,yanoda_wp,binglanggu_wp,qixianling_wp,wuzhishan,wuzhishanfeng_wp,haikou,sanya"),
    dict(name="三亚海岛度假短线", days="2–3 天", km="约 120 km",
         desc="三亚市内的海湾与海岛精华：亚龙湾、蜈支洲岛、天涯海角与南山。",
         path="三亚(亚龙湾) → 蜈支洲岛 → 天涯海角 → 南山文化旅游区 → 三亚",
         note="蜈支洲岛潜水与水上项目最全；南山海上观音需大半天；天涯海角与南山同在市区西。",
         ids="sanya,yalongwan_wp,wuzhizhou_wp,tianyahaijiao_wp,nanshan_wp,sanya"),
]

TIPS = [
    ("三亚", "亚龙湾沙质最好、蜈支洲岛潜水最美、大东海最方便；旺季（春节）房价翻数倍需早订。"),
    ("海岛潜水", "蜈支洲岛、分界洲岛、西岛需坐船，晕船备药；潜水选正规俱乐部，遵守珊瑚保护规定。"),
    ("雨林", "呀诺达、五指山、霸王岭是热带雨林，徒步防滑防蚊；霸王岭与尖峰岭可遇海南长臂猿。"),
    ("西沙", "三沙西沙群岛仅对中国公民开放，需从三亚凤凰岛坐邮轮并提前政审，行程受海况影响大。"),
    ("季节", "11 月–次年 4 月是黄金季（干爽避寒）；5–10 月炎热多雨且有台风，出行务必看台风预警。"),
]

WAYPOINTS = {
    "haikou": ("海口", 20.044, 110.199),
    "wenchang": ("文昌", 19.613, 110.753),
    "hangtian_wp": ("文昌航天发射场", 19.620, 110.850),
    "qionghai": ("琼海", 19.258, 110.472),
    "boao_wp": ("博鳌", 19.160, 110.580),
    "wanning": ("万宁", 18.796, 110.389),
    "shimeiwan_wp": ("石梅湾", 18.700, 110.300),
    "lingshui": ("陵水", 18.506, 110.037),
    "fenjiezhou_wp": ("分界洲岛", 18.580, 110.180),
    "sanya": ("三亚", 18.253, 109.512),
    "ledong": ("乐东", 18.746, 109.175),
    "jianfengling_wp": ("尖峰岭", 18.730, 108.870),
    "changjiang": ("昌江", 19.298, 109.054),
    "qiziwan_wp": ("棋子湾", 19.350, 108.950),
    "danzhou": ("儋州", 19.521, 109.581),
    "gumyantian_wp": ("千年古盐田", 19.730, 109.200),
    "baoting": ("保亭", 18.637, 109.703),
    "yanoda_wp": ("呀诺达", 18.420, 109.740),
    "binglanggu_wp": ("槟榔谷", 18.470, 109.700),
    "qixianling_wp": ("七仙岭", 18.620, 109.720),
    "wuzhishan": ("五指山", 18.775, 109.517),
    "wuzhishanfeng_wp": ("五指山雨林", 18.880, 109.680),
    "yalongwan_wp": ("亚龙湾", 18.210, 109.640),
    "wuzhizhou_wp": ("蜈支洲岛", 18.320, 109.760),
    "tianyahaijiao_wp": ("天涯海角", 18.236, 109.400),
    "nanshan_wp": ("南山", 18.290, 109.210),
}
