package com.answers.woody.core.selector.select;

import java.util.List;

import com.answers.woody.core.model.annotation.ExprType;
import com.answers.woody.core.selector.select.parser.SelectParseFactory;
import com.answers.woody.core.selector.select.parser.SelectParser;

public class XpathSelector extends BasicQuerySelector {

	public XpathSelector(String query) {
		super(query);

	}

	@Override
	protected List<String> $selectList(String text) {
		SelectParser xpathSelectParser = SelectParseFactory.create(ExprType.XPATH, this.implClass, dataMap);
		List<String> results = xpathSelectParser.parse(query, text);
		return results;
	}

	@Override
	public String toString() {
		return "XpathSelector [query=" + query + ", isMulti=" + isMulti + ", dataMap=" + dataMap + ", haveValidate="
				+ haveValidate + ", implClass=" + implClass + ", runValidate()=" + runValidate() + ", toString()="
				+ super.toString() + ", getClass()=" + getClass() + ", hashCode()=" + hashCode() + "]";
	}

}
