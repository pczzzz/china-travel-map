# -*- coding: utf-8 -*-
"""河北分省路书内容：城市 / 景点 / 美食 / 环线 / 提示 / 途径点（坐标 WGS-84，构建转 GCJ-02）"""

PROV = dict(
    id="hebei", name="河北", en="Hebei", capital="石家庄",
    tagline="燕赵大地 · 长城草原 · 环抱京津",
    geoTitle="环抱京津，长城与草原的交汇", geoSub="先认清格局再排行程：坝上玩草原冰雪、冀中看古都平原、冀东走长城滨海。",
    intro=[
        "河北环抱北京天津，是燕赵大地的核心：承德避暑山庄与外八庙、张家口草原天路与崇礼雪场撑起坝上草原冰雪；"
        "秦皇岛山海关与北戴河、唐山清东陵是冀东的长城滨海；石家庄正定古城、保定白洋淀与西柏坡、邯郸广府古城则是冀中的古都平原，太行与渤海在此交汇。",
        "本页按 11 个地市整理精选停靠点、地方代表味道与省内环线；带 ★ 的是重点停靠点，免费景点标「免费」；数据为整理版本（坐标 GCJ-02），"
        "门票与季节政策随景区调整，出行前以官方公告为准。",
    ],
    facts=[
        ("面积", "18.88 万 km²"),
        ("常住人口", "7393 万（2023 年末）"),
        ("地级市", "11 个"),
        ("省会", "石家庄"),
        ("最高峰", "小五台山 2882 m"),
        ("世界遗产", "承德避暑山庄、清东陵、长城（山海关/金山岭）等"),
    ],
    regions=[
        ("坝上 · 草原林海", "张家口、承德北部：草原天路、塞罕坝与崇礼雪场，华北的草原与冰雪高地。"),
        ("冀中 · 古都平原", "石家庄、保定、廊坊、衡水、邢台、邯郸：正定古城、白洋淀与西柏坡，华北平原腹地与太行东麓。"),
        ("冀东 · 长城滨海", "秦皇岛、唐山、承德：山海关、北戴河与清东陵，长城与渤海相拥的东部。"),
    ],
)

CITIES = [
    # id|name|lat|lng|role|desc
    ("shijiazhuang", "石家庄", 38.042, 114.514, "省会 · 太行门户",
     "正定古城、赵州桥与西柏坡：京广枢纽，千年古建与红色圣地。"),
    ("baoding", "保定", 38.874, 115.464, "京畿重地 · 直隶总督",
     "白洋淀、野三坡与狼牙山：华北明珠与太行峡谷，直隶总督署所在。"),
    ("chengde", "承德", 40.952, 117.939, "皇家避暑 · 塞外明珠",
     "避暑山庄、外八庙与塞罕坝：清代夏都，世界遗产皇家园林与林海。"),
    ("zhangjiakou", "张家口", 40.768, 114.886, "冬奥之城 · 坝上草原",
     "草原天路、崇礼滑雪与大境门：中国66号公路与冬奥雪场。"),
    ("qinhuangdao", "秦皇岛", 39.935, 119.600, "长城滨海 · 避暑胜地",
     "山海关、老龙头与北戴河：天下第一关与长城入海，北方著名海滨。"),
    ("tangshan", "唐山", 39.630, 118.180, "工业摇篮 · 京东",
     "清东陵、南湖与开滦：世界遗产皇陵与工业转型的凤凰城。"),
    ("handan", "邯郸", 36.625, 114.539, "三千年古都 · 成语之乡",
     "广府古城、娲皇宫与响堂山：赵国故都与太极之乡，成语典故之城。"),
    ("xingtai", "邢台", 37.070, 114.505, "太行泉城 · 古都",
     "崆山白云洞与天河山：华北溶洞奇观与太行峡谷，五朝古都。"),
    ("cangzhou", "沧州", 38.304, 116.839, "杂技之乡 · 武术",
     "吴桥杂技大世界与铁狮子：杂技与武术之乡，运河边的狮城。"),
    ("hengshui", "衡水", 37.739, 115.670, "湿地湖城 · 内画",
     "衡水湖与内画：华北最大淡水湿地，荷花与候鸟的生态之城。"),
    ("langfang", "廊坊", 39.538, 116.683, "京津走廊 · 戏剧幻城",
     "只有红楼梦·戏剧幻城与香河肉饼：京津之间的沉浸式戏剧与家具城。"),
]

SPOTS = r"""
zhengding|正定古城·隆兴寺|culture|shijiazhuang|38.146|114.570|千年古建博物馆：隆兴寺倒坐观音与宋代建筑，免费古城与四塔。|img=heb_zhengding|ticket=隆兴寺 50 元，古城免费|season=全年|free|key
zhaozhouqiao|赵州桥|landmark|shijiazhuang|37.765|114.800|世界最古老敞肩石拱桥：隋代安济桥，「赵州桥来什么人修」的课本名桥。|img=heb_zhaozhouqiao|ticket=40 元|season=全年|key
xibaipo|西柏坡|culture|shijiazhuang|38.260|113.940|「新中国从这里走来」：中共中央旧址与纪念馆，红色旅游经典。|img=heb_xibaipo|season=全年|free|key
baiyangdian|白洋淀|scenery|baoding|38.900|115.950|华北明珠：万亩荷花与芦苇荡，嘎子与雁翎队的抗日水上游击战场。|img=heb_baiyangdian|ticket=40 元+船票|season=7–9 月荷花|key
yesanpo|野三坡|scenery|baoding|39.650|115.350|世界地质公园：百里峡嶂谷与拒马河，太行山深处的峡谷漂流。|img=heb_yesanpo|ticket=百里峡 115 元|season=5–10 月|key
langyashan|狼牙山|mountain|baoding|39.350|115.100|五壮士跳崖处：太行奇峰与红色纪念，易县的登山与索道。|img=heb_langyashan|ticket=80 元|season=4–10 月|key
zhili|直隶总督署|museum|baoding|38.870|115.470|清代省级衙署：保存最完整的总督署，曾国藩李鸿章袁世凯办公地。|img=heb_zhili|ticket=30 元|season=全年
bishushanzhuang|避暑山庄|culture|chengde|40.990|117.940|中国最大皇家园林·世界遗产：清代夏都，山水园林与宫殿区。|img=heb_bishushanzhuang|ticket=130 元|season=5–10 月|level=世界遗产|key
puningsi|普宁寺·外八庙|culture|chengde|41.010|117.950|世界遗产：千手千眼观音与小布达拉宫（普陀宗乘之庙），藏传佛教寺庙群。|img=heb_puningsi|ticket=各庙分售|season=全年|level=世界遗产|key
saihanba|塞罕坝·木兰围场|scenery|chengde|42.400|117.200|百万亩林海：世界最大人工林与御道口草原，秋季层林尽染。|img=heb_saihanba|ticket=130 元|season=6–9 月绿，9 月底红叶|key
caoyuantianlu|草原天路|scenery|zhangjiakou|40.950|114.900|「中国66号公路」：张北百里风车草原与梯田，自驾观光的坝上画廊。|img=heb_caoyuantianlu|season=6–9 月|free|key
chongli|崇礼滑雪|scenery|zhangjiakou|40.970|115.450|冬奥雪场：太舞、云顶与万龙，中国北方的滑雪度假胜地。|img=heb_chongli|ticket=各雪场|season=11 月–次年 3 月|key
nuanquan|暖泉古镇|culture|zhangjiakou|39.850|114.500|蔚县古堡与打树花：1600℃铁水泼洒成金花，明清古堡民俗。|img=heb_nuanquan|ticket=打树花演出另计|season=全年，春节最盛|key
dajingmen|大境门|landmark|zhangjiakou|40.820|114.870|「万里长城第一门」：张家口地标，明清边贸与大好河山题刻。|img=heb_dajingmen|ticket=40 元|season=全年
shanhaiguan|山海关|landmark|qinhuangdao|40.010|119.750|「天下第一关」·世界遗产：明长城东端起点，雄关与古城。|img=heb_shanhaiguan|ticket=50 元|season=全年|level=世界遗产|key
laolongtou|老龙头|landmark|qinhuangdao|39.990|119.770|长城入海处：澄海楼与宁海城，万里长城唯一伸入大海的部分。|img=heb_laolongtou|ticket=60 元|season=全年|key
beidaihe|北戴河|scenery|qinhuangdao|39.830|119.490|百年避暑胜地：鸽子窝观日出与海滨浴场，中国著名的休养海岸。|img=heb_beidaihe|season=5–10 月|free|key
huangjinhaiyan|黄金海岸|scenery|qinhuangdao|39.850|119.150|昌黎滑沙与翡翠岛：沙漠与大海相接，天然滑沙场与海洋保护区。|img=heb_huangjinhaiyan|season=5–10 月
qingdongling|清东陵|culture|tangshan|40.180|117.660|世界遗产皇家陵寝：顺治、康熙、乾隆与慈禧陵，中国现存规模宏大的清陵。|img=heb_qingdongling|ticket=108 元|season=全年|level=世界遗产|key
nanku|唐山南湖·开滦|scenery|tangshan|39.620|118.200|工业转型典范：采煤沉降区变南湖公园，开滦煤矿博物馆与中国第一佳矿。|img=heb_nanku|ticket=南湖免费，开滦 80 元|season=全年|free
luanzhou|滦州古城|culture|tangshan|39.740|118.700|「北方小江南」：滦河边的仿古水城，夜景与皮影戏，冀东民俗。|img=heb_luanzhou|season=全年，夜景|free
guangfu|广府古城|culture|handan|36.870|115.090|太极之乡水城：杨式武式太极拳发源地，永年洼湿地与明代城墙。|img=heb_guangfu|ticket=65 元|season=全年|key
wahuanggong|娲皇宫|culture|handan|36.650|113.650|涉县女娲祭典：吊庙悬于峭壁，华夏始祖女娲与摩崖刻经。|img=heb_wahuanggong|ticket=70 元|season=全年|key
xiangtangshan|响堂山石窟|culture|handan|36.500|114.200|北齐皇家石窟：峰峰矿区山中的佛教造像，刻经洞与精美石雕。|img=heb_xiangtangshan|ticket=50 元|season=全年
huangliangmeng|黄粱梦吕仙祠|culture|handan|36.700|114.480|「黄粱一梦」典故地：吕仙祠与卢生殿，邯郸成语文化的源头。|img=heb_huangliangmeng|ticket=40 元|season=全年
kongshan|崆山白云洞|scenery|xingtai|37.500|114.400|北方溶洞奇观：临城地下溶洞，石钟乳与地下河，华北罕见。|img=heb_kongshan|ticket=90 元|season=全年
tianhe|天河山|mountain|xingtai|37.150|113.900|太行峡谷与爱情山：赤壁与瀑布，邢台大峡谷的山水徒步。|img=heb_tianhe|ticket=60 元|season=5–10 月
wuqiao|吴桥杂技大世界|culture|cangzhou|37.620|116.380|杂技之乡：江湖文化城与杂技表演，中国杂技艺术的摇篮。|img=heb_wuqiao|ticket=160 元|season=全年|key
tiexu|沧州铁狮子|landmark|cangzhou|38.280|117.030|「镇海吼」：后周铸铁狮子，沧州象征，中国现存最大古代铁铸件。|img=heb_tiexu|ticket=30 元|season=全年
hengshuihu|衡水湖|scenery|hengshui|37.700|115.700|华北最大淡水湿地：万亩荷花与候鸟，环湖骑行与观鸟胜地。|img=heb_hengshuihu|ticket=40 元|season=6–10 月|key
hongloumeng|只有红楼梦·戏剧幻城|culture|langfang|39.520|116.700|王潮歌沉浸式戏剧：百余情境空间与剧场，京津走廊的文化新地标。|img=heb_hongloumeng|ticket=各剧场|season=全年
"""

FOODS = [
    ("正定八大碗", "石家庄", "正定传统宴席：扣肉、丸子与酥肉等八碗蒸菜，配马家卤鸡最地道。"),
    ("保定驴肉火烧", "保定", "漕河圆火烧夹卤驴肉：外酥里嫩、驴香浓郁，「天上龙肉地下驴肉」。"),
    ("承德平泉羊汤", "承德", "平泉羊汤配烧饼：塞外御膳风味，汤白肉嫩、暖身驱寒。"),
    ("柴沟堡熏肉", "张家口", "怀安百年熏肉：柏木熏制、皮烂肉嫩，配蔚县糊糊面与莜面。"),
    ("山海关浑锅", "秦皇岛", "长城脚下的什锦火锅：丸子、焖子与海鲜同煮，山海关的冬日暖锅。"),
    ("大名二毛烧鸡", "邯郸", "百年老字号烧鸡：透骨离肉、咸香入味，邯郸人的待客硬菜。"),
    ("沧州火锅鸡", "沧州", "麻辣鸡块配甜蒜：运河边的江湖菜，铜锅炖煮、越煮越香。"),
    ("香河肉饼", "廊坊", "薄如纸的多层肉饼：外焦里嫩、肉香四溢，京津走廊的名吃。"),
]

LOOPS = [
    dict(name="皇家承德草原环线", days="5–6 天", km="约 900 km",
         desc="石家庄+保定+承德+张家口的坝上皇家线：避暑山庄、外八庙、塞罕坝与草原天路。",
         path="石家庄 → 保定(白洋淀·野三坡) → 承德(避暑山庄·外八庙·塞罕坝) → 张家口(草原天路·崇礼) → 石家庄",
         note="避暑山庄与外八庙需 2 天；塞罕坝 9 月底红叶最美；草原天路自驾注意坝上大风与温差。",
         ids="shijiazhuang,baoding,bishushanzhuang_wp,chengde,saihanba_wp,zhangjiakou,caoyuantianlu_wp,shijiazhuang"),
    dict(name="长城滨海环线", days="3–4 天", km="约 400 km",
         desc="秦皇岛+唐山的冀东长城海岸线：山海关、老龙头、北戴河与清东陵。",
         path="秦皇岛(山海关·老龙头) → 北戴河 → 唐山(清东陵·滦州古城) → 秦皇岛",
         note="山海关与老龙头同看长城入海；北戴河 7–8 月旺季房贵早订；清东陵需大半天。",
         ids="qinhuangdao,shanhaiguan_wp,laolongtou_wp,beidaihe_wp,tangshan,qingdongling_wp,luanzhou_wp,qinhuangdao"),
    dict(name="太行红色古都环线", days="4–5 天", km="约 700 km",
         desc="石家庄+保定+邢台+邯郸的冀中南线：正定、西柏坡、狼牙山、娲皇宫与广府古城。",
         path="石家庄(正定·赵州桥·西柏坡) → 保定(狼牙山·直隶总督署) → 邢台(崆山白云洞) → 邯郸(娲皇宫·广府古城) → 石家庄",
         note="正定古城免费、隆兴寺看宋代建筑；西柏坡红色研学；广府古城是太极之乡。",
         ids="shijiazhuang,zhengding_wp,xibaipo_wp,baoding,langyashan_wp,xingtai,kongshan_wp,handan,wahuanggong_wp,guangfu_wp,shijiazhuang"),
    dict(name="崇礼冬奥冰雪短线", days="2 天", km="约 200 km",
         desc="张家口冬季冰雪线：草原天路冬景、崇礼滑雪与大境门。",
         path="张家口(大境门) → 崇礼(滑雪) → 草原天路 → 张家口",
         note="崇礼 11 月–次年 3 月滑雪，雪场提前订房；坝上冬季严寒备厚装；草原天路冬季部分封闭。",
         ids="zhangjiakou,dajingmen_wp,chongli_wp,caoyuantianlu_wp,zhangjiakou"),
]

TIPS = [
    ("承德", "避暑山庄与外八庙是世界遗产，逛完需 2 天；塞罕坝与木兰围场秋季（9 月底）层林尽染最美。"),
    ("长城", "山海关「天下第一关」与老龙头（长城入海）是精华；金山岭长城在滦平，摄影最佳但归承德。"),
    ("草原冰雪", "草原天路（张北）与塞罕坝 6–9 月绿草如茵，崇礼冬季滑雪（冬奥雪场）；坝上昼夜温差大备厚装。"),
    ("滨海", "北戴河与黄金海岸是避暑海滨，鸽子窝看日出；7–8 月旺季人多房贵需早订。"),
    ("季节", "5–10 月最佳（草原、海滨、红叶）；冬季崇礼滑雪；春季坝上风大，秋季山区层林尽染。"),
]

WAYPOINTS = {
    "shijiazhuang": ("石家庄", 38.042, 114.514),
    "zhengding_wp": ("正定古城", 38.146, 114.570),
    "xibaipo_wp": ("西柏坡", 38.260, 113.940),
    "baoding": ("保定", 38.874, 115.464),
    "langyashan_wp": ("狼牙山", 39.350, 115.100),
    "bishushanzhuang_wp": ("避暑山庄", 40.990, 117.940),
    "chengde": ("承德", 40.952, 117.939),
    "saihanba_wp": ("塞罕坝", 42.400, 117.200),
    "zhangjiakou": ("张家口", 40.768, 114.886),
    "caoyuantianlu_wp": ("草原天路", 40.950, 114.900),
    "chongli_wp": ("崇礼", 40.970, 115.450),
    "dajingmen_wp": ("大境门", 40.820, 114.870),
    "qinhuangdao": ("秦皇岛", 39.935, 119.600),
    "shanhaiguan_wp": ("山海关", 40.010, 119.750),
    "laolongtou_wp": ("老龙头", 39.990, 119.770),
    "beidaihe_wp": ("北戴河", 39.830, 119.490),
    "tangshan": ("唐山", 39.630, 118.180),
    "qingdongling_wp": ("清东陵", 40.180, 117.660),
    "luanzhou_wp": ("滦州古城", 39.740, 118.700),
    "xingtai": ("邢台", 37.070, 114.505),
    "kongshan_wp": ("崆山白云洞", 37.500, 114.400),
    "handan": ("邯郸", 36.625, 114.539),
    "wahuanggong_wp": ("娲皇宫", 36.650, 113.650),
    "guangfu_wp": ("广府古城", 36.870, 115.090),
}
