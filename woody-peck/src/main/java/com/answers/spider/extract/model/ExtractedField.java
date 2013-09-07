package com.answers.spider.extract.model;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import com.answers.spider.extract.selector.Selector;

public class ExtractedField {

	private Selector selector;

	private final Field field;

	private Method setterMethod;

	private boolean isMulti;

	private boolean isNotNull;

	private String defaultValue;

	public ExtractedField(Selector selector, Field field, Method setterMethod) {
		super();
		this.selector = selector;
		this.field = field;
		this.setterMethod = setterMethod;
		this.isMulti = false;
		this.isNotNull = false;
		this.defaultValue = null;
	}

	public Selector getSelector() {
		return selector;
	}

	public Field getField() {
		return field;
	}

	public Method getSetterMethod() {
		return setterMethod;
	}

	public boolean isMulti() {
		return isMulti;
	}

	public ExtractedField setMulti(boolean isMulti) {
		this.isMulti = isMulti;
		return this;
	}

	public boolean isNotNull() {
		return isNotNull;
	}

	public ExtractedField setNotNull(boolean isNotNull) {
		this.isNotNull = isNotNull;
		return this;
	}

	public String getDefaultValue() {
		return defaultValue;
	}

	public ExtractedField setDefaultValue(String defaultValue) {
		this.defaultValue = defaultValue;
		return this;
	}

	@Override
	public String toString() {
		return "ExtractedField [selector=" + selector + ", field=" + field + ", setterMethod=" + setterMethod
				+ ", isMulti=" + isMulti + ", isNotNull=" + isNotNull + ", defaultValue=" + defaultValue + "]";
	}
}
