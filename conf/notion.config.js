/**
 * 读取Notion相关的配置
 * 如果需要在Notion中添加自定义字段，可以修改此文件
 * 此文件内容可以通过环境变量覆盖，但是不支持用NOTION_CONFIG覆盖
 */
module.exports = {
  // Notion数据库索引，取notion的第几个视图作为站点数据和排序依据
  // 本站固定使用包含文章、页面与配置入口的第一个数据库视图。
  // 避免 Vercel 中遗留的索引选择空视图，导致构建成功但站点没有内容。
  NOTION_INDEX: 0,
  // 由于计算机是从0开始计数、而非从1开始。因此如果要取第二个视图，可以传1，取第三个视图传2，以此类推,取数据库的最后一个视图可以传-1。

  // 自定义配置notion数据库字段名
  NOTION_PROPERTY_NAME: {
    // 这些名称与本站当前 Notion 数据库 schema 一一对应。固定映射可避免旧的
    // NEXT_PUBLIC_NOTION_PROPERTY_* 环境变量把所有行解析成无类型内容。
    password: 'password',
    type: 'type',
    type_post: 'Post',
    type_page: 'Page',
    type_notice: 'Notice',
    type_menu: 'Menu',
    type_sub_menu: 'SubMenu',
    type_member: 'Member',
    type_event: 'Event',
    title: 'title',
    status: 'status',
    status_publish: 'Published',
    status_invisible: 'Invisible',
    summary: 'summary',
    slug: 'slug',
    category: 'category',
    date: 'date',
    tags: 'tags',
    icon: 'icon',
    ext: 'ext'
  },
  NOTION_ACTIVE_USER: process.env.NOTION_ACTIVE_USER || '',
  NOTION_TOKEN_V2: process.env.NOTION_TOKEN_V2 || '' // Useful if you prefer not to make your database public
}
