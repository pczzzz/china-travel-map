# -*- coding: utf-8 -*-
"""薄弱省份内容补齐：向 tools/content/<pid>.py 批量追加景点/美食/环线/城市/航点。
幂等：已存在的 spot id / 美食名 / 环线名不会重复插入。运行一次即可。"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, "content")

# ---------- 新增景点（WGS 坐标，builder 转 GCJ） ----------
SPOTS_ADD = {
"shanxi": [
"yxmt|应县木塔|landmark|xinzhou|39.554|113.187|世界现存最高最古木塔：辽代千年榫卯结构，斜阳下麻燕绕飞是独有画面。|img=sxi_yxmt|ticket=50 元（外观）|season=全年|level=国宝|key",
"shuanglin|平遥双林寺|culture|jinzhong|37.189|112.086|「东方彩塑艺术馆」：两千余尊明代彩塑，韦驮像被公认天下第一。|img=sxi_shuanglin|ticket=35 元|season=全年|level=世界遗产|key",
"zhenguo|平遥镇国寺|culture|jinzhong|37.278|112.104|万佛殿五代原构：千年斗拱如莲盛开，殿内彩塑是全国寺观唯一五代彩塑。|img=sxi_zhenguo|ticket=25 元|season=全年|level=世界遗产",
"ningwu|宁武关|landmark|xinzhou|39.001|112.305|明长城内三关之一：鼓楼层上望管涔山，古关城与市井烟火同框。|img=sxi_ningwu|ticket=免费|season=4–10 月",
"mengshan|蒙山大佛|scenery|taiyuan|37.769|112.436|比乐山大佛早 162 年的北齐摩崖大佛：并州西山步道尽处佛首低垂。|img=sxi_mengshan|ticket=40 元|season=4–10 月",
"chongfu|朔州崇福寺|culture|xinzhou|39.332|112.432|弥陀殿金代五绝：建筑、塑像、壁画、琉璃、匾额俱是金代原物，游客极少。|img=sxi_chongfu|ticket=25 元|season=全年",
"hongshi|太行山大峡谷·八泉峡|scenery|changzhi|36.210|113.212|太行最雄一段：高峡平湖乘船进谷，崖壁千仞一线天。|img=sxi_hongshi|ticket=120 元|season=5–10 月|key",
"guangwu|广武古城|culture|xinzhou|39.366|112.723|明代边贸军堡活化石：新旧广武双城对望，城墙上的月亮门是摄影名机位。|img=sxi_guangwu|ticket=免费|season=4–10 月",
"yuhuang|晋城玉皇庙|culture|jincheng|35.526|112.898|二十八星宿彩塑海内孤品：元代塑像人神合一，游戏取景地爆红后仍值得细看。|img=sxi_yuhuang|ticket=20 元|season=全年|key",
"zemi|浊漳河谷·天台庵|culture|changzhi|36.231|113.516|浊漳河谷唐五代木构长廊：天台庵、大云院、龙门寺一线串珠，中国古建朝圣路。|img=sxi_zemi|ticket=各 10–20 元|season=4–10 月|key",
],
"fujian": [
"meizhou|湄洲岛·妈祖祖庙|culture|quanzhou|25.096|118.973|天下妈祖庙之祖：环岛骑行看日月潭双湾，祖庙建筑群依山面海气势如宫殿。|img=fj_meizhou|ticket=上岛船票+门票约 125 元|season=全年，农历三月廿三庙会|level=5A|key",
"guanzhi|连城冠豸山|mountain|longyan|25.710|116.760|「客家神山」丹霞孤峰：生命之根与石门湖游船，山下培田古民居顺访。|img=fj_guanzhi|ticket=115 元|season=全年|level=5A",
"yuhua|将乐玉华洞|scenery|sanming|26.714|117.492|福建最大石灰岩溶洞：徐霞客两度到访，洞中苍龙出海石幔如瀑。|img=fj_yuhua|ticket=105 元|season=全年",
"sqx|泰宁上清溪|scenery|sanming|26.895|117.045|竹筏漂过丹霞峡谷：七里幽谷两岸赤壁，与大金湖组成泰宁山水双绝。|img=fj_sqx|ticket=95 元|season=4–11 月",
"volc|漳浦滨海火山岛|scenery|zhangzhou|24.131|117.945|140 万根玄武岩柱状节理直插大海：地质奇观+彩虹栈道，闽南小众海岸。|img=fj_volc|ticket=60 元|season=全年",
"hpzhen|邵武和平古镇|culture|nanping|27.160|117.340|闽北保存最完整的城堡式古镇：青石板街+大夫第群，和平豆腐与游浆豆腐宴必尝。|img=fj_hpzhen|ticket=60 元|season=全年",
"qjs|泉州清净寺|culture|quanzhou|24.912|118.590|中国现存最古老伊斯兰教寺之一：北宋石柱门楼矗立涂门街，见证刺桐港万国商来。|img=fj_qjs|ticket=3 元|season=全年|key",
"luoxing|马尾罗星塔·船政文化|landmark|fuzhou|25.988|119.452|「中国塔」曾是国际航标：塔下船政博物馆讲述近代海军与造船业起点。|img=fj_luoxing|ticket=免费|season=全年",
"jiuli|仙游九鲤湖|scenery|quanzhou|25.344|118.665|九漈飞瀑+祈梦文化：徐霞客盛赞的瀑布群，湖光与摩崖石刻相映。|img=fj_jiuli|ticket=65 元|season=4–11 月",
"tianyou|武夷山天游峰|mountain|nanping|27.713|117.953|武夷第一胜地：848 级石阶登顶，脚下九曲溪竹筏如叶，云海日出双绝。|img=fj_tianyou|ticket=含武夷山主景区门票|season=全年|level=5A|key",
],
"hunan": [
"shaoshan|韶山·毛泽东故居|culture|changsha|27.915|112.505|红色湖南第一站：故居、铜像广场与滴水洞，湘潭韶山冲里读近代史。|img=hn_shaoshan|ticket=故居免费需预约|season=全年|key",
"tianxin|天心阁|landmark|changsha|28.186|112.976|长沙古城墙仅存标志：阁上望湘江与城郭，夜场灯光秀与城墙投影出圈。|img=hn_tianxin|ticket=32 元|season=全年",
"ziquejie|紫鹊界梯田|scenery|shaoyang|27.717|111.312|新化 8 万亩秦人梯田：纯靠山泉自流灌溉，晨雾灌满梯田时如万面碎镜。|img=hn_ziquejie|ticket=60 元|season=5–6 月灌水 / 9–10 月金秋|key",
"wugang|武冈古城|culture|shaoyang|26.726|110.632|湘西南古城：明代王城城墙+云山古称胜境，武冈卤菜香飘全国的老家。|img=hn_wugang|ticket=古城免费|season=全年",
"jiuyi|九嶷山·舜帝陵|scenery|chenzhou|25.580|111.940|「九嶷山上白云飞」：舜帝陵祭典与紫霞岩石刻，永州宁远的帝子传说之地。|img=hn_jiuyi|ticket=舜帝陵 60 元|season=全年",
"shunhuang|崀山|mountain|shaoyang|26.360|110.790|世界自然遗产丹霞：辣椒峰、八角寨云海与天一巷，湘西南最险秀的山。|img=hn_shunhuang|ticket=136 元联票|season=全年|level=世界遗产|key",
"yanling|炎帝陵|culture|chenzhou|26.490|113.770|神州第一陵：株洲炎陵祭祖圣地，陵区藏于罗霄山麓古木之间。|img=hn_yanling|ticket=80 元|season=全年",
"dawei|浏阳大围山|mountain|changsha|28.450|114.080|长沙后花园：杜鹃花海、高山草甸与峡谷漂流，山顶看浏阳城灯火。|img=hn_dawei|ticket=78 元|season=4–5 月杜鹃 / 夏季避暑",
"xuefeng|雪峰山国家森林公园|mountain|huaihua|27.030|110.550|抗战名城背后的雪线：云雾梯田、枫香瑶寨与高山台地，秋染层林如油画。|img=hn_xuefeng|ticket=约 60 元|season=5–11 月",
"chengtoushan|城头山古城遗址|culture|changde|29.680|111.650|中国最早的城市：6000 年前古城垣与水稻田遗址，澧阳平原文明之根。|img=hn_chengtoushan|ticket=免费|season=全年",
"biancheng|边城茶峒古镇|culture|xiangxi|28.447|109.520|沈从文笔下《边城》原型：鸡鸣闻三省的花垣边城，清水江上仍摆渡过重庆。|img=hn_biancheng|ticket=免费，渡船另收|season=全年|key",
],
"xinjiang": [
"duku|独库公路·乔尔玛段|scenery|ili|43.830|84.390|中国最美公路纵穿天山：一日历四季，乔尔玛纪念碑处雪山峡谷同框。|img=xj_duku|ticket=免费|season=6–10 月通车|level=网红公路|key",
"qkst|琼库什台村|culture|ili|42.970|82.150|天山深处的原木哈萨克村落：国家历史文化名村，后山草原是徒步乌孙古道起点。|img=xj_qkst|ticket=免费|season=6–9 月|key",
"xiata|夏塔古道|scenery|ili|42.940|80.880|玄奘走过的天山隘口：木扎尔特河谷尽头仰望汗腾格里雪峰，温泉与冰川同路。|img=xj_xiata|ticket=40 元+区间车|season=6–9 月",
"bhaba|白哈巴村|culture|altay|48.810|86.860|西北第一村：图瓦木屋与界河铁桥，秋色不输喀纳斯且安静得多。|img=xj_bhaba|ticket=50 元+边防证|season=6–10 月|key",
"jblk|江布拉克|scenery|changji|43.730|89.720|天山北坡麦浪与雪山：万亩旱田随山起伏，怪坡与黑涝坝藏在花海尽头。|img=xj_jblk|ticket=55 元|season=6–9 月|level=4A",
"sanwan|喀纳斯三湾|scenery|altay|48.720|87.020|神仙湾晨雾、月亮湾碧水、卧龙湾秋桦：喀纳斯河最上镜的一段栈道。|img=xj_sanwan|ticket=含喀纳斯门票|season=6–10 月|key",
"tashk|塔什库尔干石头城·金草滩|culture|kashgar|37.776|75.228|丝路葱岭古国遗址：残垣立在帕米尔高原，脚下金草滩湿地映慕士塔格。|img=xj_tashk|ticket=65 元联票|season=5–10 月|key",
"lxj|伊宁六星街|culture|ili|43.917|81.337|手风琴与冰淇淋的彩色街区：俄式民居放射状街巷，塞外江南的松弛感。|img=xj_lxj|ticket=免费|season=全年",
],
"guangdong": [
"fszm|佛山祖庙|culture|foshan|23.029|113.113|岭南建筑艺术之宫：黄飞鸿叶问堂+每日醒狮表演，三雕两塑满屋生辉。|img=gd_fszm|ticket=20 元|season=全年|key",
"xqshan|西樵山|mountain|foshan|22.886|112.966|珠江文明灯塔：61.9 米南海观音俯瞰桑基鱼塘，宝峰寺与天湖藏于火山古径。|img=gd_xqshan|ticket=70 元|season=全年|level=5A",
"qhy|顺德清晖园|culture|foshan|22.838|113.253|岭南四大名园：水木清华的小院套小院，逛完直接杀入大良美食街。|img=gd_qhy|ticket=15 元|season=全年",
"lhshan|深圳莲花山|scenery|shenzhen|22.560|114.062|市民中心后花园：山顶广场瞻仰邓小平铜像，俯瞰福田 CBD 中轴线。|img=gd_lhshan|ticket=免费|season=全年",
"wcgd|深圳世界之窗|culture|shenzhen|22.536|113.979|微缩地标主题公园鼻祖：埃菲尔铁塔与金字塔同园，夜场灯光烟花怀旧又出片。|img=gd_wcgd|ticket=220 元|season=全年",
"wld|珠海万山·外伶仃岛|scenery|zhuhai|21.988|113.624|伶仃洋上的石景山房：文天祥「零丁洋里叹零丁」处，海钓与石景公园看落日。|img=gd_wld|ticket=船票约 120 元往返|season=4–11 月",
"hzxh|惠州西湖|scenery|huizhou|23.098|114.404|「苏东坡寓惠」的城中湖：六桥烟柳不输杭州，泗洲塔下看平湖夜月。|img=gd_hzxh|ticket=免费|season=全年|level=5A",
"czpf|潮州牌坊街|culture|chaozhou|23.669|116.631|22 座明清牌坊连成千米长街：骑楼老字号里吃腐乳饼、看广济桥灯光秀。|img=gd_czpf|ticket=免费|season=全年|key",
"scd|江门上川岛|scenery|jiangmen|21.747|112.778|南海碧波中的大岛：飞沙滩冲浪、风车公路环岛，海鲜大排档开到深夜。|img=gd_scd|ticket=船票+门票约 160 元|season=4–11 月",
"nlgs|韶关南岭国家森林公园|mountain|shaoguan|24.910|113.020|广东屋脊石坑崆：原始森林瀑布群与小黄山云海，秋冬红叶是粤北限定。|img=gd_nlgs|ticket=80 元|season=全年，10–12 月红叶",
"shj|广州石室圣心大教堂|culture|guangzhou|23.124|113.266|全球四座全石构哥特教堂之一：双尖塔与彩色玻璃窗，一德路市井中的庄严。|img=gd_shj|ticket=免费|season=全年|key",
"yxgy|广州越秀公园·五羊像|scenery|guangzhou|23.139|113.266|羊城名片：五羊石像+镇海楼（广州博物馆）+明代古城墙，一次读懂广州。|img=gd_yxgy|ticket=免费，镇海楼 10 元|season=全年",
],
"guangxi": [
"ludi|桂林芦笛岩|scenery|guilin|25.283|110.264|「大自然的艺术之宫」：石狮乳石千姿百态，86 版《西游记》东海龙宫取景地。|img=gx_ludi|ticket=110 元|season=全年|level=5A",
"jjwf|靖江王府·独秀峰|culture|guilin|25.278|110.291|明代藩王府邸：「桂林山水甲天下」摩崖石刻原址，独秀峰顶俯瞰全城。|img=gx_jjwf|ticket=100 元|season=全年|key",
"yls|阳朔月亮山·十里画廊|scenery|guilin|24.748|110.513|骑行经典线：月亮石拱、大榕树与聚龙潭串成十里画廊，夜遇《印象·刘三姐》。|img=gx_yls|ticket=免费（各景点另收）|season=全年",
"lssj|印象·刘三姐|culture|guilin|24.788|110.507|张艺谋山水实景演出开山作：漓江为幕群山为景，红衣渔火场面震撼。|img=gx_lssj|ticket=238 元起|season=全年|key",
"yzzj|宜州·刘三姐故里|culture|hechi|24.489|108.658|下枧河上对山歌：壮族歌仙传说发源地，会仙山与白龙洞顺游。|img=gx_yzzj|ticket=80 元|season=全年",
"leysts|乐业大石围天坑群|scenery|baise|24.800|106.580|世界天坑之都：28 个天坑串珠，西峰玻璃悬廊俯瞰 613 米深坑底原始森林。|img=gx_leysts|ticket=90 元+观光车|season=全年|key",
"gusl|贺州姑婆山|mountain|hezhou|24.360|111.620|华南天然氧吧：方家茶园与仙姑庙藏于瀑布群，《酒是故乡醇》取景地。|img=gx_gusl|ticket=100 元|season=全年",
"ymgz|南宁扬美古镇|culture|nanning|22.749|107.971|左江边的明清古镇：金马广场与清代老街，比黄姚更市井的烟火气。|img=gx_ymgz|ticket=免费|season=全年",
"dqsl|都安地下河·桃花水母|scenery|hechi|24.100|108.100|世界潜水圣地：澄江地下河天窗群，桃花水母季节限定，蓝刀鱼风暴出圈。|img=gx_dqsl|ticket=潜水另议|season=全年",
],
"liaoning": [
"fuling|沈阳福陵·东陵|culture|shenyang|41.832|123.567|努尔哈赤陵寝：天柱山古松夹道 108 蹬，世界遗产明清皇家陵寝之一。|img=ln_fuling|ticket=42 元|season=全年|level=世界遗产|key",
"xlbo|新乐遗址博物馆|museum|shenyang|41.827|123.429|7200 年前沈阳先民聚落：木雕鸟与煤精制品，太阳鸟雕塑的原型出处。|img=ln_xlbo|ticket=免费|season=全年",
"gsbwg|中国工业博物馆|museum|shenyang|41.792|123.325|共和国工业长子记忆：机床、铸造车间与共和国第一枚国徽的铸铜现场。|img=ln_gsbwg|ticket=免费|season=全年",
"wuns|五女山山城|culture|benxi|41.271|125.437|高句丽开国都城：浑江畔孤峰山城，世界遗产+云海日出双buff。|img=ln_wuns|ticket=70 元|season=5–10 月|level=世界遗产|key",
"yls_ln|抚顺永陵|culture|fushun|41.716|124.836|清祖陵：努尔哈赤曾祖至父辈的陵寝，四祖碑亭格局在清陵中独一份。|img=ln_yls|ticket=40 元|season=全年|level=世界遗产",
"ywlvs|医巫闾山|mountain|jinzhou|41.682|121.548|东北三大名山之首：北镇庙与耶律楚材读书堂，秋季红叶漫山。|img=ln_ywlvs|ticket=50 元|season=全年，9–10 月红叶",
"hekou|丹东河口断桥·桃花岛|landmark|dandong|40.045|124.545|《在那桃花盛开的地方》原型地：鸭绿江上断桥与万亩桃花，春看花海秋看江。|img=ln_hekou|ticket=40 元|season=4–5 月桃花 / 全年",
"bdg|大连冰峪沟|scenery|dalian|39.830|123.080|庄河「北方小桂林」：石英岩峰林与英纳湖，夏季漂流冬季冰瀑。|img=ln_bdg|ticket=80 元|season=5–10 月",
"nhlg|朝阳牛河梁遗址|culture|chaoyang|41.403|119.337|红山文化圣地：5000 年前女神庙与积石冢，中华文明起源实证之一。|img=ln_nhlg|ticket=50 元|season=全年|level=国家考古遗址|key",
],
"neimenggu": [
"mrgl|莫日格勒河|scenery|hulunbuir|49.235|120.035|老舍笔下「天下第一曲水」：呼伦贝尔草原腹地九曲十八弯，越野穿越看全景。|img=nm_mrgl|ticket=免费（草原穿越另议）|season=6–9 月|key",
"ysd|元上都遗址|culture|xilingol|42.348|115.993|忽必烈的夏都：世界遗产草原都城，断壁残垣间仍能读出马可·波罗笔下的繁华。|img=nm_ysd|ticket=60 元|season=5–10 月|level=世界遗产|key",
"ylsh|赤峰玉龙沙湖|scenery|chifeng|43.026|118.833|沙漠+湖泊+红山文化玉龙出土地：越野车冲沙、骆驼与星空营地。|img=nm_ylsh|ticket=60 元|season=5–10 月",
"wuta|呼和浩特五塔寺|culture|huhhot|40.805|111.654|金刚座舍利宝塔：塔身刻蒙藏汉三体经文与全国唯一蒙古文天文图。|img=nm_wuta|ticket=30 元|season=全年",
"ashst|克什克腾阿斯哈图石林|scenery|chifeng|43.535|117.420|冰川花岗岩石林横卧草原：「冰石林」与达里湖、白桦林串成克什克腾环线。|img=nm_ashst|ticket=60 元|season=6–10 月|level=4A",
"shiwei|室韦·恩和俄罗斯族乡|culture|hulunbuir|53.015|120.130|额尔古纳河畔界河小镇：木刻楞建筑与列巴飘香，对岸即俄罗斯村庄。|img=nm_shiwei|ticket=免费|season=6–9 月 / 12–2 月雪原|key",
"hst|额尔古纳黑山头|scenery|hulunbuir|50.333|120.625|呼伦贝尔看日落天花板：湿地制高点俯瞰额尔古纳河 S 弯，马场体验策马。|img=nm_hst|ticket=免费|season=6–9 月",
"lnw|清水河老牛湾|scenery|huhhot|39.567|111.583|黄河与长城握手处：S 形大弯环抱古堡，蒙晋交界的地质与边塞双重奇观。|img=nm_lnw|ticket=40 元|season=4–10 月|key",
"hsgy|赤峰红山公园|culture|chifeng|42.295|118.945|红山文化命名地：玉龙故乡的英金河畔，山顶俯瞰赤峰全城。|img=nm_hsgy|ticket=免费|season=全年",
],
"heilongjiang": [
"fljzy|哈尔滨伏尔加庄园|culture|harbin|45.617|126.843|俄式建筑主题园：圣尼古拉教堂复建+城堡雪圈，冬季冰雪城堡夏季花园。|img=hl_fljzy|ticket=100 元|season=全年，冬季冰雪项目",
"dwj|侵华日军第七三一部队罪证遗址|museum|harbin|45.599|126.628|沉痛但必去：世界最大细菌战遗址，新馆展陈克制而震撼，铭记历史。|img=hl_dwj|ticket=免费需预约|season=全年|key",
"dbhg|宁安渤海国上京龙泉府遗址|culture|mudanjiang|44.096|129.147|「海东盛国」都城：唐代渤海国宫城遗址与石灯幢，镜泊湖畔的千年王气。|img=hl_dbhg|ticket=40 元|season=5–10 月|key",
"sfhg|绥芬河国门|landmark|mudanjiang|44.385|131.190|中东铁路记忆+中俄边境第一站：国门前打卡，套娃广场与俄货街顺游。|img=hl_sfhg|ticket=国门 40 元|season=全年",
"hdhz|横道河子俄式小镇|culture|mudanjiang|44.808|129.017|中东铁路机车库与俄式木屋群：《悬崖之上》取景地，雪季蒸汽火车怀旧感拉满。|img=hl_hdhz|ticket=免费|season=全年，12–2 月雪景最佳|key",
"dblsj|东北烈士纪念馆|museum|harbin|45.758|126.646|杨靖宇赵一曼事迹陈列：哈尔滨老图书馆楼内，红色记忆的城市坐标。|img=hl_dblsj|ticket=免费|season=全年",
"mgys|牡丹江横道河子东北虎林园|scenery|mudanjiang|44.800|129.010|山地虎园观百兽之王：喂食车穿越虎群，雪天东北虎颜值巅峰。|img=hl_mgys|ticket=110 元|season=全年，冬季最佳",
],
"jilin": [
"cbxp|长白山西坡|mountain|baishan|42.094|127.508|1442 级台阶看天池全景：视野比北坡开阔，7 月高山花园漫山花开。|img=jl_cbxp|ticket=105 元+环保车|season=6–9 月 / 冬季滑雪|key",
"jjdxg|锦江大峡谷|scenery|baishan|42.121|127.468|火山熔岩峡谷：西坡顺路游，栈道穿行火山灰森林与怪石之间。|img=jl_jjdxg|ticket=含西坡联票|season=6–10 月",
"cbnp|长白山南坡|mountain|baishan|41.902|128.072|最原始的一坡：中朝界碑 37 号俯瞰天池全景，每年限流开放需提前查。|img=jl_cbnp|ticket=105 元|season=6–10 月限量开放",
"shl|松花湖|scenery|jilin|43.712|126.583|丰满大坝上的高峡平湖：夏季游船五虎岛，冬季北大湖滑雪场就在湖畔。|img=jl_shl|ticket=游船另收|season=全年",
"maers|延吉帽儿山|scenery|yanbian|42.931|129.542|延吉城市观景台：山顶望全城朝鲜族屋脊，日落与夜景双绝，木栈道好走。|img=jl_maers|ticket=免费|season=全年",
"cxmz|延吉中国朝鲜族民俗园|culture|yanbian|42.853|129.445|穿韩服拍大片的顶流园区：民俗村建筑群+夜市小吃，延吉旅拍第一站。|img=jl_cxmz|ticket=30 元|season=全年|key",
"ldshan|延吉龙井·琵岩山|scenery|yanbian|42.755|129.402|玻璃吊桥+1D 大峡谷滑索：龙井万亩苹果梨园环抱，秋季红叶漫山。|img=jl_ldshan|ticket=80 元|season=5–10 月",
"lwm|通化龙湾群|scenery|tonghua|42.505|126.348|火山口湖群：三角龙湾与大龙湾碧水嵌于森林，秋季层林尽染倒影如画。|img=jl_lwm|ticket=60 元|season=5–10 月",
"kfm|长春文庙|culture|changchun|43.889|125.347|东北规模最大文庙之一：大成殿与科举展，中秋与开笔礼活动延续文脉。|img=jl_kfm|ticket=免费|season=全年",
"ljyh|临江·鸭绿江风光带|scenery|baishan|41.807|126.911|中朝边境小城漫步：江对岸村庄清晰可见，溪谷与花山温泉顺游。|img=jl_ljyh|ticket=免费|season=5–10 月",
],
}

# ---------- 新增美食（追加到列表末尾，不打乱 fd_ 编号） ----------
FOODS_ADD = {
"shanxi": [
("太谷饼", "晋中", "晋商路上走红的百年甜饼：酥皮绵软不粘牙，鑫炳记老号现烤最香。"),
("大同黄糕", "大同", "黄米面蒸糕配炖肉：大同人的年节硬货，「三十里莜面四十里糕」说的就是它。"),
("阳城烧肝", "晋城", "猪肝裹蛋液煎烧的阳城怪吃：外焦里嫩蘸蒜醋，配烧豆腐是老晋城味道。"),
("长治稍美", "长治", "壶关羊汤之外的长治早点：皮薄如纸馅大流油，一笼稍美配一碗羊汤。"),
],
"fujian": [
("佛跳墙", "福州", "闽菜头牌：鲍鱼海参花胶一坛煨，聚春园百年老号是朝圣地。"),
("兴化米粉", "泉州", "莆田细如发丝的米粉：炒兴化粉配海蛎煎，是莆仙游子的乡愁。"),
("福州礼饼", "福州", "芝麻花生馅的扁圆大饼：婚庆寿诞老礼数，老字号饼铺现做现卖。"),
("石狮牛肉羹", "泉州", "闽南牛肉羹天花板：手打牛肉滑嫩弹牙，配咸饭是石狮人的日常。"),
],
"hunan": [
("毛氏红烧肉", "长沙", "韶山冲走出的名菜：不放酱油糖色红亮，肥而不腻是湘菜里的温柔一刀。"),
("永州血鸭", "郴州", "鸭血炒进鸭肉的永州名菜：香辣下饭，宁远血鸭与东安鸡同席。"),
("攸县香干", "长沙", "株洲攸县的茶油炒香干：豆香浓韧劲足，配小米辣就是湘味家常。"),
("芷江鸭", "怀化", "侗乡腌卤名鸭：芷江受降城旁的老味道，皮脆肉香冷吃更佳。"),
],
"xinjiang": [
("新疆馕", "喀什", "丝路干粮之王：窝窝馕芝麻馕玫瑰花馕，喀什老城的馕坑现打现烤。"),
("喀什馕包肉", "喀什", "馕铺底羊肉盖顶：肉汁浸透馕心，一盘顶饱的喀什硬核吃法。"),
],
"guangdong": [
("广州云吞面", "广州", "竹升面+鲜虾云吞+大地鱼汤：老西关一口三宝，汤清面弹才是正宗。"),
("陈村粉", "佛山", "顺德陈村的薄透米粉：蒸排骨或凉拌，米香与嫩滑是早茶隐形冠军。"),
],
"guangxi": [
("南宁卷筒粉", "南宁", "米浆现蒸卷肉末豆角：淋黄皮酱是南宁灵魂，早餐摊排队王。"),
("桂林马蹄糕", "桂林", "荸荠粉蒸出的晶莹甜糕：马蹄粒脆甜，漓江游船上的老点心。"),
("梧州纸包鸡", "柳州", "玉扣纸包裹炸出的嫩鸡：梧州百年名吃，纸不焦而鸡锁汁。"),
("环江香猪", "河池", "世界长寿之乡的小猪：烤香猪皮脆肉嫩，芭蕉叶上吃是毛南族礼数。"),
],
"liaoning": [
("锦州小菜", "锦州", "虾油小菜配烧饼：锦州老菜场的咸鲜味，沟帮子之外的另一张名片。"),
("沈阳萨其马", "沈阳", "满族点心老号：马家烧麦之外，沈阳的萨其马蜜甜松软是老关外味。"),
],
"neimenggu": [
("呼和浩特莜面", "呼和浩特", "莜面窝窝配羊肉臊子：三生三熟的坝上杂粮，武川莜面最有名。"),
("阿拉善冰糖炖驼肉", "阿拉善", "沙漠之驼的滋补吃法：冰糖慢炖驼峰驼肉，戈壁宴席的压轴硬菜。"),
],
"heilongjiang": [
("哈尔滨冻梨冻柿子", "哈尔滨", "东北冬日限定甜品：冻梨化开吸汁水，中央大街人手一个的天然冰沙。"),
("大兴安岭山珍宴", "大兴安岭", "榛蘑猴头蕨菜蓝靛果：林都的森林餐桌，炖小鸡配榛蘑是灵魂。"),
],
"jilin": [
("通化山葡萄酒", "通化", "长白山野生山葡萄酿造：中国甜红葡萄酒老牌，鸭绿江河谷产区风味独特。"),
("长白山人参宴", "白山", "鲜人参炖鸡拔丝人参：抚松人参之乡的宴席，药膳与东北炖菜结合。"),
],
}

# ---------- 新增城市 ----------
CITIES_ADD = {
"liaoning": [
('    ("chaoyang", "朝阳", 41.576, 120.451, "辽西 · 化石古都", "红山文化牛河梁与鸟化石国家地质公园所在地，辽西走廊北端的低调古城。"),'),
],
}

# ---------- 新增航线点 ----------
WP_ADD = {
"hunan": [
'    "shaoshan_wp": ("韶山", 27.915, 112.505),',
],
"liaoning": [
'    "chaoyang": ("朝阳", 41.576, 120.451),',
],
}

# ---------- 新增环线 ----------
LOOPS_ADD = {
"fujian": [
"""    dict(name="闽江源 · 武夷茶道环线", days="4–6 天", km="约 900 km",
         desc="沿闽江逆流而上：武夷山茶山竹筏、泰宁丹霞双湖、沙县小吃扫街，山水与茶一起泡。",
         path="福州 → 南平（武夷山天游峰·九曲溪） → 三明（泰宁大金湖·上清溪·沙县） → 福州",
         note="武夷山主景区一票制含天游峰与九曲溪竹筏；泰宁两湖建议各留半天。",
         ids="fuzhou,nanping,sanming,fuzhou"),""",
],
"hunan": [
"""    dict(name="湘中 · 红色与名山环线", days="3–5 天", km="约 600 km",
         desc="从长沙出发读近代史：韶山故居、衡山祝融峰日出、衡阳保卫战遗址，红色与名山一线串。",
         path="长沙 → 韶山（毛泽东故居） → 南岳衡山 → 衡阳 → 长沙",
         note="韶山故居需提前预约；衡山夜爬看日出是经典玩法，冬季留意雾凇窗口。",
         ids="changsha,shaoshan_wp,hengshan_wp,hengyang,changsha"),""",
],
}

def insert_before_close(text, start_marker, close_line, payload_lines, dedupe_key=None):
    """在 start_marker 之后第一个 close_line 之前插入 payload_lines（幂等）。"""
    if dedupe_key and all(k in text for k in dedupe_key):
        return text, 0
    i = text.find(start_marker)
    if i < 0:
        return text, 0
    j = text.find(close_line, i)
    if j < 0:
        return text, 0
    added = "\n".join(payload_lines)
    if not added.endswith("\n"):
        added += "\n"
    return text[:j] + added + text[j:], len(payload_lines)

def add_spots(text, lines):
    """在 SPOTS r\"\"\" 块的结束引号前追加景点行（按 id 幂等）。"""
    m = re.search(r'SPOTS\s*=\s*r?"""', text)
    if not m:
        return text, 0
    end = text.find('"""', m.end())
    if end < 0:
        return text, 0
    new = [l for l in lines if l.split("|")[0] not in text]
    if not new:
        return text, 0
    block = "\n".join(new) + "\n"
    return text[:end] + block + text[end:], len(new)

def main():
    total = {}
    for pid in SPOTS_ADD:
        path = os.path.join(CONTENT, pid + ".py")
        with io.open(path, encoding="utf-8") as f:
            text = f.read()
        orig = text
        n_sp = n_fd = n_lp = n_ct = n_wp = 0
        text, n_sp = add_spots(text, SPOTS_ADD[pid])
        if pid in FOODS_ADD:
            foods_lines = ['    ("%s", "%s", "%s"),' % (a, b, c) for a, b, c in FOODS_ADD[pid]
                           if ('("%s"' % a) not in text]
            text, n_fd = insert_before_close(text, "FOODS = [", "\n]", foods_lines)
        if pid in LOOPS_ADD:
            loops_lines = [l for l in LOOPS_ADD[pid] if l.split('name="')[1].split('"')[0] not in text]
            text, n_lp = insert_before_close(text, "LOOPS = [", "\n]", loops_lines)
        if pid in CITIES_ADD:
            city_lines = [l for l in CITIES_ADD[pid] if l.split('"')[1] not in text]
            text, n_ct = insert_before_close(text, "CITIES = [", "\n]", city_lines)
        if pid in WP_ADD:
            wp_lines = [l for l in WP_ADD[pid] if ('"%s"' % l.strip().split('"')[1]) not in text]
            text, n_wp = insert_before_close(text, "WAYPOINTS = {", "\n}", wp_lines)
        if text != orig:
            with io.open(path, "w", encoding="utf-8") as f:
                f.write(text)
        total[pid] = (n_sp, n_fd, n_lp, n_ct, n_wp)
        print("%-12s 景点+%d 美食+%d 环线+%d 城市+%d 航点+%d" % (pid, n_sp, n_fd, n_lp, n_ct, n_wp))
    print("完成")

if __name__ == "__main__":
    main()
