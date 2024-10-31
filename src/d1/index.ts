interface PipelineItem {
  /**
   * 多条件
   */
  $match?: {
    $or?: object[]
    $range?: {
      [key: string]: [number, number]
    }[]
    [key: string]: unknown
  }

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
  #tableName: T | string = '' // 表名
  #query = '' // sql语句
  #values: any = [] // 数据
  constructor() {}

  // 拼接 WHERE | 'SET'
  #addAction(str: 'WHERE' | 'SET' = 'WHERE') {
    if (!this.#query.includes(str)) {
      this.#query = `${this.#query} ${str}`
    }
  }

  // { name : 'breathe , age: 12 }  => ['name = ?','age = ?']
  #objSplit2Arr(obj = {}, splitStr: '=' | 'LIKE' | '<=' | '>=' = '=') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return []
    let vals = Object.values(obj)
    if (splitStr === 'LIKE') {
      vals = Array.from(vals, (val) => `%${val}%`)
    }
    this.#values = [...this.#values, ...vals]
    const arr = Array.from(keys, (key) => `${key} ${splitStr} ?`)
    return arr
  }

  // ['name LIKE ?' ,' age LIKE ?'] => (name LIKE ? OR age LIKE ?)
  #arrSplit2Str(arr: string[] = [], splitStr: 'AND' | 'OR' = 'AND') {
    let str = arr.join(` ${splitStr} `)
    return `(${str})`
  }

  /**
   * 操作的表
   * @example .table('Users')
   */
  table(table: T) {
    this.#tableName = table
    return {
      insert: this.#insert.bind(this),
      delete: this.#delete.bind(this),
      select: this.#select.bind(this),
      update: this.#update.bind(this)
    }
  }

  /**
   * 插入
   * @param datas 数据
   * @SQL `INSERT INTO table_name (field1, field2) VALUES (?, ?), (?, ?)`
   * @example .insert([{ name: 'breathe', age: 12 }])
   */
  #insert(datas: object[]) {
    this.#query = `INSERT INTO ${this.#tableName}`
    this.#values = []

    for (const [index, data] of datas.entries()) {
      if (index === 0) {
        const keys = Object.keys(data)
        const str = keys.join(', ') // field1, field2
        this.#query += ` (${str})`
      }
      const vals = Object.values(data)
      const str = Array(vals.length).fill('?').join(', ')
      this.#values.push(...vals)
      if (index === 0) {
        this.#query += ` VALUES (${str})`
        continue
      }
      this.#query += `, (${str})`
    }
    return { end: this.#end.bind(this) }
  }

  /**
   *
   * @param table 表名
   * @param ids 删除的数据唯一id数组
   * @param keyName 删除时的条件字段key 默认为_id
   * @SQL `DELETE FROM users WHERE ID IN (1, 2, 3)`
   * @example .delete(['111', '222'])
   */
  #delete(ids: string[], keyName: string = '_id') {
    const str = Array(ids.length).fill('?').join(', ')
    this.#query = `DELETE FROM ${this.#tableName} WHERE ${keyName} IN (${str})`
    this.#values = ids
    return { end: this.#end.bind(this) }
  }

  /**
   * 查询
   * @param pipelineItem 聚合条件
   * @SQL `SELECT * FROM Applications WHERE (app_name LIKE ?) OR (comment LIKE ?) LIMIT ?, ?`
   * @example .insert([{ name: 'breathe', age: 12 }])
   */
  #select(pipelineItem: PipelineItem) {
    this.#query = `SELECT * FROM ${this.#tableName}`
    this.#values = []
    let { end_id, end_key = '_id', $match, $sort, page, size } = pipelineItem

    // 指定id后查询
    if (end_id) {
      this.#addAction('WHERE')
      this.#values.push(`${end_id}`)
      let str = ` ${end_key} > ?`
      this.#query += str
    }

    if ($match) {
      this.#addAction('WHERE')
      const items = Object.entries($match).entries()

      const conditionArr = []
      for (const [_, [key, val]] of items) {
        switch (key) {
          case '$or':
            // 多条件模糊查询 [条件一,条件二]
            {
              if (Array.isArray(val)) {
                const arr = []
                for (const obj of val) {
                  let arr2 = this.#objSplit2Arr(obj, 'LIKE')
                  let str = this.#arrSplit2Str(arr2, 'OR')
                  arr.push(str)
                }
                if (arr.length > 0) {
                  let str = this.#arrSplit2Str(arr, 'AND')
                  conditionArr.push(str)
                }
              }
            }
            break
          case '$range':
            // 范围查询
            {
              if (Array.isArray(val)) {
                const arr = []
                for (const obj of val) {
                  const keys = Object.keys(obj).slice(0, 1)
                  for (const key of keys) {
                    const [start, end] = obj[key]
                    if (!start || !end) break
                    {
                      let arr2 = this.#objSplit2Arr({ [key]: start }, '>=')
                      let arr3 = this.#objSplit2Arr({ [key]: end }, '<=')
                      let str = this.#arrSplit2Str([...arr2, ...arr3], 'AND')
                      arr.push(str)
                    }
                  }
                }
                if (arr.length > 0) {
                  let str = this.#arrSplit2Str(arr, 'AND')
                  conditionArr.push(str)
                }
              }
            }
            break

          default:
            // 精准查询 {条件一,条件二}
            {
              let arr = this.#objSplit2Arr({ [key]: val }) // [key = ?]
              let str = this.#arrSplit2Str(arr, 'AND')
              conditionArr.push(str)
            }
            break
        }
      }
      let str = this.#arrSplit2Str(conditionArr, 'AND')
      this.#query += ` ${str}`
    }

    {
      $sort = { created_at: 1 }
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
      // this.#query += `${str} ASC`
      this.#query += `${str} DESC`
    }
    // page size
    if (page && size) {
      page = Math.max(1, Number(page)) // 最小为1
      size = Math.min(50, Number(size)) // 最大为50
      let offset = Number(page - 1) * Number(size)
      this.#values.push(offset)

      let limit = Number(size)
      this.#values.push(limit)

      let str = ` LIMIT ?, ?`
      this.#query += str
    }
    return { end: this.#end.bind(this), total: this.#total.bind(this) }
  }

  /**
   * 更新
   * @param data 数据
   * @param keyName 修改时的条件字段key 默认为_id
   * @SQL `UPDATE Users SET mobile = ?, username = ? WHERE id = ?`
   * @example .update({ _id: '111', name: 'aaa' }, '_id')
   */
  #update<T extends { [key: string]: unknown }>(data: T, keyName: keyof T) {
    this.#query = `UPDATE ${this.#tableName}`
    this.#values = []
    let _data = JSON.parse(JSON.stringify(data))
    const whereObj = { [keyName]: data[keyName] }
    delete _data[keyName]
    {
      this.#addAction('SET')
      let arr = this.#objSplit2Arr(_data)
      let str = arr.join(', ')
      this.#query += ` ${str}`
    }
    {
      this.#addAction('WHERE')
      let arr = this.#objSplit2Arr(whereObj)
      let str = this.#arrSplit2Str(arr)
      this.#query += ` ${str}`
    }
    return { end: this.#end.bind(this) }
  }

  /**
   * 返回结果
   * @param full 是否返回完整sql
   * @example .end()
   * @returns 结果 D1Result
   */
  #end(full: boolean = false) {
    let query = this.#query
    let values = this.#values
    if (full) {
      for (const val of values) {
        query = query.replace('?', val)
      }
    }
    let obj = { query, values }
    // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:end`, obj)
    return obj
  }

  /**
   * 返回结果
   * @param full 是否返回完整sql
   * @example .total()
   * @returns 结果 D1Result
   */
  #total(full: boolean = false) {
    let query = this.#query
    let values = this.#values
    if (full) {
      for (const val of values) {
        query = query.replace('?', val)
      }
    }
    query = query.replace('*', 'COUNT(*)')
    query = query.split(' ORDER')[0]
    values = values.slice(0, values.length - 2)
    let obj = { query, values }
    return obj
  }
}
