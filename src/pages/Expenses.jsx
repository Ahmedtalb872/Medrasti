import { useState } from 'react'
import { Download, Landmark, Pencil, Plus, Scale, Trash2, TrendingDown, Wallet } from 'lucide-react'
import { useStore } from '../store/AppStore.jsx'
import { sum } from '../utils/finance.js'
import { fmtDate, money, MONTHS, PAYMENT_METHODS, todayIso, toIso } from '../utils/format.js'
import { categoryColor, EXPENSE_CATEGORIES, expenseNo } from '../utils/expenses.js'
import { branchName } from '../utils/branches.js'
import { Empty, Modal, PageHeader, StatCard } from '../components/ui.jsx'
import { BranchField, useShowBranch } from '../components/Branches.jsx'

function ExpenseForm({ initial, onSubmit, onCancel }) {
  const { state, branch } = useStore()
  const [form, setForm] = useState(
    initial ?? { date: todayIso(), category: EXPENSE_CATEGORIES[0].name, amount: '', description: '', method: PAYMENT_METHODS[0], branchId: branch.defaultId },
  )
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        const amount = Number(form.amount)
        if (!(amount > 0)) return
        onSubmit({ ...form, amount, description: form.description.trim(), branchId: form.branchId ?? branch.defaultId })
      }}
    >
      <div className="form-grid">
        <label className="field">
          <span>الفئة</span>
          <select value={form.category} onChange={set('category')}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>المبلغ ({state.settings.currency})</span>
          <input type="number" min="1" value={form.amount} onChange={set('amount')} required autoFocus />
        </label>
        <label className="field">
          <span>التاريخ</span>
          <input type="date" value={form.date} onChange={set('date')} required />
        </label>
        <label className="field">
          <span>طريقة الدفع</span>
          <select value={form.method} onChange={set('method')}>
            {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <BranchField value={form.branchId} onChange={(id) => setForm({ ...form, branchId: id })} />
        <label className="field field--full">
          <span>الوصف</span>
          <input value={form.description} onChange={set('description')} placeholder="مثال: رواتب المعلمين لشهر نوفمبر" />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>إلغاء</button>
        <button type="submit" className="btn btn--primary">حفظ</button>
      </div>
    </form>
  )
}

function exportCsv(rows, state) {
  const head = ['رقم', 'التاريخ', 'الفئة', 'الوصف', 'المبلغ', 'طريقة الدفع', 'الفرع']
  const lines = [head, ...rows.map((e) => [expenseNo(e), e.date, e.category, e.description, e.amount, e.method, branchName(state, e.branchId)])]
  const csv = lines.map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${todayIso()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Expenses() {
  const store = useStore()
  const { state, full } = store
  const { currency } = state.settings
  const showBranch = useShowBranch()
  const [modal, setModal] = useState(null)
  const [month, setMonth] = useState(() => todayIso().slice(0, 7))
  const [category, setCategory] = useState('')

  // الأشهر التي فيها مصاريف أو مدفوعات، مع الشهر الحالي
  const months = [...new Set([todayIso().slice(0, 7), ...state.expenses.map((e) => e.date.slice(0, 7)), ...state.payments.map((p) => p.date.slice(0, 7))])]
    .sort()
    .reverse()
  const monthLabel = (m) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`
  const inMonth = (d) => !month || d.startsWith(month)

  const monthExpenses = state.expenses.filter((e) => inMonth(e.date))
  const rows = monthExpenses.filter((e) => !category || e.category === category).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  const spent = sum(monthExpenses)
  const collected = sum(state.payments.filter((p) => inMonth(p.date)))
  const net = collected - spent
  const yearStart = toIso(new Date(state.settings.startYear, state.settings.startMonth - 1, 1))
  const yearSpent = sum(state.expenses.filter((e) => e.date >= yearStart))

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({ ...c, total: sum(monthExpenses.filter((e) => e.category === c.name)) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
  const top = byCategory[0]?.total || 1

  return (
    <>
      <PageHeader title="المصاريف" subtitle="رواتب، إيجار، فواتير، ومستلزمات المدرسة">
        <button className="btn btn--ghost" onClick={() => exportCsv(rows, full)} disabled={!rows.length}>
          <Download size={16} /> تصدير
        </button>
        <button className="btn btn--primary" onClick={() => setModal('new')}><Plus size={18} /> إضافة مصروف</button>
      </PageHeader>

      <div className="toolbar">
        <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="الشهر">
          <option value="">كل الأشهر</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="الفئة">
          <option value="">كل الفئات</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div className="stats">
        <StatCard icon={TrendingDown} label={month ? 'مصاريف الشهر' : 'كل المصاريف'} value={<>{money(spent, '')}<small>{currency}</small></>} hint={`${monthExpenses.length} عملية`} tone="danger" />
        <StatCard icon={Wallet} label={month ? 'المحصَّل في الشهر' : 'كل المحصَّل'} value={<>{money(collected, '')}<small>{currency}</small></>} tone="success" />
        <StatCard
          icon={Scale}
          label="الصافي"
          value={<span className={net < 0 ? 'text-danger' : ''}><bdi dir="ltr">{money(net, '')}</bdi><small>{currency}</small></span>}
          trend={{ dir: net < 0 ? 'down' : 'up', text: net < 0 ? 'عجز' : 'ربح', tone: net < 0 ? 'danger' : 'success' }}
          hint="المحصَّل ناقص المصاريف"
        />
        <StatCard icon={Landmark} label="مصاريف العام الدراسي" value={<>{money(yearSpent, '')}<small>{currency}</small></>} hint={state.settings.academicYear} tone="violet" />
      </div>

      <div className="exp-grid">
        <div className="panel panel--flush">
          {rows.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>الفئة</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th>{showBranch && <th>الفرع</th>}<th></th></tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id}>
                      <td><span className="cat-tag"><i style={{ background: categoryColor(e.category) }} />{e.category}</span></td>
                      <td className="cell-stack">
                        <span>{e.description || '-'}</span>
                        <span className="muted small-line" dir="ltr">{expenseNo(e)} · {e.method}</span>
                      </td>
                      <td><b className="text-danger">{money(e.amount, currency)}</b></td>
                      <td>{fmtDate(e.date)}</td>
                      {showBranch && <td>{branchName(full, e.branchId)}</td>}
                      <td className="row-actions">
                        <button className="icon-btn" title="تعديل" onClick={() => setModal(e)}><Pencil size={17} /></button>
                        <button className="icon-btn icon-btn--danger" title="حذف" onClick={() => confirm(`حذف المصروف ${expenseNo(e)}؟`) && store.deleteExpense(e.id)}>
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>لا توجد مصاريف {month && `في ${monthLabel(month)}`}</Empty>
          )}
        </div>

        <div className="panel">
          <div className="panel__head"><h2>حسب الفئة</h2></div>
          {byCategory.length ? (
            <ul className="cat-bars">
              {byCategory.map((c) => (
                <li key={c.name}>
                  <div><span><i style={{ background: c.color }} />{c.name}</span><b>{money(c.total, currency)}</b></div>
                  <div className="cat-bars__track"><div style={{ width: `${(c.total / top) * 100}%`, background: c.color }} /></div>
                  <small>{Math.round((c.total / spent) * 100)}%</small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>لا توجد بيانات</Empty>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'إضافة مصروف' : `تعديل ${expenseNo(modal)}`} onClose={() => setModal(null)}>
          <ExpenseForm
            initial={modal === 'new' ? null : modal}
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              const ok = modal === 'new' ? await store.addExpense(data) : await store.updateExpense(modal.id, data)
              if (ok === null) return
              if (modal === 'new') setMonth(data.date.slice(0, 7))
              setModal(null)
            }}
          />
        </Modal>
      )}
    </>
  )
}
