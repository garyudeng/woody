package com.answers.woody.core.selector.flow;

import java.util.List;

import com.answers.woody.core.selector.Selector;
import com.answers.woody.core.util.StringUtil;

public class AndSelector extends BasicFlowSelector {

	public AndSelector(List<Selector> selectors) {
		super(selectors);
	}

	public AndSelector(Selector... selectors) {
		super(selectors);
	}

	@Override
	public String select(String text) {
		for (Selector selector : selectors) {
			if (StringUtil.isNullOrEmpty(text))
				return EMPTY_RESULT;
			text = selector.select(text);
		}
		return text;
	}

	@Override
	public List<String> selectList(String text) {
		List<String> results = EMPTY_RESULT_LIST;
		for (int i = 0; i < selectors.size(); i++) {
			Selector selector = selectors.get(i);
			results = selector.selectList(text);
			if (results == null || results.size() == 0) {
				return EMPTY_RESULT_LIST;
			}
			if (i < selectors.size() -1) {
				text = results.get(0);
			}
		}
		return results;
	}

}
