export type Locale = "en" | "zh";

const dict = {
  // Header nav
  "nav.home": { en: "Home", zh: "首页" },
  "nav.gallery": { en: "Gallery", zh: "图库" },
  "nav.collections": { en: "Collections", zh: "合集" },
  "nav.about": { en: "About", zh: "关于" },
  "nav.toggleTheme": { en: "Toggle theme", zh: "切换主题" },
  "nav.toggleMenu": { en: "Toggle menu", zh: "切换菜单" },

  // Hero defaults
  "hero.subtitle": { en: "Photography Portfolio", zh: "摄影作品集" },
  "hero.title": { en: "Gallery", zh: "图库" },
  "hero.description": {
    en: "Capturing moments, light, and emotion through the lens.",
    zh: "用镜头捕捉每一个瞬间、光影与情感。",
  },
  "hero.cta": { en: "View Gallery", zh: "浏览图库" },
  "hero.alt": { en: "Hero photograph", zh: "封面照片" },

  // Home page
  "home.empty": {
    en: "No photos yet. Add some in the admin panel.",
    zh: "还没有照片，请在管理后台添加。",
  },
  "home.selectedWorks": { en: "Selected Works", zh: "精选作品" },
  "home.featured": { en: "Featured", zh: "精选" },
  "home.viewAll": { en: "View All Works", zh: "查看全部作品" },

  // Gallery page
  "gallery.browseCollection": { en: "Browse Collection", zh: "浏览作品" },
  "gallery.title": { en: "Gallery", zh: "图库" },
  "gallery.loading": { en: "Loading gallery...", zh: "加载中..." },
  "gallery.searchPlaceholder": { en: "Search photos...", zh: "搜索照片..." },
  "gallery.filters": { en: "Filters", zh: "筛选" },
  "gallery.clearFilters": { en: "Clear filters", zh: "清除筛选" },
  "gallery.clearAll": { en: "Clear all", zh: "清除全部" },
  "gallery.allLoaded": { en: "All {n} photos loaded", zh: "已加载全部 {n} 张照片" },
  "gallery.matching": { en: "matching", zh: "匹配" },

  // Sort options
  "sort.takenDesc": { en: "Date Taken (Newest)", zh: "拍摄时间（最新）" },
  "sort.takenAsc": { en: "Date Taken (Oldest)", zh: "拍摄时间（最早）" },
  "sort.addedDesc": { en: "Date Added (Newest)", zh: "添加时间（最新）" },
  "sort.addedAsc": { en: "Date Added (Oldest)", zh: "添加时间（最早）" },
  "sort.titleAsc": { en: "Title (A → Z)", zh: "标题 (A → Z)" },
  "sort.titleDesc": { en: "Title (Z → A)", zh: "标题 (Z → A)" },

  // Filter labels
  "filter.camera": { en: "Camera", zh: "相机" },
  "filter.lens": { en: "Lens", zh: "镜头" },
  "filter.location": { en: "Location", zh: "地点" },
  "filter.allCameras": { en: "All Cameras", zh: "所有相机" },
  "filter.allLenses": { en: "All Lenses", zh: "所有镜头" },
  "filter.allLocations": { en: "All Locations", zh: "所有地点" },

  // Category filter
  "category.all": { en: "All", zh: "全部" },

  // Collections
  "collections.curatedSets": { en: "Curated Sets", zh: "精选合集" },
  "collections.title": { en: "Collections", zh: "合集" },
  "collections.empty": { en: "No collections yet.", zh: "暂无合集。" },
  "collections.collection": { en: "Collection", zh: "合集" },
  "collections.notFound": { en: "Collection not found.", zh: "未找到该合集。" },
  "collections.loading": { en: "Loading...", zh: "加载中..." },

  // About page
  "about.subtitle": { en: "The Photographer", zh: "摄影师" },
  "about.title": { en: "About", zh: "关于" },
  "about.portraitAlt": { en: "Photographer portrait", zh: "摄影师肖像" },

  // Lightbox
  "lightbox.close": { en: "Close lightbox", zh: "关闭" },
  "lightbox.toggleDetails": { en: "Toggle details", zh: "切换详情" },
  "lightbox.resetZoom": { en: "Reset zoom", zh: "重置缩放" },
  "lightbox.prev": { en: "Previous photo", zh: "上一张" },
  "lightbox.next": { en: "Next photo", zh: "下一张" },
  "lightbox.showMore": { en: "Show more", zh: "展开" },
  "lightbox.showLess": { en: "Show less", zh: "收起" },

  // Detail labels
  "detail.category": { en: "Category", zh: "分类" },
  "detail.dimensions": { en: "Dimensions", zh: "尺寸" },
  "detail.camera": { en: "Camera", zh: "相机" },
  "detail.lens": { en: "Lens", zh: "镜头" },
  "detail.aperture": { en: "Aperture", zh: "光圈" },
  "detail.shutter": { en: "Shutter", zh: "快门" },
  "detail.iso": { en: "ISO", zh: "ISO" },
  "detail.focal": { en: "Focal", zh: "焦距" },
  "detail.date": { en: "Date", zh: "日期" },
  "detail.location": { en: "Location", zh: "地点" },

  // Footer
  "footer.copyright": { en: "Gallery. All rights reserved.", zh: "Gallery. 保留所有权利。" },

  // Layout
  "layout.grid": { en: "Grid", zh: "网格" },
  "layout.square": { en: "Square", zh: "宫格" },
  "layout.feed": { en: "Feed", zh: "流" },

  // Counts
  "count.photo": { en: "photo", zh: "张照片" },
  "count.photos": { en: "photos", zh: "张照片" },
} as const;

export type TransKey = keyof typeof dict;

export function t(key: TransKey, locale: Locale, vars?: Record<string, string | number>): string {
  const entry = dict[key];
  let text: string = entry?.[locale] ?? entry?.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function photoCount(n: number, locale: Locale): string {
  if (locale === "zh") return `${n} 张照片`;
  return `${n} photo${n !== 1 ? "s" : ""}`;
}

export function localized(
  en: string | null | undefined,
  zh: string | null | undefined,
  locale: Locale,
): string {
  if (locale === "zh") return zh || en || "";
  return en || zh || "";
}

export function localizedOr(
  en: string | null | undefined,
  zh: string | null | undefined,
  locale: Locale,
): string | undefined {
  const result = locale === "zh" ? (zh || en) : (en || zh);
  return result || undefined;
}
