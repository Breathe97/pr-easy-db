interface PipelineItem {
  /**
   * 多条件
   */
  $match?: { $or: object[] }

  /**
   * 正序
   */
  $sort?: {
    [key: string]: -1 | 1
  }

  /**
   * 末尾key
   */
  end_id?: string

  /**
   * 末尾id
   */
  end_key?: '_id' | string

  /**
   * 页码
   */
  page?: number | string

  /**
   * 条数
   */
  size?: number | string

  /**
   * 连表查询
   */
  // lookup?: { from: 'roles'; localField: 'roles'; foreignField: 'key'; as: 'roles' }
  lookup?: {
    from: string
    localField: string
    foreignField: string
    as: string
  }

  /**
   * 打散数组
   */
  // unwind?:{ path: '$roles', preserveNullAndEmptyArrays: false } }
  unwind?: {
    path: string
    preserveNullAndEmptyArrays: boolean
  }

  /**
   * 处理字段
   */
  // { $project: { 'roles.created_at': 0, 'roles.created_ip': 0, 'roles.created_user_id': 0, 'roles.permissions': 0 } }
  $project?: {
    'roles.created_at': 0
    'roles.created_ip': 0
    'roles.created_user_id': 0
    'roles.permissions': 0
  }
}

export class PrEasyD1<T> {
  tableName: T | string = '' // 表名
  query = '' // sql语句
  values: any = [] // 数据
  constructor() {}

  /**
   * 查询
   * @param pipelineItem 聚合条件
   * @SQL `SELECT * FROM Applications WHERE (app_name LIKE ?) OR (comment LIKE ?) LIMIT ?, ?`
   * @example .insert([{ name: 'breathe', age: 12 }])
   */
  select(pipelineItem: PipelineItem) {
    this.query = `SELECT * FROM ${this.tableName}`
    this.values = []
    let { end_id, end_key = '_id', $match, $sort, page = 1, size = 10 } = pipelineItem

    if (end_id || $match) {
      this.query += ' WHERE'
    }

    // 指定id后查询
    if (end_id) {
      this.values.push(`${end_id}`)
      let str = ` ${end_key} > ?`
      this.query += str
    }

    // 模糊查询
    if ($match) {
      const { $or = [] } = $match
      let str = ''
      for (const [index, obj] of $or.entries()) {
        let condition = ''
        //   WHERE app_name LINK ? AND age LINK ?
        const items = Object.entries(obj).entries() // [{ 1: [key, val] }]
        for (const [index, [key, val]] of items) {
          this.values.push(`%${val}%`)
          if (index === 0) {
            condition += `${key} LIKE ?`
            continue
          }
          condition += ` AND ${key} LIKE ?`
        }
        if (index === 0) {
          str += `(${condition})`
          continue
        }
        str += ` OR (${condition})`
      }
      this.query += end_id ? ` AND (${str})` : ` (${str})`
    }

    if ($sort) {
      let str = ' ORDER BY'
      let items = Object.entries($sort).entries()
      for (const [index, [key]] of items) {
        if (index === 0) {
          str += ` ${key}`
          continue
        }
        str += `, ${key}`
      }
      this.query += `${str} ASC`
    }
    // page size
    {
      page = Math.max(1, Number(page)) // 最小为1
      size = Math.min(50, Number(size)) // 最大为50
      let offset = Number(page - 1) * Number(size)
      this.values.push(offset)

      let limit = Number(size)
      this.values.push(limit)

      let str = ` LIMIT ?, ?`
      this.query += str
    }
    return this
  }

  /**
   * 插入
   * @param datas 数据
   * @SQL `INSERT INTO table_name (field1, field2) VALUES (?, ?), (?, ?)`
   * @example .insert([{ name: 'breathe', age: 12 }])
   */
  insert(datas: object[]) {
    this.query = `INSERT INTO ${this.tableName}`
    this.values = []

    for (const [index, data] of datas.entries()) {
      if (index === 0) {
        const keys = Object.keys(data)
        const str = keys.join(', ') // field1, field2
        this.query += `(${str})`
      }
      const vals = Object.keys(data)
      const str = Array(vals.length).fill('?').join(', ')
      this.values.push(...vals)
      if (index === 0) {
        this.query += ` VALUES (${str})`
        continue
      }
      this.query += `, (${str})`
    }
    return this
  }

  /**
   *
   * @param table 表名
   * @param ids 删除的数据唯一id数组
   * @param keyName 删除时的条件字段key 默认为_id
   * @SQL `DELETE FROM users WHERE ID IN (1, 2, 3)`
   * @example .delete(['111', '222'])
   */
  delete(ids: string[], keyName = '_id') {
    const str = Array(ids.length).fill('?').join(', ')
    this.query = `DELETE FROM ${this.tableName} WHERE ${keyName} IN (${str})`
    this.values = ids
    return this
  }

  /**
   * 更新
   * @param data 数据
   * @param keyName 修改时的条件字段key 默认为_id
   * @SQL `UPDATE Users SET mobile = ?, username = ? WHERE id = ?`
   * @example .update({ _id: '111', name: 'aaa' }, '_id')
   */
  update<T extends { [key: string]: unknown }>(data: T, keyName: keyof T) {
    this.query = `UPDATE ${this.tableName}`
    this.values = []
    const val = data[keyName] // 记录条件

    const items = Object.entries(data).entries()
    for (const [index, [key, val]] of items) {
      this.values.push(val)
      if (index === 0) {
        this.query += ` SET ${key} = ?`
        continue
      }
      this.query += `,  ${key} = ?`
    }
    this.query += `WHERE ${String(keyName)} = ?`
    this.values.push(val)
    return this
  }

  /**
   * 操作的表
   * @example .table('Users')
   */
  table(table: T) {
    this.tableName = table
    return this
  }

  /**
   * 返回结果
   * @param full 是否返回完整sql
   * @example .end(true)
   * @returns { query, values }
   */
  end(full = false) {
    let query = this.query
    let values = this.values
    if (full) {
      for (const val of values) {
        query = query.replace('?', val)
      }
    }
    let obj = { query, values }
    return obj
  }
}
