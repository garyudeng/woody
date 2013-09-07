package com.answers.spider.extract.parser;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.htmlcleaner.TagNode;
import org.jsoup.nodes.Document;

import com.answers.spider.extract.model.ExtractedField;
import com.answers.spider.extract.model.ObjectCache;
import com.answers.spider.extract.model.SupportedClassType;
import com.answers.spider.extract.model.annotation.ExprType;
import com.answers.spider.extract.model.annotation.OP;
import com.answers.spider.extract.selector.Selector;
import com.answers.spider.extract.selector.flow.AndSelector;
import com.answers.spider.extract.selector.flow.JoinSelector;
import com.answers.spider.extract.selector.flow.OrSelector;
import com.answers.spider.extract.selector.select.CssSelector;
import com.answers.spider.extract.selector.select.RegexSelector;
import com.answers.spider.extract.selector.select.TestSelector;
import com.answers.spider.extract.selector.select.XpathSelector;
import com.answers.spider.extract.selector.select.parser.BasicCssSelectParser;
import com.answers.spider.extract.selector.select.parser.BasicXpathSelectParser;
import com.answers.spider.extract.selector.select.parser.HtmlCleanerXpathSelectParser;
import com.answers.spider.extract.selector.select.parser.JsoupCssSelectParser;
import com.answers.spider.extract.util.StringUtil;

public abstract class BasicExtractor implements Extractor {

	protected List<ExtractedField> extractedFields;

	protected Class<?> clazz;

	private Field[] fields;

	private static final String PREFIX = "class";

	public BasicExtractor() {
		this.extractedFields = new ArrayList<ExtractedField>();
	}

	protected abstract Selector getSelector(Field field);

	protected abstract boolean multi(Field field);

	protected abstract boolean notNull(Field field);

	protected abstract String defaultValue(Field field);

	@Override
	public void compile(Class<?> clazz, boolean recompile) {
		this.clazz = clazz;
		validate0();
		this.fields = clazz.getDeclaredFields();
		String className = this.clazz.getCanonicalName();
		String key = ObjectCache.createKeyString(PREFIX, className);
		List<ExtractedField> _extractedFields = null;
		if (recompile) {
			_extractedFields = $compile();
		} else {
			@SuppressWarnings("unchecked")
			ArrayList<ExtractedField> obj = ObjectCache.safeGet(ObjectCache.CLASS, key, ArrayList.class);
			if (obj != null) {
				_extractedFields = obj;
			} else {
				_extractedFields = $compile();
				ObjectCache.purge(ObjectCache.CLASS);
				ObjectCache.put(ObjectCache.CLASS, key, _extractedFields);
			}
		}
		this.extractedFields = _extractedFields;
	}

	@Override
	public void compile(Class<?> clazz) {
		this.compile(clazz, false);
	}

	private List<ExtractedField> $compile() {
		List<ExtractedField> _extractedFields = new ArrayList<ExtractedField>();
		for (Field field : fields) {
			if (!field.isAccessible())
				field.setAccessible(true);
			Selector selector = getSelector(field);
			if (selector == null)
				continue;
			Method setterMethod = getSetterMethod(clazz, field);
			ExtractedField extractedField = new ExtractedField(selector, field, setterMethod);
			// set isMulti value
			boolean isMulti = multi(field);
			extractedField.setMulti(isMulti);
			// set isNotNull value
			boolean isNotNull = notNull(field);
			extractedField.setNotNull(isNotNull);
			// set defaultValue value
			String defaultValue = defaultValue(field);
			extractedField.setDefaultValue(defaultValue);

			validate1(field, extractedField);
			_extractedFields.add(extractedField);
		}
		return _extractedFields;

	}

	@Override
	public Object process(String html) throws InstantiationException, IllegalAccessException, InvocationTargetException {
		Object o = this.clazz.newInstance();
		if (StringUtil.isNullOrEmpty(html))
			return o;
		try {
			// put parse object to cache
			pushParserToCache(html);
		} catch (Exception e) {
			// nothing
		}
		for (ExtractedField extractedField : extractedFields) {
			Selector selector = extractedField.getSelector();
			Object value = null;
			boolean isNull = false;
			// judge whether or not is 'isMulti'
			if (extractedField.isMulti()) {
				List<String> selectedResultList = selector.selectList(html);
				value = selectedResultList;
				if (selectedResultList == null || selectedResultList.isEmpty()) {
					isNull = true;
				}
			} else {
				String selectedResult = selector.select(html);
				value = selectedResult;
				if (StringUtil.isNullOrEmpty(selectedResult)) {
					isNull = true;
				}
			}
			// check isNotNull
			if (extractedField.isNotNull() && isNull) {
				throw new RuntimeException(String.format("The '%s' filed is not null/empty", extractedField.getField()
						.getName()));
			}
			setField(o, extractedField, value);
		}
		return o;
	}

	@SuppressWarnings({ "unchecked" })
	public <T> T process(String html, Class<T> clazz, boolean recompile) throws InstantiationException,
			IllegalAccessException, InvocationTargetException {
		this.compile(clazz);
		return (T) this.process(html);
	}

	public <T> T process(String html, Class<T> clazz) throws InstantiationException, IllegalAccessException,
			InvocationTargetException {
		return process(html, clazz, false);
	}

	protected Selector createSingleSelector(String query, ExprType type, Class<?> implClass, Map<String, Object> dataMap) {
		Selector selector = null;
		switch (type) {
		case XPATH:
			selector = new XpathSelector(query).putAllWithValidate(dataMap).impl(implClass);
			break;
		case CSS:
			selector = new CssSelector(query).putAllWithValidate(dataMap).impl(implClass);
			break;
		case REGEX:
			selector = new RegexSelector(query).putAllWithValidate(dataMap).impl(implClass);
			break;
		case TEST:
			selector = new TestSelector(query).putAllWithValidate(dataMap).impl(implClass);
			break;
		default:
			selector = new XpathSelector(query).putAllWithValidate(dataMap).impl(implClass);
			break;
		}
		return selector;
	}

	protected Selector appendSelector(OP op, List<Selector> selectorList) {
		Selector selector = null;
		switch (op) {
		case OR:
			selector = new OrSelector(selectorList);
			break;
		case AND:
			selector = new AndSelector(selectorList);
			break;
		case JOIN:
			selector = new JoinSelector(selectorList);
			break;
		default:
			selector = new OrSelector(selectorList);
			break;
		}
		return selector;
	}

	private void validate0() {
		if (this.clazz == null) {
			throw new IllegalStateException(String.format("the extracted class: %s is null", this.clazz.toString()));
		}
	}

	private void validate1(Field field, ExtractedField extractedField) {
		if (extractedField != null) {
			Class<?> fclazz = field.getType();
			if (!extractedField.isMulti()) {
				SupportedClassType supportedClassType = SupportedClassType.fromValue(fclazz, null);
				if (!SupportedClassType.in(supportedClassType, null)) {
					Set<String> classes = SupportedClassType.getAllTypes(null);
					throw new IllegalStateException("Field " + field.getName() + " must in " + classes);
				}

			} else if (extractedField.isMulti()
					&& (!List.class.isAssignableFrom(fclazz) && !Set.class.isAssignableFrom(fclazz))) {
				throw new IllegalStateException("Field " + field.getName() + " must be list");
			}
		}
	}

	private Method getSetterMethod(Class<?> clazz, Field field) {
		String name = "set" + StringUtils.capitalize(field.getName());
		try {
			Method setterMethod = clazz.getDeclaredMethod(name, field.getType());
			setterMethod.setAccessible(true);
			return setterMethod;
		} catch (NoSuchMethodException e) {
			return null;
		}
	}

	private void setField(Object o, ExtractedField fieldExtractor, Object value) throws IllegalAccessException,
			InvocationTargetException {

		Field field = fieldExtractor.getField();
		Method setterMethod = fieldExtractor.getSetterMethod();

		SupportedClassType supportedClassType = SupportedClassType.fromValue(field.getType(), null);
		String defaultValue = fieldExtractor.getDefaultValue();
		// default value
		switch (supportedClassType) {
		case List:
			if (value == null)
				value = Collections.EMPTY_LIST;
			break;
		case Set:
			if (value == null)
				value = Collections.EMPTY_SET;
			break;
		case Date:
			if (value == null)
				value = new Date();
			break;
		case Array:
			if (value == null) {
				value = Array.newInstance(String.class, 0);
			}
			break;
		case Integer:
		case Long:
		case Short:
		case Byte:
			if (StringUtil.isNullOrEmpty((String) value)) {
				if (StringUtil.isNullOrEmpty(defaultValue)) {
					value = "0";
				} else {
					value = defaultValue;
				}
			}
			break;
		case Double:
		case Float:
			if (StringUtil.isNullOrEmpty((String) value)) {
				if (StringUtil.isNullOrEmpty(defaultValue)) {
					value = "0.0";
				} else {
					value = defaultValue;
				}
			}
			break;
		default:
			if (value == null || ((String) value).trim().isEmpty()) {
				if (SupportedClassType.Character == supportedClassType) {
					if (StringUtil.isNullOrEmpty(defaultValue)) {
						value = "";
					} else {
						value = defaultValue.charAt(0);
					}
				} else {
					if (StringUtil.isNullOrEmpty(defaultValue)) {
						value = "";
					} else {
						value = defaultValue;
					}
				}
			}
			break;
		}

		Object _value = null;
		switch (supportedClassType) {
		case String: {
			_value = SupportedClassType.String.parseValue(value);
		}
			break;
		case Character: {
			_value = SupportedClassType.Character.parseValue(value);
		}
			break;
		case Byte: {
			_value = SupportedClassType.Byte.parseValue(value);
		}
			break;
		case Short: {
			_value = SupportedClassType.Short.parseValue(value);
		}
			break;
		case Integer: {
			_value = SupportedClassType.Integer.parseValue(value);
		}
			break;
		case Long: {
			_value = SupportedClassType.Long.parseValue(value);
		}
			break;
		case Double: {
			_value = SupportedClassType.Double.parseValue(value);
		}
			break;
		case Float: {
			_value = SupportedClassType.Float.parseValue(value);
		}
			break;
		case Boolean: {
			if (StringUtils.isEmpty((String) value) || Boolean.FALSE.toString().equalsIgnoreCase((String) value)) {
				value = Boolean.FALSE.toString();
			} else {
				value = Boolean.TRUE.toString();
			}
			_value = SupportedClassType.Boolean.parseValue(value);
		}
			break;
		case List: {
			_value = SupportedClassType.List.parseValue(value);
		}
			break;
		case Set: {
			_value = SupportedClassType.Set.parseValue(value);
		}
			break;
		case Date: {
			_value = SupportedClassType.Date.parseValue(value);
		}
			break;
		default:
			throw new IllegalArgumentException("Unsupported class type: " + field.getType().getCanonicalName());
		}
		boolean success = invokeSetterMethod(o, setterMethod, _value);
		if (!success) {
			field.set(o, _value);
		}
	}

	private boolean invokeSetterMethod(Object o, Method setterMethod, Object value) {
		boolean success = false;
		if (setterMethod != null) {
			try {
				setterMethod.invoke(o, value);
				success = true;
			} catch (Exception e) {
				// nothing
			}
		}
		return success;
	}

	private void pushParserToCache(String html) throws Exception {
		ObjectCache.purge(ObjectCache.HTML);
		Map<String, Object> map = new HashMap<String, Object>();
		// CSS
		String cssKey = ObjectCache.createKeyString(BasicCssSelectParser.PREFIX, html);
		if (ObjectCache.get(ObjectCache.HTML, cssKey) == null) {
			BasicCssSelectParser cssSelectParser = new JsoupCssSelectParser(Document.class, map);
			Document doc = (Document) cssSelectParser.create(html);
			ObjectCache.put(ObjectCache.HTML, cssKey, doc);
		}
		// XPATH
		String xpathKey = ObjectCache.createKeyString(BasicXpathSelectParser.PREFIX, html);
		if (ObjectCache.get(ObjectCache.HTML, xpathKey) == null) {
			BasicXpathSelectParser xpathSelectParser = new HtmlCleanerXpathSelectParser(TagNode.class, map);
			TagNode tagNode = (TagNode) xpathSelectParser.create(html);
			ObjectCache.put(ObjectCache.HTML, xpathKey, tagNode);
		}
	}

	public List<ExtractedField> getExtractedFields() {
		return extractedFields;
	}

	public Class<?> getClazz() {
		return clazz;
	}

}
