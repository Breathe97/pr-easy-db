# 快速生成 SQL 语句。

## 立即开始

#### 安装

```bash
npm i pr-easy-db
```

#### 引入

```js

import { PrEasyD1 } from 'pr-easy-db'

// 定义你数据库的所有表名
type TableNames = 'Users' | 'Books'

// 将你的表名注入 以便代码直接索引提示
const prEasyD1 = new PrEasyD1<TableNames>()

```

#### 增加

```sql
INSERT INTO Users (_id, username, age) VALUES (?, ?, ?)
```

```js
{
  const sql = prEasyD1.table('Users').insert([{ _id: 123, username: 'breathe', age: 12 }])
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}
```

#### 查询

```sql
SELECT * FROM Users WHERE ((age = ?) AND ((account LIKE ? OR mobile LIKE ? OR emali LIKE ?)) AND (state = ?)) LIMIT ?, ?
```

```js
{
  const account = 'breathe' // 手机号 | 邮箱 | 账号
  // 多条件查询
  const pipelineItem = {
    $match: { age: 12, $or: [{ account: account, mobile: account, emali: account }], state: 1 },
    page: 1,
    size: 20
  }
  const sql = prEasyD1.table('Users').select(pipelineItem)
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}

// 如果你只想查询总数
{
  const { query, values } = sql.total()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}
```

#### 修改

```sql
UPDATE Users SET name = ?, age = ? WHERE (_id = ?)
```

```js
{
  const sql = prEasyD1.table('Users').update({ _id: 123, name: 'aaaa', age: 44 }, '_id')
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}
```

#### 删除

```sql
DELETE FROM Users WHERE _id IN (?, ?)
```

```js
{
  const ids = ['123', '456']
  const sql = prEasyD1.table('Users').delete(ids, '_id')
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}
```

## 代码仓库

[github](https://github.com/breathe97/pr-easy-db)

## 贡献

breathe
