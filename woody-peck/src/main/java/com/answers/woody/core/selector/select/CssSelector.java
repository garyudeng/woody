package com.answers.woody.core.selector.select;

import java.util.List;

import com.answers.woody.core.model.annotation.ExprType;
import com.answers.woody.core.selector.select.parser.SelectParseFactory;
import com.answers.woody.core.selector.select.parser.SelectParser;

public class CssSelector extends BasicQuerySelector {

	public static final String PREFIX = "css";

	public CssSelector(String query) {
		super(query);
	}

	@Override
	protected List<String> $selectList(String text) {
		SelectParser cssSelectParser = SelectParseFactory.create(ExprType.CSS, this.implClass, dataMap);
		List<String> results = cssSelectParser.parse(this.query, text);
		return results;
	}

	@Override
	public String toString() {
		return "CssSelector [query=" + query + ", isMulti=" + isMulti + ", dataMap=" + dataMap + ", haveValidate="
				+ haveValidate + ", implClass=" + implClass + "]";
	}

}
