woody
=====

woody is html extractor. woody come from a  woodpecker what cartoon character of disney

a simple sample:

	public static void main(String[] args) throws Exception {
		Document doc = Jsoup.connect("http://www.oschina.net/news/43879/webmagic-0-3-0").timeout(60000)
				.userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20100101 Firefox/23.0").get();
		String html = doc.html();
		OsChinaBlogModel model = AnnotationExtractor.me().process(html, OsChinaBlogModel.class);
		System.out.println(model.toJson());
	}

	public static class OsChinaBlogModel extends Model {

		public OsChinaBlogModel() {
			//use to reflect
		}

		@Inject
		@ComboExtract(value = { @ExtractBy(value = "h1.OSCTitle", type = ExprType.CSS),
				@ExtractBy(value = "//title/text()", type = ExprType.XPATH) }, op = OP.OR)
		public String title;

		@Inject
		@ExtractBy(value = "div.PubDate a[href~=http://my\\.oschina\\.net/]", type = ExprType.CSS)
		public String author;

		@Inject
		@ExtractBy(value = "发布于.\\s*(\\d+年\\d+月\\d+日)", type = ExprType.REGEX)
		public Date publishDate;

		@Inject
		@ComboExtract(value = {
				@ExtractBy(value = "div.PubDate", type = ExprType.CSS, setting = @Setting(outerHtml = true)),
				@ExtractBy(value = "(\\d+)评", type = ExprType.REGEX) }, op = OP.AND)
		public int commentNum;

		@Inject
		@ExtractBy(value = "span#p_favor_count", type = ExprType.CSS, setting = @Setting(function = @Function(value = "replace", args = {
				"+", "" })))
		public int collectNum;

		@Inject
		@ComboExtract(value = {
				@ExtractBy(value = "div[id=userComments]", type = ExprType.CSS, setting = @Setting(outerHtml = true)),
				@ExtractBy(value = "div.TextContent", type = ExprType.CSS) }, op = OP.AND, multi = true)
		public List<String> commentContents;

		@Inject
		@ExtractBy(value = "div[id=toolbar_wrapper]", setting = @Setting(fliters = { "b", "span" }), type = ExprType.CSS, impl = Document.class)
		public String weibo;

	}