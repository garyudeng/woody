package com.answers.woody.core.selector.select;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.answers.woody.core.model.FuntionObj;
import com.answers.woody.core.model.SettingConstant;
import com.answers.woody.core.model.SupportedLanguage;
import com.answers.woody.core.parser.JavaScriptEngine;
import com.answers.woody.core.selector.Selector;
import com.answers.woody.core.util.StringUtil;

public abstract class BasicQuerySelector implements Selector {

	private static final Logger LOG = LoggerFactory.getLogger(BasicQuerySelector.class);

	protected String query;

	protected boolean isMulti;

	protected Map<String, Object> dataMap;

	protected boolean haveValidate;

	protected Class<?> implClass;

	public BasicQuerySelector(String query) {
		super();
		this.query = query;
		this.isMulti = false;
		this.dataMap = new HashMap<String, Object>();
		this.haveValidate = false;
		this.implClass = null;
	}

	public BasicQuerySelector impl(Class<?> implClass) {
		this.implClass = implClass;
		return this;
	}

	protected abstract List<String> $selectList(String text);

	protected String $select(String text) {
		List<String> results = selectList(text);
		return first(results);
	}

	protected String deepProcess(String result) {
		// create a doc instance from the result text
		Document doc = Jsoup.parse(result);
		// filter
		Object _filters = this.get(SettingConstant.FLITERS);
		String[] filters = null;
		if (_filters != null) {
			filters = (String[]) _filters;
		}
		if (filters.length > 0 && !(filters.length == 1 && StringUtil.isNullOrEmpty(filters[0]))) {
			for (String filter : filters) {
				doc.select(filter).remove();
			}
		}
		// outer html
		Object outerHtml = this.get(SettingConstant.OUTER_HTML);
		boolean isouterHtml = false;
		if (outerHtml != null) {
			isouterHtml = (Boolean) outerHtml;
		}
		if (isouterHtml) {
			result = doc.body().html();
		} else {
			result = doc.text();
		}
		// invoke function
		Object _function = this.get(SettingConstant.FUNCTION);
		if (_function != null) {
			FuntionObj functionObj = (FuntionObj) _function;
			result = callFunction(result, functionObj);
		}
		// trim
		Object trim = this.get(SettingConstant.TRIM);
		boolean isTrim = true;
		if (trim != null) {
			isTrim = (Boolean) trim;
		}
		if (result != null && isTrim) {
			result = result.trim();
		}
		return result;
	}

	private String callFunction(String originalValue, FuntionObj functionObj) {
		if (functionObj == null)
			return originalValue;
		final String $this = "$this";
		SupportedLanguage language = functionObj.language();
		String path = functionObj.path();
		String method = functionObj.method();
		boolean classpath = functionObj.classpath();
		// replace '$this' to current originalValue
		String[] _args = functionObj.args();
		boolean have$this = false;
		List<Object> argList = new ArrayList<Object>();
		for (Object arg : _args) {
			if (arg.toString().equalsIgnoreCase($this) && !(have$this)) {
				have$this = true;
			}
			argList.add(arg);
		}
		if (!have$this) {
			argList.add(0, $this);
		}
		Object[] args = new Object[argList.size()];
		for (int i = 0; i < argList.size(); i++) {
			Object arg = argList.get(i);
			if ($this.equals(arg.toString())) {
				arg = originalValue;
			}
			args[i] = arg;
		}
		// XXX now just support 'javaScript',
		// in future will support more language
		switch (language) {
		case JavaScript: {
			JavaScriptEngine javaScriptEngine = classpath ? JavaScriptEngine.me(path) : JavaScriptEngine.me(new File(
					path));
			try {
				originalValue = (String) javaScriptEngine.call(method, args);
			} catch (Exception e) {
				LOG.warn(e.toString());
			}
		}
			break;
		default:
			throw new IllegalArgumentException("Unsupport language: " + language);
		}
		return originalValue;
	}

	@Override
	public String select(String text) {
		this.validate0(this.getClass().getSimpleName() + "#Select(String)");
		String result = $select(text);
		if (!StringUtil.isNullOrEmpty(result) && !(this instanceof TestSelector)) {
			result = deepProcess(result);
		}
		return result;
	}

	@Override
	public List<String> selectList(String text) {
		this.validate0(this.getClass().getSimpleName() + "#selectList(String)");
		List<String> results = new ArrayList<String>();
		List<String> _results = $selectList(text);
		if (_results != null && _results.size() > 0) {
			for (String result : _results) {
				if (!StringUtil.isNullOrEmpty(result)) {
					result = deepProcess(result);
				}
				results.add(result);
			}
		}
		return results;
	}

	protected String first(List<String> results) {
		return results.size() > 0 ? results.get(0) : EMPTY_RESULT;
	}

	protected boolean validate(StringBuffer buff) {
		if (StringUtil.isNullOrEmpty(this.query))
			return false;
		return true;
	}

	protected BasicQuerySelector runValidate() {
		StringBuffer buff = new StringBuffer();
		if (!validate(buff)) {
			throw new IllegalArgumentException(String.format("The select query is invalid. Query:-->%s<--,msg:%s",
					this.query, buff.toString()));
		}
		return this;
	}

	protected void validate0(String methodName) {
		if (!this.haveValidate) {
			throw new IllegalArgumentException("don't invoke 'runValidate()' before execute method: " + methodName);
		}
	}

	/**
	 * please use {@link #putWithValidate(String, Object)} instead of the method
	 */
	@Deprecated
	public BasicQuerySelector put(String key, Object value) {
		this.dataMap.put(key, value);
		return this;
	}

	public BasicQuerySelector putWithValidate(String key, Object value) {
		this.haveValidate = true;
		return this.put(key, value).runValidate();
	}

	/** please use {@link #putAllWithValidate(Map)} instead of the method */
	@Deprecated
	public BasicQuerySelector putAll(Map<String, Object> dataMap) {
		if (dataMap != null) {
			this.dataMap.putAll(dataMap);
		}
		return this;
	}

	public BasicQuerySelector putAllWithValidate(Map<String, Object> dataMap) {
		this.haveValidate = true;
		return this.putAll(dataMap).runValidate();
	}

	public Object get(String key) {
		return this.dataMap.get(key);
	}

	@Override
	public String toString() {
		return "BasicQuerySelector [query=" + query + ", isMulti=" + isMulti + ", dataMap=" + dataMap
				+ ", haveValidate=" + haveValidate + ", implClass=" + implClass + "]";
	}

}
