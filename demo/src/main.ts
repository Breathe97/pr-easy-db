// import { PrEasyD1 } from '../../src/index'
import { PrEasyD1 } from 'pr-easy-db'

type TableNames = 'Users' | 'Books'

const prEasyD1 = new PrEasyD1<TableNames>()

// 增加 INSERT INTO Users (_id, username, age) VALUES (?, ?, ?)
{
  const sql = prEasyD1.table('Users').insert([{ _id: 123, username: 'breathe', age: 12 }])
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}

// 查询 SELECT * FROM Users WHERE ((age = ?) AND ((account LIKE ? OR mobile LIKE ? OR emali LIKE ?)) AND (state = ?)) LIMIT ?, ?
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

// 修改 UPDATE Users SET name = ?, age = ? WHERE (_id = ?)
{
  const sql = prEasyD1.table('Users').update({ _id: 123, name: 'aaaa', age: 44 }, '_id')
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}

// 删除 DELETE FROM Users WHERE _id IN (?, ?)
{
  const ids = ['123', '456']
  const sql = prEasyD1.table('Users').delete(ids, '_id')
  const { query, values } = sql.end()
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}
