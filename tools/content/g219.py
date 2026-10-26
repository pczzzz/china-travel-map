# -*- coding: utf-8 -*-
"""G219 喀纳斯—东兴 内容源（v2）。格式同 g331.py。
NEW 行可选附加 km=XXXX / detour=1（表示需绕行的挂载节点）"""

ROUTE = "g219"

ORDER = ("喀纳斯,哈巴河,吉木乃,和布克赛尔,裕民,博乐,温泉,霍城,伊宁,察布查尔,昭苏,特克斯,"
         "温宿,乌什,阿合奇,乌恰,喀什,伽师,岳普湖,英吉沙,莎车,泽普,叶城,三十里营房,大红柳滩,"
         "界山达坂,日土,噶尔·狮泉河,札达,普兰,仲巴,萨嘎,吉隆,定日,定结,岗巴,康马,洛扎,措美,"
         "隆子,加查,朗县,米林,墨脱,察隅,察瓦龙,丙中洛,贡山,福贡,泸水·六库,腾冲,龙陵,永德,"
         "镇康,沧源,西盟,孟连,澜沧,勐海,景洪,勐腊,江城,绿春,元阳,金平,屏边,河口,马关,西畴,"
         "麻栗坡,靖西,大新,宁明,凭祥,上思,东兴")

NEW = r"""
霍城|新疆|county|44.06|80.88|伊犁门户|果子沟与赛里木湖在南境，惠远古城是清代伊犁将军驻地。
伊宁|新疆|city|43.92|81.32|塞上江南|伊犁河谷中心城市，六星街与喀赞其民俗区保存完整的俄式与维吾尔民居。
察布查尔|新疆|county|43.84|81.15|锡伯故里|全国唯一锡伯自治县，西迁节与锡伯族射箭传统延续至今。
特克斯|新疆|county|43.22|81.84|八卦城|世界唯一保存完整的八卦布局城市，喀拉峻草原在境内。
乌恰|新疆|county|39.72|75.26|西陲口岸|伊尔克什坦与吐尔尕特两大口岸在境内，天山与昆仑山交汇。
喀什|新疆|city|39.47|75.99|西域都会|国家历史文化名城，老城与艾提尕尔清真寺是南疆文化核心。km=2280
札达|西藏|county|31.48|79.80|古格王朝|象泉河谷的古格王朝都城与土林地貌，需绕行 250km。km=4000|detour=1
普兰|西藏|county|30.30|81.18|神山圣湖|冈仁波齐与玛旁雍错均在境内，中尼印三国交界的边境县。km=3900|detour=1
康马|西藏|county|28.55|89.68|喜马拉雅北麓|乃宁曲德寺与冲巴雍错，是通往亚东沟的岔口。
加查|西藏|county|29.14|92.59|雅江峡谷|拉姆拉错入口与雅鲁藏布江峡谷，核桃与藏式木碗产地。
朗县|西藏|county|29.04|93.07|藏王陵地|列山古墓群为吐蕃时期最大墓群，雅江沿岸核桃林。
察瓦龙|西藏|town|28.32|98.55|丙察察咽喉|怒江与澜沧江分水岭上的乡，丙察察最难一段，雨季常断。
勐腊|云南|county|21.48|101.57|雨林望天树|中国热带雨林保存最好的县，望天树与磨憨口岸在境内。
元阳|云南|county|23.09|102.83|哈尼梯田|红河哈尼梯田核心区，世界文化遗产，多依树与老虎嘴最出名。
河口|云南|county|22.51|103.96|滇越口岸|中越铁路口岸，滇越铁路终点，需绕行。km=9680|detour=1
大新|广西|county|22.83|107.20|德天瀑布|亚洲第一大跨国瀑布德天与明仕田园喀斯特峰林。
宁明|广西|county|22.13|107.07|花山岩画|左江花山岩画是世界文化遗产，骆越先民 2000 年前的崖壁祭祀。
上思|广西|county|22.15|107.98|十万大山|十万大山北麓，森林覆盖率超 60%，是环海边防路的山区段。
"""

KM_OVERRIDE = {"靖西": 9800, "大新": 9880, "宁明": 9930, "凭祥": 9970,
               "上思": 10010, "东兴": 10065}

POI = r"""
@喀纳斯|scenic|图瓦村,三湾,秋色|stay=贾登峪与村内均有住宿，旺季极贵|best=6–9月，9月中下旬彩林仅两周窗口|fuel=贾登峪有站
scenery|喀纳斯湖三湾|卧龙湾、月亮湾、神仙湾三段曲流，湖水随季节变色|img=kanas|k|season=6–9月
scenery|禾木村|图瓦人原始村落，晨雾与木屋炊烟是经典画面|img=hemu|k|season=9月下旬白桦金黄
mountain|观鱼台|海拔 2030m，1068 级台阶登顶俯瞰喀纳斯湖全景|elev=2030|diff=2|time=2小时|k
mountain|友谊峰徒步线|中蒙俄三国界峰 4374m，多日重装穿越需向导与许可|elev=4374|diff=5|time=4–6天|det|guide
food|图瓦人奶酒与风干肉|喀纳斯本地风味，配冷水鱼
culture|禾木哈纳斯蒙古族图瓦人乡|中国仅存约 2500 人的图瓦人聚居地

@哈巴河|county|西北之北,白哈巴|stay=县城宾馆少|best=6–9月
scenery|白哈巴村|中国西北第一村，需边防证，秋色胜过禾木|img=baihaba|k|border
landmark|哈巴河口岸（阿黑土别克）|中哈边境季节性口岸|border
food|大尾羊与冷水鱼|阿尔泰山南麓牧区

@吉木乃|county|口岸,草原石城|stay=县城宾馆少|best=6–9月
landmark|吉木乃口岸|中哈口岸，边贸市场|border
scenery|草原石城|花岗岩风蚀地貌，象形石群散布草原|img=jimunai_shicheng|k
culture|木斯套冰山与哈萨克转场|天山北麓转场道

@和布克赛尔|county|江格尔故乡,盐湖|stay=县城宾馆少|best=6–9月
culture|江格尔文化|蒙古族英雄史诗《江格尔》传承地，有江格尔博物馆
scenery|和布克赛尔盐湖|戈壁中的盐湖，夏季粉色卤水
food|蒙古族奶食与羊肉

@裕民|county|巴尔鲁克,野巴旦杏|stay=县城宾馆少|best=5月花期
scenery|巴尔鲁克山·塔斯提河|哈萨克牧场与野花坡，5 月野巴旦杏花|k|season=5月
mountain|巴尔鲁克山|主峰 3200m，森林草原过渡带，可一日徒步|elev=3200|diff=3|time=1天
culture|小白杨哨所|《小白杨》歌曲原型塔斯提哨所，可参观|border
food|裕民巴什拜羊|地方良种羊，肉质细嫩

@博乐|city|赛里木湖,果子沟|stay=市区酒店多，是伊犁东门户补给点|best=6–9月
scenery|赛里木湖|海拔 2073m 高山湖，环湖 90km，6 月野花最盛|img=sayramhu|k|season=6–9月|ticket=70 元
landmark|果子沟大桥|中国首座公路双塔双索面斜拉桥，跨越深谷|img=guozigou|k
mountain|赛里木湖环湖徒步|环湖有分段步道，北岸西海草原最缓|elev=2073|diff=2|time=半天
food|博乐凉皮与哈萨克熏马肠

@温泉|county|阿拉套山,圣泉|stay=县城宾馆少|best=6–9月
scenery|阿尔夏提温泉与阿拉套山|天山支脉高山温泉，边境管控区|border
mountain|阿拉套山南坡|中哈界山，可徒步至雪线，需边防证|elev=3500|diff=4|time=1–2天|guide
food|温泉县冷水鱼与黑蜂蜂蜜|天山黑蜂保护区

@霍城|county|伊犁将军,薰衣草|stay=清水河镇酒店多|best=6月薰衣草、9月果子沟
culture|惠远古城·伊犁将军府|清代新疆军政中心，钟鼓楼与将军府保存完好|k
scenery|解忧公主薰衣草园|6 月中下旬紫色花田，是伊犁最集中的薰衣草产区|season=6月
food|霍城樱桃与伊犁马肠子|5–6 月樱桃上市

@伊宁|city|六星街,喀赞其,伊犁河谷|stay=市区酒店充足，是新疆段最佳休整点|best=5–10月
culture|喀赞其民俗旅游区|维吾尔族传统民居区，蓝墙红门与马车穿行，可入户参观|k
culture|六星街|俄式放射状街区，手风琴博物馆与多民族混居历史
food|伊宁马肠子·纳仁与冰淇淋|哈萨克熏马肠配纳仁，本地冰淇淋出名
landmark|伊犁河大桥|日落观景点，伊犁河在此西流
museum|伊犁州博物馆|草原文明与伊犁将军史，免费|free

@察布查尔|county|锡伯族,西迁|stay=县城宾馆少，可住伊宁|best=5–9月
culture|锡伯族西迁节（4·18）|1764 年锡伯官兵西迁戍边纪念，农历四月十八最热闹
culture|靖远寺与锡伯族射箭|清代戍边寺庙，锡伯族射箭为国家级非遗
food|察布查尔锡伯族发面饼与全鱼宴|锡伯族大饼配伊犁河鱼

@昭苏|county|天马,油菜花海,夏塔|stay=县城宾馆旺季紧张|best=7月油菜花海、6–9月夏塔
scenery|昭苏草原·油菜花|7 月百万亩油菜花海与雪山同框，是全国最壮观的油菜花景观|img=zhaosu|k|season=7月
mountain|夏塔古道与木扎尔特冰川|海拔 3500m 起，古代翻越天山的军道，可徒步至冰川末端|img=xiata_gudao|elev=3500|diff=4|time=1–3天|k|guide
mountain|汗腾格里峰远眺|天山第二高峰 7010m，昭苏南部可见|elev=7010|diff=5|time=多日|det|guide
culture|格登碑与圣佑庙|清代平定准噶尔纪功碑，新疆保存最完整的喇嘛庙
food|昭苏天马宴与黑蜂蜜|伊犁马产地，马奶酒与熏马肉

@特克斯|county|八卦城,喀拉峻|stay=县城酒店多，喀拉峻景区有营地|best=6–8月草原
scenery|喀拉峻草原|世界自然遗产，五花草甸与猎鹰台，人体草原曲线|img=kalajun_caoyuan|k|season=6–7月|ticket=80 元+区间车
mountain|琼库什台古道|海拔 2000–3000m 的哈萨克村落，乌孙古道徒步起点|elev=2900|diff=4|time=2–4天|det|guide
culture|特克斯八卦城|1937 年按易经八卦布局建城，无红绿灯
food|特克斯酸奶与黑蜂蜜

@温宿|county|托木尔峰,峡谷|stay=县城宾馆少，可住阿克苏|best=5–10月
mountain|托木尔峰|天山最高峰 7443m，国家级自然保护区，登山需许可|elev=7443|diff=5|time=多日|det|guide
scenery|温宿大峡谷（托木尔大峡谷）|红色岩层峡谷，可自驾进入，步行段 2km|img=wensu_daxiagu|k
food|温宿大米与冰糖心苹果|阿克苏冰糖心苹果核心产区

@乌什|county|沙棘,边境|stay=县城宾馆少|best=5–10月
scenery|沙棘林与托木尔峰南麓|秋季沙棘果挂满枝头
culture|乌什燕泉与清代兵屯|清代戍边屯田遗址
food|乌什沙棘汁与核桃

@阿合奇|county|柯尔克孜,猎鹰|stay=县城宾馆少|best=6–9月
culture|柯尔克孜族猎鹰与《玛纳斯》史诗|世界级史诗《玛纳斯》传承地，冬季有猎鹰表演|k
mountain|天山南脉徒步|托什干河谷至天山南脉，需向导|elev=3500|diff=4|time=2–3天|det|guide
scenery|托什干河谷|天山南麓河谷草原

@乌恰|county|双口岸,天山昆仑交汇|stay=县城宾馆少|best=5–10月
landmark|伊尔克什坦口岸|中国最西端口岸之一，通往吉尔吉斯斯坦|border
landmark|吐尔尕特口岸|中吉另一公路口岸，海拔 3700m|border
mountain|天山与昆仑山交汇点|两大山系在此相接，地貌反差强烈|elev=3000|diff=3|time=1天
scenery|乌恰红层地貌|红色砂岩峡谷与雅丹

@喀什|city|老城,清真寺,巴扎|stay=老城民宿与市区酒店均有，建议住老城|best=4–6月、9–10月
culture|喀什古城|国家 5A，千年生土城，高台民居与艾提尕尔广场，每日开城仪式|img=kashigar_laocheng|k|free
culture|艾提尕尔清真寺|中国最大清真寺之一，广场是城市中心|k
culture|香妃园（阿帕克霍加麻扎）|维吾尔伊斯兰陵墓建筑代表
food|喀什烤肉·缸子肉·石榴汁|老城夜市与百年茶馆，鸽子汤和药茶是特色|k
food|牛羊大巴扎（周日）|荒地乡活畜交易市场，中亚风情最浓|season=每周日
museum|喀什地区博物馆|西域史与丝路文物，免费|free
landmark|喀什零公里碑|G219、G314、G315 交汇，南疆公路枢纽

@伽师|county|新梅,巴扎|stay=县城宾馆少|best=8–9月新梅季
food|伽师新梅与甜瓜|中国新梅之乡，8–9 月上市
culture|伽师巴扎|南疆集市氛围

@岳普湖|county|达瓦孜,红枣|stay=县城宾馆少|best=9–10月
culture|达瓦孜（高空走绳）|维吾尔族高空杂技非遗，岳普湖是重要传承地|k
food|岳普湖红枣与驴肉

@英吉沙|county|小刀,土陶|stay=县城宾馆少，可回喀什|best=全年
culture|英吉沙小刀|维吾尔四大名刀之一，手工锻造作坊可参观
culture|英吉沙土陶与色提力杏|传统土陶技艺，杏干 6 月上市
food|色提力杏与杏脯

@莎车|county|十二木卡姆,叶尔羌|stay=县城酒店较多|best=4–10月
culture|莎车木卡姆广场与阿曼尼莎汗纪念陵|十二木卡姆整理者纪念地，联合国非遗项目|k
culture|叶尔羌汗国王陵|清代以前南疆政权中心
food|莎车烤鱼与巴旦木|叶尔羌河烤鱼，巴旦木是特产
museum|莎车博物馆|叶尔羌汗国史，免费|free

@泽普|county|胡杨,金湖杨|stay=县城宾馆少|best=10月中下旬
scenery|金湖杨国家森林公园|叶尔羌河畔胡杨，秋季金黄倒映水面|img=huyanglin|k|season=10月中下旬
food|泽普苹果与核桃

@叶城|city|新藏线起点,昆仑|stay=市区酒店多，是进藏前最后的大补给点|best=5–10月（冬季封山）|fuel=必须加满，进藏前最后一次充足补给
landmark|新藏线零公里碑|G219 新藏段起点，所有进藏自驾的打卡地标|img=yecheng_linggongli|k
mountain|库地达坂（阿卡孜达坂）|海拔 3150m，新藏线第一个达坂，弯多坡陡|elev=3150|diff=3|time=通过|img=kudi|k
mountain|麻扎达坂|海拔 4969m，新藏线最险的连续盘山，冬季常封|img=maza|elev=4969|diff=4|time=通过|k
culture|宗朗灵泉与锡提雅迷城|昆仑山北麓泉水与民俗村
food|叶城石榴与烤肉|昆仑山北麓石榴产区

@三十里营房|town|无人区,补给点|stay=兵站附近有限住宿，多数车辆当日通过|best=6–9月|fuel=必须提前加满，下一补给点数百公里
scenery|赛图拉古城遗址|清代边防哨所旧址，新藏线上的历史关口
food|服务区简餐|补给极少，建议自备三天干粮与饮水

@大红柳滩|town|无人区,高海拔|stay=简易板房旅馆，条件极差|best=6–9月|fuel=有私人加油点，价格高
scenery|阿克赛钦荒原|海拔 5000m 级高原荒漠，人烟稀少
mountain|大红柳滩至界山达坂|连续高海拔爬坡，注意高反与大风|elev=5200|diff=4|time=通过

@界山达坂|pass|新藏分界,5347m|stay=无住宿，须当日通过|best=6–9月，全年可能风雪|fuel=无
landmark|界山达坂 5347m 界碑|新藏两区分界与新藏线最高点，G219 全线制高点|img=jieshan|k|border
mountain|界山达坂垭口|海拔 5347m，可短停拍照，勿剧烈活动防高反|elev=5347|diff=3|time=15分钟|k

@日土|county|班公错,岩画|stay=县城宾馆少|best=5–10月
scenery|班公错|中印跨境湖，中国侧为淡水、印度侧为咸水，湖心岛有候鸟|img=bangongcuo|k|border
culture|日土岩画|青铜时代岩画群，全国重点文保
mountain|班公错环湖|湖边有短程步道与观鸟点|elev=4240|diff=1|time=半天

@噶尔·狮泉河|city|阿里中心,补给枢纽|stay=市区酒店较多，是阿里唯一成熟补给点|best=5–10月|fuel=充足
landmark|狮泉河镇|阿里地区行署驻地，海拔 4300m，进藏西线核心枢纽
culture|阿里噶本与森格藏布|象泉河上游，古格文明腹地入口
food|狮泉河镇川菜与藏餐|补给相对齐全，蔬菜价格高
museum|阿里地区博物馆|象雄与古格文明专题，免费|free

@札达|county|古格,土林|stay=县城宾馆少，托林镇可住|best=5–10月|fuel=需在狮泉河加满
culture|古格王朝遗址|10 世纪至 17 世纪古格王国都城，山崖上的宫殿与佛寺残迹|img=guge|k|season=全年，日落最佳|ticket=100 元
scenery|札达土林|200 万年前湖相沉积被切割出的土林群，绵延数百里|img=guge|k
culture|托林寺|古格王朝皇家寺院，藏传佛教后弘期重要道场
mountain|土林徒步穿越|土林间有牧道可徒步半日，注意补水防晒|elev=3800|diff=2|time=半天

@普兰|county|神山圣湖,三国交界|stay=县城与巴嘎乡有宾馆|best=5–10月|fuel=需自备，站点少
mountain|冈仁波齐|海拔 6638m，藏传佛教、印度教共同神山，转山 52km 需 2–3 天|img=gangrenboqi|elev=6638|diff=4|time=转山2–3天|k|ticket=150 元
scenery|玛旁雍错|海拔 4588m 圣湖，与拉昂错（鬼湖）相邻，环湖 90km|img=mapangyongcuo|k
mountain|纳木那尼峰|海拔 7694m，与冈仁波齐对峙，登山需许可|elev=7694|diff=5|time=多日|det|guide
culture|普兰飞天服饰与科迦寺|普兰妇女传统服饰为国家级非遗
landmark|普兰口岸（强拉）|中尼印交界季节性通道|border

@仲巴|county|雅江源,荒漠|stay=县城宾馆极少|best=6–9月|fuel=需提前加满
scenery|雅鲁藏布江源头区域|马泉河在仲巴境内展开为宽阔河谷
scenery|仲巴沙丘|高海拔流动沙丘，雅江沿岸荒漠化典型断面

@萨嘎|county|喜马拉雅北,补给点|stay=县城宾馆少，海拔 4500m 注意高反|best=5–10月|fuel=有站但常排队
scenery|拉则错与佩枯错|希夏邦马峰北麓的蓝色湖泊，佩枯错可观 8027m 主峰|img=peikucuo|k
mountain|希夏邦马峰远眺|世界第 14 高峰 8027m，唯一完全在中国境内的 8000m 级雪峰|elev=8027|diff=5|time=观景|k
food|萨嘎牦牛肉与酥油茶|补给有限，价格高

@吉隆|county|吉隆沟,口岸|stay=县城宾馆少，吉隆沟内条件较好|best=5–10月
scenery|吉隆沟|喜马拉雅南坡湿谷，从荒漠骤变为森林瀑布，落差极大|img=jilong|k
mountain|乃村徒步|海拔 3900m 的高山草甸村，可徒步至雪山观景台|elev=3900|diff=2|time=半天|k
landmark|吉隆口岸（热索瓦）|中尼公路口岸，通往加德满都|border
culture|曲德寺与卓玛拉康|吐蕃时期佛寺遗存

@定日|county|珠峰门户|stay=县城与扎西宗乡有宾馆，海拔 4300m|best=4–5月、9–10月（观峰最清）|fuel=有站
mountain|珠穆朗玛峰大本营|海拔 5200m，世界最高峰 8848.86m 正面，需换乘景区车|img=everest|elev=5200|diff=3|time=1–2天|k|ticket=180 元+车
mountain|加乌拉山口|海拔 5210m，可同时望见 5 座 8000m 级雪峰|img=everest|elev=5210|diff=2|time=2小时|k
mountain|卓奥友峰与格重康峰|卓奥友 8201m 是世界第六高峰，登山需许可|elev=8201|diff=5|time=多日|det|guide
culture|绒布寺|世界海拔最高寺庙，珠峰脚下
food|定日牦牛肉干与青稞酒

@定结|county|湿地,陈塘沟|stay=县城宾馆极少|best=5–10月
scenery|定结湿地|喜马拉雅北麓的高原沼泽，黑颈鹤繁殖地
scenery|陈塘沟（绕行）|夏尔巴人聚居沟谷，需边防证与徒步|det|border

@岗巴|county|喜马拉雅,雪山观景|stay=县城宾馆极少|best=5–10月
scenery|岗巴县雪山观景带|可同时看到干城章嘉等数座 8000m 级雪峰，是 G219 最震撼的一段公路|img=gangba_xueshan|k
culture|岗巴羊|国家地理标志，海拔 4500m 以上放养
mountain|曲登尼玛冰川|海拔 5000m 级大陆性冰川，可徒步接近|elev=5000|diff=4|time=1天|det|guide

@康马|county|寺庙,冲巴雍错|stay=县城宾馆少|best=5–10月
culture|乃宁曲德寺|1040 年建寺，1904 年江孜抗英战场之一
scenery|冲巴雍错|喜马拉雅北麓小湖，可远观雪山
landmark|通往亚东沟的岔口|南接亚东与中印边境，需边防证|border

@洛扎|county|卡久寺,色乡|stay=县城宾馆少，色乡有旅馆|best=5–10月|border
culture|卡久寺|悬崖上的宁玛派寺庙，云雾中若隐若现|k
scenery|色乡温泉与拉普温泉|喜马拉雅南坡地热温泉
mountain|库拉岗日徒步|海拔 7538m 主峰群，洛扎沟徒步 3–5 天|elev=5000|diff=4|time=3–5天|det|guide

@措美|county|哲古草原,藏獒|stay=县城宾馆少|best=6–9月
scenery|哲古错与哲古草原|海拔 4170m 的高原湖与牧场，夏季野花
culture|措美藏獒养殖区|喜马拉雅藏獒原产地之一

@隆子|county|玉麦,列麦精神|stay=县城宾馆少|best=5–10月|border
scenery|玉麦乡|曾经的三人乡，喜马拉雅南麓湿谷，需边防证|k
culture|列麦精神纪念馆|高原垦荒历史展陈，免费|free
mountain|隆子河谷徒步|雅江支流河谷，可半日徒步|elev=3900|diff=2|time=半天

@加查|county|拉姆拉错,雅江|stay=县城宾馆少|best=5–10月
scenery|拉姆拉错|海拔 5000m 的神湖，观湖需爬陡坡约 1 小时|elev=5000|diff=3|time=1天|det|k
culture|列山古墓群|吐蕃时期大型墓群，全国重点文保
food|加查核桃与藏式木碗|核桃油与手工木碗是特产

@朗县|county|藏王陵,核桃林|stay=县城宾馆少|best=5–10月
culture|列山古墓群（朗县段）|雅江沿岸绵延数公里的吐蕃墓群
scenery|雅鲁藏布江中游河谷|江畔核桃林秋季金黄

@米林|city|南迦巴瓦,雅江大峡谷|stay=县城与派镇酒店较多|best=4–5月桃花、10–11月观南迦巴瓦
mountain|南迦巴瓦峰|海拔 7782m，中国最美山峰，直白村与索松村是最佳观景点|img=nanjiabawa|elev=7782|diff=5|time=观景|k
scenery|雅鲁藏布大峡谷|世界最深最长峡谷，入口在派镇，江水从雪山直落雨林|img=yaluzangbu|k|season=全年，秋季最清
mountain|加拉村徒步|索松村至加拉村沿江徒步，春季桃花隧道|elev=3000|diff=2|time=半天|k|season=3月下旬–4月中
culture|工布藏寨与响箭|工布地区独有的响箭（毕秀）为非遗
food|米林藏香猪与松茸|7–9 月松茸季，藏香猪石锅炖

@墨脱|county|莲花秘境,果果塘|stay=县城酒店有限，雨季常断路|best=10–12月与3–4月（避开雨季塌方）|border
scenery|果果塘大拐弯|雅鲁藏布江在墨脱绕出马蹄形大弯，观景台在德兴村|img=guoguotang|k
mountain|嘎隆拉雪山隧道与老路|海拔 4200m 老路可徒步，新隧道已通车|elev=4200|diff=3|time=半天|det
scenery|雅鲁藏布江下游雨林|从雪山到热带的垂直落差 7000m，中国唯一
culture|门巴族与珞巴族村寨|中国人口较少民族，竹编与石锅为特色
food|墨脱石锅鸡与野生菌|皂石锅炖藏鸡，配手掌参
mountain|多雄拉山口徒步|传统背夫道，派镇至墨脱的经典徒步线，需向导|elev=4200|diff=5|time=3–4天|det|guide

@察隅|county|来古冰川,察瓦龙|stay=县城宾馆较多|best=10–5月（雨季 6–9 月塌方多）|border
scenery|来古冰川群|中国面积最大的冰川群，冬季蓝冰最震撼|img=laigu_bingchuan|k|season=11–3月蓝冰
mountain|来古村至冰川末端徒步|海拔 4000m，可徒步或骑马接近冰舌|elev=4100|diff=2|time=半天|k
scenery|察隅河谷·慈巴沟|亚热带森林峡谷，国家级自然保护区
culture|僜人村落|察隅独有的僜人（未识别民族）部落
food|察隅大米与松茸|察隅是西藏少有的水稻产区

@察瓦龙|town|丙察察,怒江峡谷|stay=乡上有简易旅馆，条件差|best=10–5月，雨季几乎断路|fuel=有私人加油点，价高
mountain|丙察察线（察隅—丙中洛）|中国最后的天险公路，翻越雄珠拉垭口 4636m，需四驱与差速锁|elev=4636|diff=5|time=2–3天|k|guide
scenery|怒江干热河谷|峡谷深切，仙人掌与稀树灌丛
culture|察瓦龙藏族村落|茶马古道上的马帮驿站

@丙中洛|town|怒江第一湾,茶马古道|stay=乡上有民宿，重丁村条件最好|best=10–4月（雨季塌方多）
scenery|怒江第一湾|江水在丙中洛绕出 Ω 形大弯，观景台免费|img=nujiang_diyiwan|k
culture|茶马古道与雾里村|怒江对岸的原始村落，需走钢索吊桥或溜索遗址|img=bingzhongluo|k
mountain|嘎娃嘎普雪山|海拔 5128m，怒江与独龙江分水岭，可徒步至雪线|elev=5128|diff=4|time=1–2天|det|guide
culture|重丁教堂|天主教与藏传佛教、原始宗教在丙中洛并存
food|丙中洛石板粑与怒江鱼

@贡山|county|独龙江,怒族|stay=县城宾馆少，独龙江需另安排|best=10–4月
scenery|独龙江峡谷（绕行）|中国最后的秘境之一，纹面女与原始森林，冬季大雪封山|det|k
culture|怒族仙女节与普化寺|贡山是怒族、独龙族聚居地
mountain|高黎贡山北段徒步|海拔 4000m 以上，穿越需向导与许可|elev=4000|diff=5|time=3–5天|det|guide
food|贡山漆油鸡与独龙牛

@福贡|county|怒江峡谷,溜索|stay=县城宾馆少|best=10–4月
scenery|石月亮|高黎贡山岩壁上的天然圆洞，远望如月|img=fugong_shiyueliang|k
culture|知子罗废城（碧江旧县城）|1974 年整城废弃，被称为记忆之城，需绕行上山|det|k
mountain|碧罗雪山徒步|怒江与澜沧江分水岭，可穿越至澜沧江侧|elev=4000|diff=5|time=2–4天|det|guide
food|福贡漆油与峡区玉米酒

@泸水·六库|city|怒江门户,片马|stay=市区酒店较多，是怒江段补给中心|best=11–4月
landmark|片马口岸与滇缅界碑|中缅边境口岸，二战滇西抗战遗址在片马|det|border|k
scenery|怒江大峡谷入口|中国最长最神秘的峡谷从此开始
culture|傈僳族上刀山下火海|阔时节（新年）期间的非遗表演
food|泸水老窝火腿与漆油鸡
museum|怒江州博物馆|傈僳、怒、独龙等民族专题，免费|free

@腾冲|city|火山,热海,和顺|stay=市区与和顺古镇酒店多，是云南段最佳休整点|best=11–4月，秋季银杏村 11 月中下旬
scenery|腾冲火山地质公园|97 座火山锥，可登大空山火山口，热气球观全景|img=tengchong|k
scenery|热海景区|大滚锅 97℃ 沸泉，可泡温泉与吃地热蒸蛋|img=tengchong|k
culture|和顺古镇|600 年侨乡，图书馆、洗衣亭与马帮文化保存完整|img=tengchong|k
culture|国殇墓园与滇西抗战纪念馆|纪念 1944 年腾冲反攻阵亡将士，展陈极为震撼|k|free
scenery|江东银杏村|11 月中下旬全村金黄，需提前订民宿|season=11月中下旬
mountain|高黎贡山南段徒步|百花岭至林家铺观鸟道，冬季观鸟圣地|elev=2500|diff=3|time=1天|k|guide
food|腾冲大救驾与土锅子|饵块炒制的大救驾，铜瓢牛肉
museum|滇西抗战纪念馆|中国抗战正面战场滇西段专题，免费|free

@龙陵|county|松山,惠通桥|stay=县城宾馆少|best=11–4月
culture|松山战役遗址|1944 年滇西抗战最惨烈战场，保留战壕与弹坑原貌|img=songshan|k|free
landmark|惠通桥|滇缅公路上的钢索吊桥，抗战生命线节点
scenery|邦腊掌温泉|龙川江畔地热温泉
food|龙陵黄龙玉与石斛炖鸡

@永德|county|大雪山,茶|stay=县城宾馆少|best=11–4月
mountain|永德大雪山|海拔 3504m 国家级自然保护区，可徒步至杜鹃林|elev=3504|diff=3|time=1天|det|k
culture|永德土司文化|勐板土司与滇西南土司制度遗存
food|永德茶叶与芒果

@镇康|county|边境,勐堆|stay=县城宾馆少|best=11–4月|border
landmark|南伞口岸|中缅口岸，对岸即果敢|border
culture|镇康傣族泼水节与德昂族|多民族混居的边境县
food|镇康酸茶与傣味

@沧源|county|佤族,翁丁|stay=县城宾馆少，翁丁有民宿|best=11–4月，5月摸你黑狂欢节
culture|翁丁佤族原始部落|中国保存最完整的佤族干栏式村落，2021 年火灾后部分重建|img=wengding|k
culture|司岗里传说与摸你黑狂欢节|佤族创世史诗，5 月摸你黑节全城互抹黑泥|k
scenery|沧源崖画|3000 年前佤族先民崖画，全国重点文保
mountain|班洪抗英遗址与阿佤山|阿佤山徒步需向导|elev=2000|diff=3|time=1天|det
food|沧源鸡肉烂饭与佤族水酒|佤族招牌菜，配自酿米酒

@西盟|county|木鼓,佤山|stay=县城宾馆少|best=11–4月
culture|木鼓文化与拉木鼓仪式|佤族木鼓为国家级非遗，龙潭湖畔有木鼓节
scenery|勐梭龙潭|县城旁的原始湖泊与森林，环湖栈道 3km
culture|勐卡镇佤族村寨|阿佤人民唱新歌的诞生地
food|西盟佤味烧烤与苦茶

@孟连|county|娜允古镇,傣族|stay=县城宾馆少|best=11–4月
culture|娜允古镇|中国最后一个傣族古镇，宣抚司署保存完整|img=nayun|k
culture|孟连宣抚司署|清代傣族土司衙署，全国重点文保
scenery|勐马瀑布与勐阿|边境傣族村落与瀑布
food|孟连牛油果与傣味|中国最大牛油果产区之一

@澜沧|county|景迈山,拉祜|stay=县城宾馆少，景迈山有民宿|best=11–4月，4月拉祜扩塔节
scenery|景迈山古茶林|世界文化遗产，千年万亩古茶林与布朗族村寨|img=jingmai|k|season=3–4月采茶季
culture|老达保拉祜族村|《快乐拉祜》多声部合唱的村落，可听现场
mountain|景迈山徒步|茶林间步道与云海观景台，半日可走|elev=1800|diff=1|time=半天
food|澜沧普洱茶与拉祜烤茶|景迈、邦崴古茶山核心产区
museum|澜沧民族博物馆|拉祜、布朗、佤族专题，免费|free

@勐海|county|普洱茶都,雨林|stay=县城酒店较多|best=11–4月
culture|勐景来中缅第一寨|打洛江畔傣族村寨，界河对岸即缅甸|border
scenery|打洛独树成林|一棵大青树撑起一片林
food|勐海茶与大益普洱|中国普洱茶第一县，可访茶厂
culture|布朗族章加古寨|布朗族文化与古茶园

@景洪|city|傣族,雨林,告庄|stay=市区酒店充足，是西双版纳补给中心|best=11–4月，4月泼水节
scenery|西双版纳热带雨林|中国唯一热带雨林，中科院植物园与原始森林公园
culture|告庄西双景·星光夜市|东南亚风情节庆街区，夜市规模全国前列|k
culture|总佛寺与曼听公园|傣王御花园与南传佛教中心
mountain|基诺山徒步|基诺族聚居山地，雨林徒步半日至一日|elev=1500|diff=2|time=1天
food|傣味烧烤·菠萝饭·舂鸡脚|版纳夜市美食最全的一站|k
museum|西双版纳民族博物馆|傣族与基诺族专题，免费|free

@勐腊|county|望天树,磨憨|stay=县城宾馆少，磨憨有酒店|best=11–4月
scenery|望天树景区|中国最高的热带雨林树冠走廊，36m 高空吊桥|img=wangtianshu|k|ticket=70 元+走廊
landmark|磨憨口岸|中老铁路与公路口岸，通往老挝磨丁|border
scenery|勐远仙境溶洞|热带雨林与喀斯特溶洞结合的沟谷
food|勐腊小耳猪与傣味

@江城|county|一眼望三国,哈尼|stay=县城宾馆少|best=11–4月
landmark|勐康口岸·一眼望三国|中老越三国交界十层大山，界碑可打卡|img=yiwangwangsanguo219|k|border
culture|哈尼族与彝族村寨|江城是哈尼彝族自治县之一
food|江城黄牛与哈尼长街宴
mountain|十层大山徒步|三国界山，可徒步至界碑|elev=1864|diff=3|time=1天|guide

@绿春|county|哈尼,长街宴|stay=县城宾馆少|best=11–4月，12月–1月长街宴
culture|哈尼族长街宴（昂玛突节）|十月年期间数百米长街摆宴，需提前联系|k|season=11–12月
scenery|阿倮欧滨与黄连山|黄连山国家级保护区，滇南绿孔雀栖息地
food|绿春哈尼红米与梯田鱼

@元阳|county|哈尼梯田,世遗|stay=多依树、胜村有民宿，看日出必须住山上|best=11–4月（灌水期镜面最佳），3–4月绿意
scenery|多依树梯田|世界文化遗产核心区，日出云海与灌水梯田镜面|img=yuanyang|k|season=11–4月
scenery|老虎嘴与坝达梯田|日落最佳观景点，坝达万亩连片|img=yuanyang|k
culture|哈尼蘑菇房村寨（阿者科）|传统蘑菇房村落，可入户体验
food|元阳红米与梯田鸭蛋|哈尼红米是地理标志
mountain|哀牢山徒步|梯田之上的原始森林，可半日徒步|elev=2500|diff=2|time=半天

@金平|county|蝴蝶谷,苗瑶|stay=县城宾馆少|best=5–6月蝴蝶季
scenery|蝴蝶谷（马鞍底）|每年 5–6 月上亿只箭环蝶聚集，世界罕见|img=jinping_hudiegu|k|season=5–6月
culture|苗族花山节与瑶族村寨|金平是苗族瑶族傣族自治县
mountain|西隆山|海拔 3074m，滇南最高峰，可徒步登顶|elev=3074|diff=4|time=1天|det
food|金平香蕉与苗家腊肉

@屏边|county|大围山,滇越铁路|stay=县城宾馆少|best=11–4月
mountain|大围山国家森林公园|海拔 2365m，热带山地雨林，有多条徒步环线|img=daweishan|elev=2365|diff=3|time=1天|k
culture|滇越铁路人字桥|1908 年建成的钢桁三铰拱桥，工程奇迹，全国重点文保|img=renzhiqiao|k
scenery|滴水瀑布与火山地质|县城旁瀑布群
food|屏边荔枝与苗家菜

@河口|county|滇越口岸,热带|stay=县城宾馆多|best=11–4月|det
landmark|河口口岸与滇越铁路大桥|中越铁路口岸，南溪河与红河在此交汇|border|k
scenery|红河与南溪河交汇|两色江水并流
food|河口越南小卷粉与咖啡|边境越南风味最集中

@马关|county|边境,草果|stay=县城宾馆少|best=11–4月|border
culture|马关侬族与都龙口岸|中越边境集市，都龙口岸通行|border
food|马关草果与侬家菜

@西畴|county|石漠化治理,精神|stay=县城宾馆少|best=11–4月
culture|西畴精神展览馆|石漠化荒山变绿洲的当代典型，免费|free
scenery|香坪山与三光石漠化治理区|石漠化治理示范现场
food|西畴阳宗海? 乌骨鸡与核桃

@麻栗坡|county|老山,口岸|stay=县城宾馆多|best=11–4月|border
culture|老山主峰与老山作战纪念馆|1984 年老山战役旧址，主峰可上，需登记|k|border
landmark|天保口岸|中越公路口岸，通往越南清水河|border
mountain|老山主峰|海拔 1422m，登顶可看中越边境山脊|elev=1422|diff=2|time=半天|k
food|麻栗坡草果与越南小吃

@靖西|county|通灵峡谷,喀斯特|stay=市区酒店多，是广西段补给中心|best=11–4月
scenery|通灵大峡谷|单级落差 188m 的地下河瀑布，峡谷深 300m|img=tongling|k|ticket=118 元
scenery|鹅泉|中国西南三大名泉之一，泉水碧绿，可竹筏|img=jingxi_equan|k
mountain|旧州古镇与三牙山|喀斯特峰林间的绣球之乡|elev=900|diff=2|time=半天
culture|旧州古镇|壮族绣球制作之乡，古建筑群保存完好
food|靖西大果山楂与五色糯米饭
museum|靖西壮族博物馆|壮族服饰与绣球专题，免费|free

@大新|county|德天瀑布,明仕|stay=硕龙镇与明仕有度假酒店|best=6–11月（丰水期瀑布最大）
scenery|德天跨国大瀑布|亚洲第一跨国瀑布，中越界河归春河上，可竹筏近观|img=detian_pubu|k|season=6–11月|ticket=80 元
scenery|明仕田园|喀斯特峰林与稻田河流，《花千骨》取景地，可竹筏漂流|img=mingshi_tianyuan|k
mountain|恩城自然保护区徒步|喀斯特峰丛间徒步半日，观白头叶猴|elev=600|diff=2|time=半天|det
food|大新酸鱼与沙糕|壮族酸鱼腌制传统

@宁明|county|花山岩画,世遗|stay=县城宾馆多|best=11–4月
culture|花山岩画|世界文化遗产，战国至汉代骆越人崖壁画，需乘船沿明江观看|img=huashan_yanhua|k|season=全年
scenery|明江喀斯特画廊|乘船 2 小时看两岸峰林与岩画
food|宁明沙糕与酸嘢
museum|宁明花山岩画博物馆|岩画专题解说，免费|free

@凭祥|city|友谊关,口岸|stay=市区酒店多|best=11–4月|border
landmark|友谊关|中国九大名关之一，中越边境唯一仍在通行的古关|img=youyiguan|k|border
landmark|凭祥综合保税区与浦寨口岸|中越最大陆路口岸，边贸市场
culture|大连城与法式领事馆旧址|中越边境近代史迹
food|凭祥越南春卷与咖啡|边境越南美食集散

@上思|county|十万大山|stay=县城宾馆少|best=11–4月
mountain|十万大山国家森林公园|海拔 1462m，南亚热带雨林，有多条徒步栈道|elev=1462|diff=2|time=1天|k
scenery|石头河与布透温泉|雨林溪谷与地热温泉
food|上思香糯与红椎菌

@东兴|city|口岸,京族,终点|stay=市区酒店多，江平镇京族渔家可住|best=11–4月
landmark|东兴口岸与中越友谊大桥|G219 终点、G228 终点，北仑河对岸即越南芒街|img=dongxingkouan|k|border
culture|京族三岛·万尾金滩|中国唯一海洋民族京族聚居地，独弦琴与哈节为非遗|img=beihaiyintan|k
scenery|北仑河口国家级自然保护区|红树林与界河入海口
food|东兴风吹饼与京族鱼露|越南风味与京族海鲜
museum|京族博物馆|中国唯一京族专题馆，免费|free
"""
