package com.answers.woody.core.model;

import java.util.HashMap;
import java.util.Map;

import com.answers.woody.core.util.MD5Signature;

public abstract class ObjectCache {

	public static final int HTML = 0x01;
	public static final int CLASS = 0x02;

	private static Map<Integer, Map<String, Object>> cache = new HashMap<Integer, Map<String, Object>>();

	private static int MAX_CACHE_SIZE = 0x02;

	private static int CLASS_MAX_CACHE_ZIE = 0x05;

	public synchronized static void put(int type, String key, Object value) {
		Map<String, Object> map = cache.get(type);
		if (map == null) {
			map = new HashMap<String, Object>();
		}
		map.put(key, value);
		cache.put(type, map);
	}

	public synchronized static Object get(int type, String key) {
		Map<String, Object> map = cache.get(type);
		return map == null ? null : map.get(key);
	}

	public synchronized static boolean purge(int type, boolean force) {
		Map<String, Object> map = cache.get(type);
		if (map == null || map.isEmpty())
			return false;
		if (force) {
			cache.remove(type);
			return true;
		}
		int max = (CLASS == type) ? CLASS_MAX_CACHE_ZIE : MAX_CACHE_SIZE;
		if (map.size() > max) {
			cache.remove(type);
			return true;
		}
		return false;
	}

	public synchronized static boolean purge(int type) {
		return purge(type, false);
	}

	public synchronized void adjustCacheSize(int type, int size) {
		switch (type) {
		case CLASS:
			CLASS_MAX_CACHE_ZIE = size;
			break;
		default:
			MAX_CACHE_SIZE = size;
			break;
		}
	}

	public static String createKeyString(String prefix, String text) {
		return MD5Signature.md5Str(prefix + "#" + text);
	}

	public static boolean validate(Object obj, Class<?> clazz) {
		if ((obj != null) && (obj.getClass().isAssignableFrom(clazz))) {
			return true;
		}
		return false;
	}

	@SuppressWarnings("unchecked")
	public static <T> T safeGet(int type, String key, Class<T> clazz) {
		Object obj = get(type, key);
		boolean valid = validate(obj, clazz);
		if (valid) {
			return (T) obj;
		}
		return null;
	}
}