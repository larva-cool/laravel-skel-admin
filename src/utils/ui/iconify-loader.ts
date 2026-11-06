/**
 * 离线图标加载器
 *
 * 通过预加载图标集数据，避免运行时从 CDN 获取图标。
 * 所有使用到的图标集必须在此注册，否则会导致网络请求失败。
 *
 * @module utils/ui/iconify-loader
 */

import { addCollection, type IconifyJSON } from '@iconify/vue'

import riIcons from '@iconify-json/ri/icons.json'
import iconamoonIcons from '@iconify-json/iconamoon/icons.json'
import systemUiconsIcons from '@iconify-json/system-uicons/icons.json'
import fluentIcons from '@iconify-json/fluent/icons.json'
import vaadinIcons from '@iconify-json/vaadin/icons.json'

addCollection(riIcons as IconifyJSON)
addCollection(iconamoonIcons as IconifyJSON)
addCollection(systemUiconsIcons as IconifyJSON)
addCollection(fluentIcons as IconifyJSON)
addCollection(vaadinIcons as IconifyJSON)
