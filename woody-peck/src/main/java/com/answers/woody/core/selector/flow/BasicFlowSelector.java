package com.answers.woody.core.selector.flow;

import java.util.ArrayList;
import java.util.List;

import com.answers.woody.core.selector.Selector;

public abstract class BasicFlowSelector implements Selector {

	protected List<Selector> selectors;

	public BasicFlowSelector(Selector... selectors) {
		this.selectors = new ArrayList<Selector>();
		for (Selector selector : selectors) {
			this.selectors.add(selector);
		}
	}

	public BasicFlowSelector(List<Selector> selectors) {
		this.selectors = selectors;
		if (this.selectors == null)
			this.selectors = new ArrayList<Selector>();
	}

	@Override
	public abstract String select(String text);

	@Override
	public abstract List<String> selectList(String text);

	@Override
	public String toString() {
		return this.getClass().getSimpleName() + " [selectors=" + selectors + "]";
	}

}
