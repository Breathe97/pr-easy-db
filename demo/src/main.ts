import { PrEasyD1 } from '../../src/index'

type TableNames = 'Users' | 'Books'

const prEasyD1 = new PrEasyD1<TableNames>()

// 增加
{
  const { query, values } = prEasyD1.post('Users', [{ name: 'breathe' }])
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}

// 查询
{
  const { query, values } = prEasyD1.get('Users', { name: 'breathe' })
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}

// 修改
{
  const { query, values } = prEasyD1.put('Users', { name: 'breathe' }, { id: '123' })
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
}

// 删除
// {
//   const { query, values } = prEasyD1.delete('Users', [{ name: 'breathe' }])
//   console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;padding:16px 0;', `------->Breathe:{ query, values }`, { query, values })
// }
